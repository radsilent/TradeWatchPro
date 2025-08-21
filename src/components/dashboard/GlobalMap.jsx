import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, AlertTriangle, XCircle, CheckCircle, MapPin } from "lucide-react";

export default function GlobalMap({ 
  ports = [], 
  disruptions = [], 
  tariffs = [],
  selectedPort, 
  onPortClick, 
  center = [20, 0], 
  zoom = 2, 
  isLoading = false,
  layerVisibility: externalLayerVisibility,
  onLayerVisibilityChange
}) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  
  // Layer visibility controls for performance - use external controls if provided
  const [internalLayerVisibility, setInternalLayerVisibility] = useState({
    ports: true,
    disruptions: true, // Make sure disruptions are visible
    tariffs: false, // Start hidden for performance  
    routes: true
  });
  
  // Use external layer visibility if provided, otherwise use internal state
  const layerVisibility = externalLayerVisibility || internalLayerVisibility;
  const setLayerVisibility = onLayerVisibilityChange || setInternalLayerVisibility;
  


  console.log('🗺️ GlobalMap component rendered with:', { 
    portsLength: ports.length, 
    disruptionsLength: disruptions.length,
    tariffsLength: tariffs.length,
    layerVisibility,
    isLoading 
  });
  
  // Debug first port and disruption data
  if (ports.length > 0) {
    console.log('🗺️ First port data:', ports[0]);
  }
  if (disruptions.length > 0) {
    console.log('🗺️ First disruption data:', disruptions[0]);
  }

  useEffect(() => {
    setIsClient(true);
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 1000);

    // Mobile detection
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-full bg-slate-800/50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-slate-300">Loading Global Trade Map...</div>
        </div>
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="w-full h-full bg-slate-800/50 rounded-lg flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  const MapComponent = () => {
    const [mapInstance, setMapInstance] = useState(null);
    const [L, setL] = useState(null);
    const mapRef = React.useRef(null);

    useEffect(() => {
      if (typeof window !== 'undefined') {
        import('leaflet').then((leaflet) => {
          setL(leaflet.default);
        });
      }
    }, []);

    useEffect(() => {
      if (!L || !mapRef.current || mapInstance) return;

      try {
        // Initialize map
        const map = L.map(mapRef.current, {
            center: center,
            zoom: zoom,
            zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          touchZoom: true,
          dragging: true,
          worldCopyJump: false,
          maxBounds: [[-90, -180], [90, 180]],
          maxBoundsViscosity: 1.0
          });

          // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          tileSize: 256,
          }).addTo(map);

          setMapInstance(map);

        return () => {
          if (map) {
            map.remove();
          }
        };
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }, [L, center, zoom]);

    useEffect(() => {
      console.log('🔄 useEffect triggered for addMarkers:', {
        mapInstance: !!mapInstance,
        L: !!L,
        portsLength: ports.length,
        disruptionsLength: disruptions.length,
        tariffsLength: tariffs.length,
        layerVisibility
      });
      
      if (mapInstance && L) {
        console.log('🎯 Calling addMarkers...');
        addMarkers(mapInstance, L);
      } else {
        console.log('⏳ Waiting for map initialization or L library...');
      }
    }, [mapInstance, L, ports, disruptions, tariffs, layerVisibility]);

    const addMarkers = (map, L) => {
      if (!map || !L) {
        console.log('🚨 addMarkers called but map or L is missing:', { map: !!map, L: !!L });
        return;
      }

      console.log('🗺️ GlobalMap addMarkers called with:', { 
        portsCount: ports.length, 
        disruptionsCount: disruptions.length,
        tariffsCount: tariffs.length,
        layerVisibility,
        mapObject: map,
        LObject: L
      });
      
      // Clear existing markers
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Circle) {
          map.removeLayer(layer);
        }
      });



      // Add ports if visible
      console.log('🗺️ Attempting to add ports:', { 
        layerVisible: layerVisibility.ports, 
        portsCount: ports.length,
        firstPort: ports[0] 
      });
      
      if (layerVisibility.ports && ports.length > 0) {
        console.log('🗺️ Adding ports to map...');
        ports.forEach((port, index) => {
          // Handle both array [lat, lng] and object {lat, lng} coordinate formats
          let lat, lng;
          if (port.coordinates) {
            if (Array.isArray(port.coordinates) && port.coordinates.length === 2) {
              [lat, lng] = port.coordinates;
            } else if (port.coordinates.lat && port.coordinates.lng) {
              lat = port.coordinates.lat;
              lng = port.coordinates.lng;
            } else {
              console.log(`⚠️ Port ${index} skipped - invalid coordinates format:`, port.coordinates);
              return;
            }
          } else {
            console.log(`⚠️ Port ${index} skipped - no coordinates:`, port);
            return;
          }
          if (isNaN(lat) || isNaN(lng)) return;

          const portIcon = L.divIcon({
            html: `<div class="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>`,
          iconSize: [12, 12],
            className: 'port-marker'
          });

          const marker = L.marker([lat, lng], { icon: portIcon }).addTo(map);
          console.log(`✅ Port ${index} added: ${port.name} at [${lat}, ${lng}]`);

          const portContent = `
            <div class="port-popup p-4 max-w-sm">
              <h3 class="font-bold text-lg text-slate-900 mb-2">${port.name}</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-slate-600">Country:</span>
                  <span class="font-medium">${port.country}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-600">TEU Capacity:</span>
                  <span class="font-medium">${port.teu_capacity?.toLocaleString() || 'N/A'}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-600">Strategic Score:</span>
                  <span class="font-medium">${port.strategic_importance || 'N/A'}</span>
            </div>
          </div>
          </div>
          `;

          marker.bindPopup(portContent);
          
          marker.on('click', () => {
            if (onPortClick) {
              onPortClick(port);
            }
          });
        });
      }

      // Add disruptions if visible
      console.log('🚨 Attempting to add disruptions:', { 
        layerVisible: layerVisibility.disruptions, 
        disruptionsCount: disruptions.length,
        firstDisruption: disruptions[0] 
      });
      
      if (layerVisibility.disruptions && disruptions.length > 0) {
        console.log('🚨 Adding disruptions to map...');
        disruptions.forEach((disruption, index) => {
          // Handle both array [lat, lng] and object {lat, lng} coordinate formats
          let lat, lng;
          if (disruption.coordinates) {
            if (Array.isArray(disruption.coordinates) && disruption.coordinates.length === 2) {
              [lat, lng] = disruption.coordinates;
            } else if (disruption.coordinates.lat && disruption.coordinates.lng) {
              lat = disruption.coordinates.lat;
              lng = disruption.coordinates.lng;
            } else {
              console.log(`⚠️ Disruption ${index} skipped - invalid coordinates format:`, disruption.coordinates);
              return;
            }
          } else {
            console.log(`⚠️ Disruption ${index} skipped - no coordinates:`, disruption);
            return;
          }
          if (isNaN(lat) || isNaN(lng)) return;

          const severityColors = {
            'Critical': '#ef4444',
            'High': '#f97316', 
            'Medium': '#eab308',
            'Low': '#22c55e'
          };

          const color = severityColors[disruption.severity] || '#64748b';

          const circle = L.circle([lat, lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.7,
            radius: 80000,  // Increased from 50000 to 80000 for larger, more visible icons
            weight: 3       // Thicker border for better visibility
          }).addTo(map);
          console.log(`✅ Disruption ${index} added: ${disruption.title} at [${lat}, ${lng}] (${disruption.severity})`);

          const disruptionContent = `
            <div class="disruption-popup p-4 max-w-sm">
              <h3 class="font-bold text-lg text-slate-900 mb-2">${disruption.title}</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-slate-600">Severity:</span>
                  <span class="font-medium" style="color: ${color}">${disruption.severity}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-600">Type:</span>
                  <span class="font-medium">${disruption.type}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-600">Status:</span>
                  <span class="font-medium">${disruption.status}</span>
                </div>
                ${disruption.description ? `<p class="text-slate-700 mt-2">${disruption.description}</p>` : ''}
              </div>
            </div>
          `;

          circle.bindPopup(disruptionContent);
        });
      }

      // Add tariffs if visible (performance improvement - only when toggled on)
      if (layerVisibility.tariffs) {
        console.log('Adding tariff markers for', tariffs.length, 'tariffs');
        tariffs.slice(0, 50).forEach((tariff) => { // Limit to 50 for performance
          if (!tariff.countries || tariff.countries.length === 0) return;

          // Simplified country coordinates
          const countryCoordinates = {
            'China': [35.8617, 104.1954],
            'United States': [39.8283, -98.5795],
            'Germany': [51.1657, 10.4515],
            'Japan': [36.2048, 138.2529],
            'Canada': [56.1304, -106.3468],
            'Mexico': [23.6345, -102.5528],
            'India': [20.5937, 78.9629],
            'South Korea': [35.9078, 127.7669],
            'Brazil': [-14.2350, -51.9253]
          };

          // Safely parse tariff rate with validation
          let tariffRate = tariff.currentRate || tariff.rate || tariff.tariff_rate || 0;
          tariffRate = typeof tariffRate === 'string' ? parseFloat(tariffRate) : tariffRate;
          tariffRate = isNaN(tariffRate) ? 0 : tariffRate;

          tariff.countries.forEach((country) => {
            const coords = countryCoordinates[country];
            if (!coords) return;

            const tariffIcon = L.divIcon({
              html: `<div class="w-4 h-4 bg-red-600 rounded border-2 border-white shadow-lg flex items-center justify-center">
                       <span class="text-white text-xs font-bold">$</span>
                     </div>`,
              iconSize: [16, 16],
              className: 'tariff-marker'
            });

            const marker = L.marker(coords, { icon: tariffIcon }).addTo(map);

            const tariffContent = `
              <div class="tariff-popup p-4 max-w-sm">
                <h3 class="font-bold text-lg text-slate-900 mb-2">${tariff.title}</h3>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-slate-600">Tariff Rate:</span>
                    <span class="font-bold text-red-600">${tariffRate.toFixed(1)}%</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-600">Country:</span>
                    <span class="font-medium">${country}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-600">Status:</span>
                    <span class="font-medium">${tariff.status || 'Active'}</span>
                  </div>
                </div>
              </div>
            `;

            marker.bindPopup(tariffContent);
        });
      });
      }

      // Vessels are only shown on the dedicated vessel tracking page for performance
    };

    return (
      <div className="w-full h-full rounded-lg relative">
        <div ref={mapRef} className="w-full h-full rounded-lg" />
      </div>
    );
  };

  return (
    <div className="w-full h-full rounded-lg relative">
      <MapComponent />
      
      {/* Map Legend with Layer Controls */}
      <div className={`absolute ${isMobile ? 'top-2 right-2' : 'top-4 right-4 max-w-xs'} bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg ${isMobile ? 'p-2' : 'p-4'} z-[1000] ${isMobile ? 'max-w-[200px]' : ''}`}>
        <div className={`font-semibold text-slate-900 ${isMobile ? 'mb-2 text-sm' : 'mb-3'} flex items-center ${isMobile ? 'justify-between' : ''}`}>
          <div className="flex items-center">
            <svg className={`${isMobile ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span>{isMobile ? 'Layers' : 'Map Layers'}</span>
          </div>
          {isMobile && (
            <button
              onClick={() => setLegendCollapsed(!legendCollapsed)}
              className="p-1 hover:bg-slate-200 rounded"
            >
              <svg className="w-3 h-3 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d={legendCollapsed ? "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" : "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"} clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
        
        {!(isMobile && legendCollapsed) && (
          <div className={`space-y-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {/* Layer Controls */}
            <div className="space-y-2">
              {/* Ports Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full border border-white shadow-sm"></div>
                  <span className="text-slate-700">Ports ({ports.length})</span>
                </div>
                <button
                  onClick={() => setLayerVisibility(prev => ({ ...prev, ports: !prev.ports }))}
                  className={`w-8 h-4 rounded-full transition-colors ${layerVisibility.ports ? 'bg-blue-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-3 h-3 bg-white rounded-full shadow transform transition-transform ${layerVisibility.ports ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </button>
              </div>
              
              {/* Disruptions Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full border border-white shadow-sm"></div>
                  <span className="text-slate-700">Disruptions ({disruptions.length})</span>
                </div>
                <button
                  onClick={() => setLayerVisibility(prev => ({ ...prev, disruptions: !prev.disruptions }))}
                  className={`w-8 h-4 rounded-full transition-colors ${layerVisibility.disruptions ? 'bg-red-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-3 h-3 bg-white rounded-full shadow transform transition-transform ${layerVisibility.disruptions ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </button>
              </div>
              
              {/* Tariffs Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-600 rounded-sm border border-white shadow-sm flex items-center justify-center">
                    <span className="text-white text-xs font-bold">$</span>
                  </div>
                  <span className="text-slate-700">Tariffs ({tariffs.length})</span>
                </div>
                <button
                  onClick={() => setLayerVisibility(prev => ({ ...prev, tariffs: !prev.tariffs }))}
                  className={`w-8 h-4 rounded-full transition-colors ${layerVisibility.tariffs ? 'bg-red-600' : 'bg-gray-300'}`}
                >
                  <div className={`w-3 h-3 bg-white rounded-full shadow transform transition-transform ${layerVisibility.tariffs ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </button>
              </div>
              

            </div>
            
            {/* Performance Note */}
            <div className="pt-2 border-t border-slate-200 text-xs text-slate-500">
              <p>💡 Toggle layers off to improve performance</p>
              <p className="mt-1">🚢 For vessel tracking, visit the dedicated Vessel Tracking page</p>
            </div>
          </div>
        )}
      </div>
      
      {!mapLoaded && (
        <div className="absolute inset-0 bg-slate-800/50 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <div className="text-slate-300 text-lg">Initializing Global Map...</div>
          </div>
        </div>
      )}
    </div>
  );
}
