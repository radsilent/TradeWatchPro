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

interface SimpleVesselMapProps {
  vessels: Vessel[];
  height?: string;
}

const SimpleVesselMap: React.FC<SimpleVesselMapProps> = ({ vessels, height = '400px' }) => {
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

    // Add vessel markers with simple default icons
    let addedCount = 0;
    vessels.forEach((vessel, index) => {
      if (vessel.latitude && vessel.longitude && 
          Math.abs(vessel.latitude) <= 90 && Math.abs(vessel.longitude) <= 180) {
        
        // Use simple default Leaflet marker
        const marker = L.marker([vessel.latitude, vessel.longitude]);
        
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

    // Fit bounds if we have vessels
    if (addedCount > 0) {
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
    <div className="simple-vessel-map-container">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Live Vessel Tracking</h3>
        <div className="text-sm text-muted-foreground">
          {vessels.length} vessels
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
