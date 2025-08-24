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

interface Disruption {
  id: string;
  title: string;
  description: string;
  latitude?: number;
  longitude?: number;
  severity: string;
  type: string;
  location?: string;
}

interface SimpleVesselMapProps {
  vessels: Vessel[];
  disruptions?: Disruption[];
  height?: string;
}

const SimpleVesselMap: React.FC<SimpleVesselMapProps> = ({ vessels, disruptions = [], height = '400px' }) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Initialize new map
    console.log('🗺️ Initializing simple vessel map...');
    mapRef.current = L.map(containerRef.current).setView([30, 0], 2);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(mapRef.current);

    console.log(`🚢 Adding ${vessels.length} vessels to map...`);

    // Add vessel markers with colored icons based on risk level
    let addedCount = 0;
    vessels.forEach((vessel, index) => {
      if (vessel.latitude && vessel.longitude && 
          Math.abs(vessel.latitude) <= 90 && Math.abs(vessel.longitude) <= 180) {
        
        // Create colored marker based on risk level (matching your reference)
        const iconColor = vessel.riskLevel === 'High' ? '#dc2626' :     // Red
                         vessel.riskLevel === 'Medium' ? '#ea580c' :   // Orange  
                         vessel.impacted ? '#eab308' :                 // Yellow
                         '#16a34a';                                    // Green
        
        const customIcon = L.divIcon({
          className: 'custom-vessel-marker',
          html: `<div style="
            background-color: ${iconColor};
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });

        const marker = L.marker([vessel.latitude, vessel.longitude], { icon: customIcon });
        
        // Simple popup
        const popupContent = `
          <div>
            <h4><strong>${vessel.name || 'Unknown Vessel'}</strong></h4>
            <p>Position: ${vessel.latitude.toFixed(4)}, ${vessel.longitude.toFixed(4)}</p>
            <p>Speed: ${vessel.speed ? Math.round(vessel.speed) : 0} knots</p>
            <p>Risk: ${vessel.riskLevel || 'Low'}</p>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        marker.addTo(mapRef.current!);
        addedCount++;
      }
    });

    console.log(`✅ Added ${addedCount} vessels to map successfully`);

    // Add disruption markers
    let disruptionCount = 0;
    disruptions.forEach((disruption) => {
      if (disruption.latitude && disruption.longitude && 
          Math.abs(disruption.latitude) <= 90 && Math.abs(disruption.longitude) <= 180) {
        
        // Create disruption icon based on severity
        const disruptionColor = disruption.severity === 'high' ? '#dc2626' :     // Red
                               disruption.severity === 'medium' ? '#ea580c' :   // Orange  
                               '#eab308';                                        // Yellow
        
        const disruptionIcon = L.divIcon({
          className: 'custom-disruption-marker',
          html: `<div style="
            background-color: ${disruptionColor};
            width: 16px;
            height: 16px;
            border-radius: 3px;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
            font-weight: bold;
          ">⚠</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const disruptionMarker = L.marker([disruption.latitude, disruption.longitude], { icon: disruptionIcon });
        
        // Disruption popup
        const disruptionPopup = `
          <div>
            <h4><strong>🚨 ${disruption.title}</strong></h4>
            <p><strong>Type:</strong> ${disruption.type}</p>
            <p><strong>Severity:</strong> <span style="color: ${disruptionColor}; font-weight: bold;">${disruption.severity.toUpperCase()}</span></p>
            <p><strong>Location:</strong> ${disruption.location || 'Maritime Area'}</p>
            <p><strong>Description:</strong> ${disruption.description}</p>
          </div>
        `;
        
        disruptionMarker.bindPopup(disruptionPopup);
        disruptionMarker.addTo(mapRef.current!);
        disruptionCount++;
      }
    });

    console.log(`✅ Added ${disruptionCount} disruptions to map`);

    // Fit bounds if we have vessels or disruptions
    if (addedCount > 0 || disruptionCount > 0) {
      const group = new L.featureGroup();
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          group.addLayer(layer);
        }
      });
      
      if (group.getLayers().length > 0) {
        mapRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
        console.log('🎯 Map bounds fitted to vessels');
      }
    }

  }, [vessels, disruptions]);

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
    <div className="simple-vessel-map-container">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Live Vessel Tracking & Disruptions</h3>
        <div className="text-sm text-muted-foreground">
          {vessels.length} vessels • {disruptions.length} disruptions
        </div>
      </div>
      
      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Low Risk Vessels</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span>Medium Risk</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>High Risk</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-600 rounded-sm flex items-center justify-center text-white text-xs">⚠</div>
          <span>Disruptions</span>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        style={{ height, width: '100%' }}
        className="rounded-lg border overflow-hidden bg-gray-100"
      />
      
      {vessels.length === 0 && (
        <div className="mt-4 text-center text-gray-500">
          <p>Loading vessel data...</p>
        </div>
      )}
    </div>
  );
};

export default SimpleVesselMap;
