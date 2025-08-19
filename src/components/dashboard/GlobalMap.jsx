import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, AlertTriangle, XCircle, CheckCircle, MapPin } from "lucide-react";

export default function GlobalMap({ 
  ports = [], 
  disruptions = [], 
  selectedPort, 
  onPortClick, 
  center = [20, 0], 
  zoom = 2, 
  isLoading = false 
}) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  console.log('GlobalMap component rendered with:', { 
    portsLength: ports.length, 
    disruptionsLength: disruptions.length, 
    isLoading 
  });

  useEffect(() => {
    setIsClient(true);
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-full bg-slate-800/50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4 bg-slate-700" />
          <p className="text-slate-400">Loading global port data...</p>
        </div>
      </div>
    );
  }

  // Don't render map on server side
  if (!isClient) {
    return (
      <div className="w-full h-full bg-slate-800/50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">MAP</div>
          <h3 className="text-xl font-semibold text-slate-200 mb-2">Interactive Global Map</h3>
          <p className="text-slate-400">Port locations and disruption tracking</p>
          <p className="text-sm text-slate-500 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // Client-side only map component
  const MapComponent = () => {
    const [L, setL] = useState(null);
    const [mapInstance, setMapInstance] = useState(null);
    const mapRef = React.useRef(null);

    useEffect(() => {
      const loadMap = async () => {
        try {
          // Dynamically import Leaflet only on client
          const Leaflet = await import('leaflet');
          await import('leaflet/dist/leaflet.css');
          setL(Leaflet);

          if (!mapRef.current) return;

          // Create map
          const map = Leaflet.map(mapRef.current, {
            center: center,
            zoom: zoom,
            zoomControl: true,
            attributionControl: true
          });

          // Add tile layer
          Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(map);

          setMapInstance(map);

          // Add markers after map is ready
          setTimeout(() => {
            addMarkers(map, Leaflet);
          }, 500);

        } catch (error) {
          console.error('Error loading map:', error);
        }
      };

      loadMap();
    }, []);

    // Update markers when data changes
    useEffect(() => {
      if (mapInstance && L) {
        console.log('Data changed, updating markers...', { 
          portsCount: ports.length, 
          disruptionsCount: disruptions.length 
        });
        addMarkers(mapInstance, L);
      }
    }, [mapInstance, L, ports, disruptions]);

    const addMarkers = (map, L) => {
      if (!map || !L) return;

      console.log('GlobalMap addMarkers called with:', { 
        portsCount: ports.length, 
        disruptionsCount: disruptions.length 
      });
      
      // Clear existing markers
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Circle) {
          map.removeLayer(layer);
        }
      });
      
      if (ports.length > 0) {
        console.log('Sample port:', ports[0]);
      }
      
      if (disruptions.length > 0) {
        console.log('Sample disruption:', disruptions[0]);
      }

      // Create custom icons
      const createCustomIcon = (status) => {
        const colors = {
          operational: '#10b981',
          normal: '#10b981',
          minor_disruption: '#f59e0b', 
          major_disruption: '#ef4444',
          closed: '#dc2626'
        };
        
        return L.divIcon({
          html: `<div style="background-color: ${colors[status]}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [12, 12],
          className: 'custom-marker'
        });
      };

      // Add port markers
      ports.forEach((port) => {
        if (!port.coordinates?.lat || !port.coordinates?.lng) return;
        
        const marker = L.marker([port.coordinates.lat, port.coordinates.lng], {
          icon: createCustomIcon(port.status)
        }).addTo(map);

        const popupContent = document.createElement('div');
        popupContent.className = 'p-3 min-w-64';
        popupContent.innerHTML = `
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="font-bold text-slate-900 text-lg">${port.name || 'Unknown Port'}</h3>
              <p class="text-slate-600 text-sm">${port.country || 'Unknown Country'}</p>
            </div>
          </div>
          <div class="space-y-2 mb-3">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
              ${port.status === 'operational' || port.status === 'normal' ? 'Operational' : 
                port.status === 'minor_disruption' ? 'Minor Disruption' :
                port.status === 'major_disruption' ? 'Major Disruption' : 'Closed'}
            </span>
            ${port.port_code ? `<p class="text-xs text-slate-500">Code: ${port.port_code}</p>` : ''}
            ${port.annual_throughput ? `<p class="text-xs text-slate-500">Annual Throughput: ${(port.annual_throughput / 1000000).toFixed(1)}M TEU</p>` : ''}
          </div>
          ${port.strategic_importance ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-slate-900 border border-slate-200">Priority ${port.strategic_importance}</span>` : ''}
        `;

        marker.bindPopup(popupContent);
        marker.on('click', () => onPortClick && onPortClick(port));
      });

      // Add disruption areas
      disruptions.forEach((disruption) => {
        // Handle both affected_regions and affectedRegions formats
        const regions = disruption.affected_regions || disruption.affectedRegions || [];
        if (!regions || regions.length === 0) {
          console.log('Disruption missing regions:', disruption.title);
          return;
        }
        
        regions.forEach((region, index) => {
          const regionCoordinates = {
            'South China Sea': [16, 112],
            'Persian Gulf': [26, 52],
            'Strait of Hormuz': [26, 56],
            'Suez Canal': [30, 32],
            'Panama Canal': [9, -80],
            'Strait of Malacca': [2, 102],
            'Mediterranean': [36, 15],
            'North Atlantic': [50, -30],
            'Arabian Sea': [18, 65],
            'North Pacific': [35, -120],
            'Red Sea': [20, 38],
            'Gulf of Aden': [12, 45],
            'Indian Ocean': [10, 80],
            'South Atlantic': [-30, -30],
            'Caribbean Sea': [15, -75],
            'Baltic Sea': [60, 20],
            'North Sea': [55, 5],
            'Black Sea': [42, 35],
            'Caspian Sea': [42, 50],
            'Bering Sea': [60, -170],
            'Sea of Japan': [40, 135],
            'Yellow Sea': [35, 123],
            'East China Sea': [30, 125],
            'Philippine Sea': [15, 130],
            'Coral Sea': [-15, 150],
            'Tasman Sea': [-35, 160],
            'Gulf of Mexico': [25, -90],
            'Hudson Bay': [60, -85],
            'Labrador Sea': [55, -60],
            'Norwegian Sea': [70, 0],
            'Greenland Sea': [75, -10],
            'Barents Sea': [75, 30],
            'Kara Sea': [75, 70],
            'Laptev Sea': [75, 120],
            'East Siberian Sea': [75, 170],
            'Chukchi Sea': [70, -170],
            'Beaufort Sea': [70, -140],
            'Arctic Ocean': [80, 0]
          };
          
          const coords = regionCoordinates[region];
          if (!coords) return;
          
          const circle = L.circleMarker(coords, {
            radius: disruption.severity === 'critical' ? 30 : 
                    disruption.severity === 'high' ? 25 : 
                    disruption.severity === 'medium' ? 20 : 15,
            color: disruption.severity === 'critical' ? '#dc2626' : 
                   disruption.severity === 'high' ? '#ef4444' : 
                   disruption.severity === 'medium' ? '#f59e0b' : '#10b981',
            fillColor: disruption.severity === 'critical' ? '#dc2626' : 
                      disruption.severity === 'high' ? '#ef4444' : 
                      disruption.severity === 'medium' ? '#f59e0b' : '#10b981',
            fillOpacity: 0.3,
            weight: 2
          }).addTo(map);

          const disruptionContent = document.createElement('div');
          disruptionContent.className = 'p-2';
          disruptionContent.innerHTML = `
            <h4 class="font-semibold text-slate-900">${disruption.title || 'Unknown Disruption'}</h4>
            <p class="text-sm text-slate-600 mt-1">${disruption.description || 'No description available'}</p>
            <div class="mt-2 space-y-1">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${disruption.severity === 'critical' ? 'bg-red-100 text-red-800' : disruption.severity === 'high' ? 'bg-orange-100 text-orange-800' : disruption.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">${disruption.severity || 'unknown'} impact</span>
              <p class="text-xs text-slate-500">Region: ${region}</p>
              ${disruption.economic_impact ? `<p class="text-xs text-slate-500">Impact: ${disruption.economic_impact}</p>` : ''}
              ${disruption.confidence_score ? `<p class="text-xs text-slate-500">Confidence: ${disruption.confidence_score}%</p>` : ''}
            </div>
          `;

          circle.bindPopup(disruptionContent);
        });
      });
    };

    return <div ref={mapRef} className="w-full h-full rounded-lg" />;
  };

  return (
    <div className="relative w-full h-full">
      <MapComponent />
      
      {!mapLoaded && (
        <div className="absolute inset-0 bg-slate-800/50 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="text-6xl mb-4">MAP</div>
            <h3 className="text-xl font-semibold text-slate-200 mb-2">Interactive Global Map</h3>
            <p className="text-slate-400">Port locations and disruption tracking</p>
            <p className="text-sm text-slate-500 mt-2">Loading Leaflet map...</p>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
        }
        .leaflet-popup-tip {
          background: white;
        }
        .custom-marker {
          background: none !important;
          border: none !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
        }
        .leaflet-control-zoom a {
          background: #1e293b !important;
          color: white !important;
          border: 1px solid #334155 !important;
        }
        .leaflet-control-zoom a:hover {
          background: #334155 !important;
        }
      `}</style>
    </div>
  );
}