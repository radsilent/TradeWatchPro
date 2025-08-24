import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Vessel {
  id: string;
  name: string;
  mmsi?: string;
  type?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  course?: number;
  status?: string;
  flag?: string;
  riskLevel?: string;
  impacted?: boolean;
}

interface VesselMapProps {
  vessels: Vessel[];
  height?: string;
}

const VesselMap: React.FC<VesselMapProps> = ({ vessels, height = '500px' }) => {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup>(L.layerGroup());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Wait for container to be ready
    if (!containerRef.current) return;

    // Initialize map if not already done
    if (!mapRef.current) {
      console.log('🗺️ Initializing Leaflet map...');
      mapRef.current = L.map(containerRef.current).setView([20, 0], 2);
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);
      
      // Add markers layer
      markersRef.current.addTo(mapRef.current);
      console.log('✅ Map initialized successfully');
    }

    // Clear existing markers
    markersRef.current.clearLayers();
    console.log(`🚢 Processing ${vessels.length} vessels for map display...`);

    // Add vessel markers
    let validVesselCount = 0;
    vessels.forEach(vessel => {
      if (vessel.latitude && vessel.longitude && 
          Math.abs(vessel.latitude) <= 90 && Math.abs(vessel.longitude) <= 180) {
        
        // Create custom icon based on risk level
        const iconColor = vessel.riskLevel === 'High' ? 'red' : 
                         vessel.riskLevel === 'Medium' ? 'orange' : 'green';
        
        const customIcon = L.divIcon({
          className: 'custom-vessel-marker',
          html: `<div style="
            background-color: ${iconColor};
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        const marker = L.marker([vessel.latitude, vessel.longitude], { icon: customIcon });
        
        // Create popup content
        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #333;">
              ${vessel.name || 'Unknown Vessel'}
            </h3>
            <div style="font-size: 12px; line-height: 1.4;">
              <p><strong>MMSI:</strong> ${vessel.mmsi || 'N/A'}</p>
              <p><strong>Type:</strong> ${vessel.type || 'Unknown'}</p>
              <p><strong>Position:</strong> ${vessel.latitude.toFixed(4)}, ${vessel.longitude.toFixed(4)}</p>
              <p><strong>Speed:</strong> ${vessel.speed ? Math.round(vessel.speed) : 0} knots</p>
              <p><strong>Status:</strong> ${vessel.status || 'Unknown'}</p>
              <p><strong>Flag:</strong> ${vessel.flag || 'Unknown'}</p>
              <p><strong>Risk Level:</strong> 
                <span style="color: ${iconColor}; font-weight: bold;">
                  ${vessel.riskLevel || 'Low'}
                </span>
              </p>
              ${vessel.impacted ? '<p style="color: red; font-weight: bold;">⚠️ IMPACTED</p>' : ''}
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        markersRef.current.addLayer(marker);
        validVesselCount++;
      }
    });

    console.log(`✅ Added ${validVesselCount} valid vessels to map`);

    // Fit map to show all vessels if we have valid vessels
    const validVessels = vessels.filter(v => 
      v.latitude && v.longitude && 
      Math.abs(v.latitude) <= 90 && Math.abs(v.longitude) <= 180
    );

    if (validVessels.length > 0 && mapRef.current) {
      const group = new L.featureGroup(markersRef.current.getLayers());
      if (group.getBounds().isValid()) {
        mapRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
        console.log(`🎯 Map fitted to show ${validVessels.length} vessels`);
      }
    }

  }, [vessels]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="vessel-map-container">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Low Risk</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Medium Risk</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>High Risk</span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {vessels.length} vessels displayed
        </div>
      </div>
      
      <div 
        ref={containerRef}
        style={{ height, width: '100%' }}
        className="rounded-lg border overflow-hidden"
      />
      
      {vessels.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">Loading vessel data...</p>
        </div>
      )}
    </div>
  );
};

export default VesselMap;