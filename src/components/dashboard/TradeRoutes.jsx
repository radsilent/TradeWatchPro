import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ship, TrendingUp, Globe, MapPin } from "lucide-react";

export default function TradeRoutes({ 
  isLoading = false,
  className = "" 
}) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Mobile detection
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Major global trade routes data with realistic maritime waypoints
  const tradeRoutes = [
    {
      id: 'asia_europe',
      name: 'Asia-Europe Route',
      description: 'Primary route connecting Asian manufacturing hubs with European markets via Indian Ocean and Suez Canal',
      waypoints: [
        { name: 'Shanghai', coords: [31.2304, 121.4737] },
        { name: 'Hong Kong', coords: [22.2783, 114.1747] },
        { name: 'Singapore', coords: [1.2644, 103.8391] },
        { name: 'Colombo', coords: [6.9271, 79.8612] },
        { name: 'Red Sea Entry', coords: [12.6392, 43.3724] },
        { name: 'Suez Canal', coords: [30.0444, 32.3917] },
        { name: 'Mediterranean', coords: [34.0000, 18.0000] },
        { name: 'Gibraltar', coords: [36.1408, -5.3536] },
        { name: 'Rotterdam', coords: [51.9244, 4.4777] }
      ],
      volume: '24.5M TEU',
      value: '$1.24T',
      color: '#3b82f6',
      status: 'Active',
      risk: 'High',
      growth: '+2.3%'
    },
    {
      id: 'trans_pacific_eastbound',
      name: 'Trans-Pacific Eastbound',
      description: 'Asia to North America - manufactured goods from Asian ports to US West Coast',
      segments: [
        {
          name: 'Asia Departure',
          waypoints: [
            { name: 'Shanghai', coords: [31.2304, 121.4737] },
            { name: 'Busan', coords: [35.1796, 129.0756] },
            { name: 'Tokyo', coords: [35.6528, 139.7594] },
            { name: 'North Pacific', coords: [42.0000, 155.0000] }
          ]
        },
        {
          name: 'Pacific Crossing',
          waypoints: [
            { name: 'North Pacific', coords: [42.0000, -155.0000] },
            { name: 'Honolulu', coords: [21.3099, -157.8581] },
            { name: 'US West Coast Approach', coords: [35.0000, -125.0000] },
            { name: 'Los Angeles', coords: [33.7406, -118.2484] }
          ]
        }
      ],
      volume: '14.2M TEU',
      value: '$680B',
      color: '#10b981',
      status: 'Active',
      risk: 'Medium',
      growth: '+1.8%'
    },
    {
      id: 'trans_pacific_westbound',
      name: 'Trans-Pacific Westbound',
      description: 'North America to Asia - agricultural products and raw materials to Asian markets',
      segments: [
        {
          name: 'US Departure',
          waypoints: [
            { name: 'Long Beach', coords: [33.7658, -118.1944] },
            { name: 'Oakland', coords: [37.8044, -122.2712] },
            { name: 'Seattle', coords: [47.6062, -122.3321] },
            { name: 'North Pacific West', coords: [45.0000, -140.0000] }
          ]
        },
        {
          name: 'Return Crossing',
          waypoints: [
            { name: 'North Pacific East', coords: [45.0000, 160.0000] },
            { name: 'Japan Approach', coords: [40.0000, 145.0000] },
            { name: 'Tokyo', coords: [35.6528, 139.7594] },
            { name: 'Shanghai', coords: [31.2304, 121.4737] }
          ]
        }
      ],
      volume: '4.5M TEU',
      value: '$300B',
      color: '#059669',
      status: 'Active',
      risk: 'Medium',
      growth: '+0.9%'
    },
    {
      id: 'asia_middle_east',
      name: 'Asia-Middle East Route',
      description: 'Energy and trade corridor between Asia and Gulf states through Arabian Sea',
      waypoints: [
        { name: 'Singapore', coords: [1.2644, 103.8391] },
        { name: 'Strait of Malacca', coords: [2.0000, 102.0000] },
        { name: 'Colombo', coords: [6.9271, 79.8612] },
        { name: 'Arabian Sea', coords: [18.0000, 65.0000] },
        { name: 'Strait of Hormuz', coords: [26.0000, 56.0000] },
        { name: 'Jebel Ali', coords: [25.0112, 55.1171] },
        { name: 'Kuwait', coords: [29.3759, 47.9774] }
      ],
      volume: '12.3M TEU',
      value: '$620B',
      color: '#f59e0b',
      status: 'Active',
      risk: 'Critical',
      growth: '+3.1%'
    },
    {
      id: 'europe_americas',
      name: 'Europe-Americas Route',
      description: 'Atlantic crossing connecting European and American markets via North Atlantic shipping lanes',
      waypoints: [
        { name: 'Rotterdam', coords: [51.9244, 4.4777] },
        { name: 'Hamburg', coords: [53.5403, 9.9847] },
        { name: 'English Channel', coords: [50.0000, 0.0000] },
        { name: 'Biscay Bay', coords: [45.0000, -5.0000] },
        { name: 'Mid-Atlantic', coords: [45.0000, -30.0000] },
        { name: 'Newfoundland', coords: [50.0000, -55.0000] },
        { name: 'New York', coords: [40.6717, -74.0067] },
        { name: 'Savannah', coords: [32.0835, -81.0998] }
      ],
      volume: '9.8M TEU',
      value: '$540B',
      color: '#8b5cf6',
      status: 'Active',
      risk: 'Low',
      growth: '+1.2%'
    },
    {
      id: 'intra_asia',
      name: 'Intra-Asia Route',
      description: 'Regional trade within Asian countries and territories through South China Sea',
      waypoints: [
        { name: 'Shanghai', coords: [31.2304, 121.4737] },
        { name: 'Ningbo', coords: [29.8683, 121.5440] },
        { name: 'Hong Kong', coords: [22.2783, 114.1747] },
        { name: 'South China Sea', coords: [15.0000, 115.0000] },
        { name: 'Manila', coords: [14.5995, 120.9842] },
        { name: 'Singapore', coords: [1.2644, 103.8391] },
        { name: 'Jakarta', coords: [-6.2088, 106.8456] },
        { name: 'Busan', coords: [35.1796, 129.0756] }
      ],
      volume: '15.2M TEU',
      value: '$450B',
      color: '#ef4444',
      status: 'Active',
      risk: 'Medium',
      growth: '+4.2%'
    },
    {
      id: 'panama_route',
      name: 'Panama Canal Route',
      description: 'Connecting Pacific and Atlantic via Panama Canal through Central American waters',
      waypoints: [
        { name: 'Los Angeles', coords: [33.7406, -118.2484] },
        { name: 'Baja California', coords: [25.0000, -110.0000] },
        { name: 'Acapulco', coords: [16.8531, -99.8237] },
        { name: 'Central America', coords: [10.0000, -85.0000] },
        { name: 'Panama Canal', coords: [9.0820, -79.7674] },
        { name: 'Caribbean Sea', coords: [15.0000, -75.0000] },
        { name: 'Miami', coords: [25.7617, -80.1918] },
        { name: 'New York', coords: [40.6717, -74.0067] }
      ],
      volume: '6.8M TEU',
      value: '$380B',
      color: '#06b6d4',
      status: 'Active',
      risk: 'High',
      growth: '+0.8%'
    },
    {
      id: 'northern_sea_route_westbound',
      name: 'Northern Sea Route Westbound',
      description: 'Arctic route from Asia to Europe through Russian Arctic waters (seasonal)',
      segments: [
        {
          name: 'Pacific to Bering',
          waypoints: [
            { name: 'Vladivostok', coords: [43.1332, 131.9113] },
            { name: 'Sakhalin Island', coords: [52.0000, 143.0000] },
            { name: 'Bering Strait', coords: [65.7500, -168.0000] },
            { name: 'Chukchi Sea', coords: [70.0000, -170.0000] }
          ]
        },
        {
          name: 'Arctic Ocean East',
          waypoints: [
            { name: 'Chukchi Sea Central', coords: [72.0000, -165.0000] },
            { name: 'Arctic Ocean North', coords: [75.0000, -150.0000] },
            { name: 'Arctic Ocean Central', coords: [78.0000, -120.0000] }
          ]
        },
        {
          name: 'Arctic Ocean West', 
          waypoints: [
            { name: 'Arctic Ocean North West', coords: [78.0000, 120.0000] },
            { name: 'East Siberian Sea', coords: [75.0000, 150.0000] },
            { name: 'Laptev Sea East', coords: [75.0000, 130.0000] },
            { name: 'Laptev Sea West', coords: [76.0000, 110.0000] }
          ]
        },
        {
          name: 'Central Siberian Arctic',
          waypoints: [
            { name: 'Laptev Sea West', coords: [76.0000, 110.0000] },
            { name: 'Central Siberian Sea', coords: [76.0000, 90.0000] },
            { name: 'Kara Sea East', coords: [75.0000, 70.0000] },
            { name: 'Kara Sea', coords: [75.0000, 60.0000] }
          ]
        },
        {
          name: 'European Arctic Exit',
          waypoints: [
            { name: 'Kara Sea', coords: [75.0000, 60.0000] },
            { name: 'Barents Sea', coords: [75.0000, 40.0000] },
            { name: 'Murmansk', coords: [68.9792, 33.0925] },
            { name: 'North Sea', coords: [56.0000, 3.0000] },
            { name: 'Hamburg', coords: [53.5403, 9.9847] }
          ]
        }
      ],
      volume: '1.2M TEU',
      value: '$80B',
      color: '#64748b',
      status: 'Seasonal',
      risk: 'Critical',
      growth: '+15.2%'
    },
    {
      id: 'northern_sea_route_eastbound',
      name: 'Northern Sea Route Eastbound',
      description: 'Arctic route from Europe to Asia through Russian Arctic waters (seasonal)',
      segments: [
        {
          name: 'European Arctic Entry',
          waypoints: [
            { name: 'Hamburg', coords: [53.5403, 9.9847] },
            { name: 'Murmansk', coords: [68.9792, 33.0925] },
            { name: 'Barents Sea', coords: [75.0000, 40.0000] },
            { name: 'Kara Sea', coords: [75.0000, 60.0000] }
          ]
        },
        {
          name: 'Central Siberian Arctic East',
          waypoints: [
            { name: 'Kara Sea', coords: [75.0000, 60.0000] },
            { name: 'Central Siberian Sea', coords: [76.0000, 90.0000] },
            { name: 'Laptev Sea', coords: [75.0000, 120.0000] },
            { name: 'East Siberian Sea', coords: [75.0000, 150.0000] }
          ]
        },
        {
          name: 'Arctic Ocean East Route',
          waypoints: [
            { name: 'East Siberian Sea', coords: [75.0000, 150.0000] },
            { name: 'Arctic Ocean North East', coords: [78.0000, 170.0000] },
            { name: 'Arctic Ocean Central East', coords: [78.0000, -150.0000] }
          ]
        },
        {
          name: 'Pacific Arctic Exit',
          waypoints: [
            { name: 'Arctic Ocean Central East', coords: [78.0000, -150.0000] },
            { name: 'Chukchi Sea North', coords: [72.0000, -165.0000] },
            { name: 'Chukchi Sea', coords: [70.0000, -170.0000] },
            { name: 'Bering Strait', coords: [65.7500, -168.0000] },
            { name: 'Vladivostok', coords: [43.1332, 131.9113] }
          ]
        }
      ],
      volume: '0.9M TEU',
      value: '$40B',
      color: '#475569',
      status: 'Seasonal',
      risk: 'Critical',
      growth: '+8.7%'
    },
    {
      id: 'africa_cape_route',
      name: 'Africa Cape Route',
      description: 'Alternative to Suez Canal connecting Asia-Europe via Cape of Good Hope',
      waypoints: [
        { name: 'Singapore', coords: [1.2644, 103.8391] },
        { name: 'Indian Ocean', coords: [-10.0000, 80.0000] },
        { name: 'Mauritius', coords: [-20.2042, 57.4989] },
        { name: 'Durban', coords: [-29.8587, 31.0218] },
        { name: 'Cape of Good Hope', coords: [-34.3553, 18.4686] },
        { name: 'Cape Town', coords: [-33.9249, 18.4241] },
        { name: 'West Africa', coords: [-15.0000, 5.0000] },
        { name: 'Lagos', coords: [6.5244, 3.3792] },
        { name: 'Gibraltar', coords: [36.1408, -5.3536] },
        { name: 'Rotterdam', coords: [51.9244, 4.4777] }
      ],
      volume: '6.7M TEU',
      value: '$280B',
      color: '#84cc16',
      status: 'Active',
      risk: 'High',
      growth: '+5.1%'
    }
  ];

  const chokePoints = [
    { name: 'Suez Canal', coords: [30.0444, 32.3917], risk: 'Critical', throughput: '12% of global trade' },
    { name: 'Strait of Hormuz', coords: [26.0000, 56.0000], risk: 'Critical', throughput: '21% of global LNG' },
    { name: 'Panama Canal', coords: [9.0820, -79.7674], risk: 'High', throughput: '6% of global trade' },
    { name: 'Strait of Malacca', coords: [2.0000, 102.0000], risk: 'High', throughput: '25% of traded goods' },
    { name: 'Bosphorus Strait', coords: [41.1171, 29.0367], risk: 'Medium', throughput: '3% of global oil' }
  ];

  // Don't render map on server side
  if (!isClient) {
    return (
      <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Ship className="w-5 h-5" />
            Global Trade Routes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[500px] bg-slate-700/50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Globe className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">Loading trade routes map...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Client-side map component
  const TradeRoutesMap = () => {
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
            center: [20, 0],
            zoom: 2,
            zoomControl: true,
            attributionControl: true,
            minZoom: 2,
            maxZoom: 8,
            worldCopyJump: true
          });

          // Add dark tile layer for trade routes visualization
          Leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
          }).addTo(map);

          setMapInstance(map);

          // Add trade routes and markers after map is ready
          setTimeout(() => {
            addTradeRoutes(map, Leaflet);
            addChokePoints(map, Leaflet);
          }, 500);

        } catch (error) {
          console.error('Error loading trade routes map:', error);
        }
      };

      loadMap();
    }, []);

    const addTradeRoutes = (map, L) => {
      tradeRoutes.forEach((route, index) => {
        // Check if route has segments (for trans-pacific and northern routes)
        if (route.segments) {
          // Handle segmented routes
          let allWaypoints = [];
          
          route.segments.forEach((segment, segIndex) => {
            const segmentCoords = segment.waypoints.map(wp => [wp.coords[0], wp.coords[1]]);
            
            // Create segment line
            const segmentLine = L.polyline(segmentCoords, {
              color: route.color,
              weight: 4,
              opacity: 0.8,
              smoothFactor: 1,
              dashArray: segIndex > 0 ? '10, 5' : null // Dash subsequent segments to show they're connected
            }).addTo(map);

            // Add animated arrows along each segment
            const decorator = createArrowDecorator(L, segmentLine, route.color);
            if (decorator) decorator.addTo(map);
            
            // Collect all waypoints for marker creation
            allWaypoints = allWaypoints.concat(segment.waypoints);
          });
          
          // Remove duplicate waypoints (like connection points)
          const uniqueWaypoints = allWaypoints.filter((wp, index, arr) => 
            index === arr.findIndex(w => w.name === wp.name)
          );
          
          // Add waypoint markers for segmented routes
          uniqueWaypoints.forEach((waypoint, wpIndex) => {
            const isStart = wpIndex === 0;
            const isEnd = wpIndex === uniqueWaypoints.length - 1;
            const isConnection = allWaypoints.filter(w => w.name === waypoint.name).length > 1;
            
            const marker = L.circleMarker([waypoint.coords[0], waypoint.coords[1]], {
              radius: isStart || isEnd ? 8 : isConnection ? 6 : 4,
              fillColor: route.color,
              color: isConnection ? '#ffd700' : '#ffffff', // Gold border for connection points
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8
            }).addTo(map);

            marker.bindPopup(`
              <div class="p-2">
                <h4 class="font-bold text-slate-900">${waypoint.name}</h4>
                <p class="text-sm text-slate-600">${route.name}</p>
                <p class="text-xs text-slate-500">${isStart ? 'Start' : isEnd ? 'End' : isConnection ? 'Connection Point' : 'Waypoint'}</p>
              </div>
            `);
          });
          
          // Add route label at first segment midpoint
          const firstSegment = route.segments[0];
          const midIndex = Math.floor(firstSegment.waypoints.length / 2);
          const midPoint = firstSegment.waypoints[midIndex];
          
          const routeLabel = L.marker([midPoint.coords[0], midPoint.coords[1]], {
            icon: L.divIcon({
              html: `
                <div class="bg-slate-800/90 text-white px-2 py-1 rounded text-xs font-semibold border border-slate-600" style="color: ${route.color};">
                  ${route.name} (Segmented)
                </div>
              `,
              className: 'route-label',
              iconSize: [140, 20],
              iconAnchor: [70, 10]
            })
          }).addTo(map);

          routeLabel.bindPopup(`
            <div class="p-3 min-w-64">
              <h3 class="font-bold text-slate-900 mb-2">${route.name}</h3>
              <p class="text-sm text-slate-600 mb-3">${route.description}</p>
              <p class="text-xs text-blue-600 mb-2">Route shown in ${route.segments.length} segments to avoid crossing land masses</p>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div><span class="font-semibold">Volume:</span> ${route.volume}</div>
                <div><span class="font-semibold">Value:</span> ${route.value}</div>
                <div><span class="font-semibold">Status:</span> <span class="text-green-600">${route.status}</span></div>
                <div><span class="font-semibold">Risk:</span> <span class="${route.risk === 'Critical' ? 'text-red-600' : route.risk === 'High' ? 'text-orange-600' : route.risk === 'Medium' ? 'text-yellow-600' : 'text-green-600'}">${route.risk}</span></div>
                <div><span class="font-semibold">Growth:</span> <span class="text-blue-600">${route.growth}</span></div>
              </div>
            </div>
          `);
        } else {
          // Handle regular routes with waypoints
          const routeCoords = route.waypoints.map(wp => [wp.coords[0], wp.coords[1]]);
          
          const routeLine = L.polyline(routeCoords, {
            color: route.color,
            weight: 4,
            opacity: 0.8,
            smoothFactor: 1
          }).addTo(map);

          // Add animated arrows along the route
          const decorator = createArrowDecorator(L, routeLine, route.color);
          if (decorator) decorator.addTo(map);

          // Add waypoint markers
          route.waypoints.forEach((waypoint, wpIndex) => {
            const isStart = wpIndex === 0;
            const isEnd = wpIndex === route.waypoints.length - 1;
            
            const marker = L.circleMarker([waypoint.coords[0], waypoint.coords[1]], {
              radius: isStart || isEnd ? 8 : 5,
              fillColor: route.color,
              color: '#ffffff',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8
            }).addTo(map);

            marker.bindPopup(`
              <div class="p-2">
                <h4 class="font-bold text-slate-900">${waypoint.name}</h4>
                <p class="text-sm text-slate-600">${route.name}</p>
                <p class="text-xs text-slate-500">${isStart ? 'Start' : isEnd ? 'End' : 'Waypoint'}</p>
              </div>
            `);
          });

          // Add route label at midpoint
          const midIndex = Math.floor(route.waypoints.length / 2);
          const midPoint = route.waypoints[midIndex];
          
          const routeLabel = L.marker([midPoint.coords[0], midPoint.coords[1]], {
            icon: L.divIcon({
              html: `
                <div class="bg-slate-800/90 text-white px-2 py-1 rounded text-xs font-semibold border border-slate-600" style="color: ${route.color};">
                  ${route.name}
                </div>
              `,
              className: 'route-label',
              iconSize: [120, 20],
              iconAnchor: [60, 10]
            })
          }).addTo(map);

          routeLabel.bindPopup(`
            <div class="p-3 min-w-64">
              <h3 class="font-bold text-slate-900 mb-2">${route.name}</h3>
              <p class="text-sm text-slate-600 mb-3">${route.description}</p>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div><span class="font-semibold">Volume:</span> ${route.volume}</div>
                <div><span class="font-semibold">Value:</span> ${route.value}</div>
                <div><span class="font-semibold">Status:</span> <span class="text-green-600">${route.status}</span></div>
                <div><span class="font-semibold">Risk:</span> <span class="${route.risk === 'Critical' ? 'text-red-600' : route.risk === 'High' ? 'text-orange-600' : route.risk === 'Medium' ? 'text-yellow-600' : 'text-green-600'}">${route.risk}</span></div>
                <div><span class="font-semibold">Growth:</span> <span class="text-blue-600">${route.growth}</span></div>
              </div>
            </div>
          `);
        }
      });
    };

    const addChokePoints = (map, L) => {
      chokePoints.forEach(point => {
        const riskColor = point.risk === 'Critical' ? '#dc2626' : 
                         point.risk === 'High' ? '#f59e0b' : 
                         point.risk === 'Medium' ? '#3b82f6' : '#10b981';

        const chokePointMarker = L.marker([point.coords[0], point.coords[1]], {
          icon: L.divIcon({
            html: `
              <div class="w-6 h-6 rounded-full border-2 border-white shadow-lg animate-pulse" style="background-color: ${riskColor};">
                <div class="w-2 h-2 rounded-full bg-white absolute top-1 left-1"></div>
              </div>
            `,
            className: 'choke-point-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(map);

        chokePointMarker.bindPopup(`
          <div class="p-3">
            <h3 class="font-bold text-slate-900 mb-2">${point.name}</h3>
            <div class="text-sm space-y-1">
              <div><span class="font-semibold">Type:</span> Critical Chokepoint</div>
              <div><span class="font-semibold">Risk Level:</span> <span style="color: ${riskColor};">${point.risk}</span></div>
              <div><span class="font-semibold">Throughput:</span> ${point.throughput}</div>
            </div>
          </div>
        `);
      });
    };

    const createArrowDecorator = (L, polyline, color) => {
      try {
        // Simple arrow implementation using markers
        const coords = polyline.getLatLngs();
        const arrows = [];
        
        for (let i = 1; i < coords.length; i++) {
          const start = coords[i - 1];
          const end = coords[i];
          const midLat = (start.lat + end.lat) / 2;
          const midLng = (start.lng + end.lng) / 2;
          
          // Calculate bearing for arrow direction
          const bearing = calculateBearing(start, end);
          
          const arrow = L.marker([midLat, midLng], {
            icon: L.divIcon({
              html: `<div style="transform: rotate(${bearing}deg); color: ${color};">→</div>`,
              className: 'route-arrow',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })
          });
          
          arrows.push(arrow);
        }
        
        return L.layerGroup(arrows);
      } catch (error) {
        console.warn('Arrow decorator not available:', error);
        return null;
      }
    };

    const calculateBearing = (start, end) => {
      const startLat = start.lat * Math.PI / 180;
      const startLng = start.lng * Math.PI / 180;
      const endLat = end.lat * Math.PI / 180;
      const endLng = end.lng * Math.PI / 180;
      
      const deltaLng = endLng - startLng;
      
      const y = Math.sin(deltaLng) * Math.cos(endLat);
      const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(deltaLng);
      
      const bearing = Math.atan2(y, x) * 180 / Math.PI;
      return (bearing + 360) % 360;
    };

    return <div ref={mapRef} className="w-full h-[500px] rounded-lg" />;
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <Ship className="w-5 h-5" />
            Global Trade Routes & Vectors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isMobile ? (
            <>
              <TradeRoutesMap />
              {!mapLoaded && (
                <div className="absolute inset-0 bg-slate-800/50 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <Globe className="w-16 h-16 text-slate-400 mx-auto mb-4 animate-spin" />
                    <p className="text-slate-400">Loading trade routes...</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900/20 rounded-full mb-4">
                <Ship className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Trade Routes Overview</h3>
              <p className="text-slate-400 text-sm mb-4">
                Interactive route map disabled for mobile performance. Route details available below.
              </p>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="text-xl font-bold text-blue-400">{tradeRoutes.length}</div>
                  <div className="text-xs text-slate-400">Major Routes</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="text-xl font-bold text-orange-400">{chokePoints.length}</div>
                  <div className="text-xs text-slate-400">Chokepoints</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Route Legend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Trade Routes Legend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tradeRoutes.map((route) => (
                <div key={route.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: route.color }}
                    ></div>
                    <div>
                      <p className="text-slate-100 font-medium text-sm">{route.name}</p>
                      <p className="text-slate-400 text-xs">{route.volume} • {route.value}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getRiskColor(route.risk)} variant="secondary">
                      {route.risk}
                    </Badge>
                    <span className="text-green-400 text-xs">{route.growth}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Critical Chokepoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chokePoints.map((point, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="text-slate-100 font-medium text-sm">{point.name}</p>
                    <p className="text-slate-400 text-xs">{point.throughput}</p>
                  </div>
                  <Badge className={getRiskColor(point.risk)} variant="secondary">
                    {point.risk}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
        }
        .route-label {
          background: none !important;
          border: none !important;
        }
        .choke-point-marker {
          background: none !important;
          border: none !important;
        }
        .route-arrow {
          background: none !important;
          border: none !important;
          font-size: 16px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}
