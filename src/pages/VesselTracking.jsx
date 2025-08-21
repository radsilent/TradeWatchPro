import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Ship, 
  MapPin, 
  Clock, 
  Navigation, 
  Zap, 
  Anchor, 
  Filter,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Globe,
  BarChart3,
  Eye,
  RefreshCw
} from "lucide-react";

// Key Vessel Tracking Page - UPDATED FOR REAL API DATA
export default function VesselTracking() {
  const [vessels, setVessels] = useState([]);
  const [filteredVessels, setFilteredVessels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [impactFilter, setImpactFilter] = useState("all");
  const [originCountryFilter, setOriginCountryFilter] = useState("all");
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [mapDisplayLimit, setMapDisplayLimit] = useState(300); // Limit vessels on map for performance
  const [showAllOnMap, setShowAllOnMap] = useState(false);
  const [map, setMap] = useState(null);
  const [markersLayer, setMarkersLayer] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const mapRef = useRef(null);

  // Load vessel data from API
  useEffect(() => {
    const loadVesselData = async () => {
      try {
        setIsLoading(true);
        console.log('🚢 Loading vessel data from API...');
        console.log('🔄 Cache-busted refresh:', Date.now());
        
        // DIRECT API CALL - get real vessel data (minimum 300 vessels)
        const response = await fetch('http://localhost:8001/api/vessels?limit=5000&_refresh=' + Date.now());
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        const allVessels = data.vessels || [];
        
        // SEPARATE: All vessels for map display, impacted vessels for list
        const impactedVessels = allVessels.filter(vessel => vessel.impacted === true);
        console.log(`✅ Loaded ${allVessels.length} total vessels, ${impactedVessels.length} are impacted`);
        
        // Store ALL vessels for map, but filter list to IMPACTED only
        setVessels(allVessels); // All vessels for map
        setFilteredVessels(impactedVessels); // Only impacted for list
      } catch (error) {
        console.error('🚨 Error loading vessel data:', error);
        console.error('Error details:', error.message, error.stack);
        
        // Try fallback direct fetch
        try {
          console.log('🔄 Trying fallback direct fetch...');
          const fallbackResponse = await fetch('http://localhost:8001/api/vessels?limit=100');
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            const allVessels = fallbackData.vessels || [];
            const impactedVessels = allVessels.filter(vessel => vessel.impacted === true);
            console.log(`✅ Fallback: Loaded ${allVessels.length} total, ${impactedVessels.length} impacted`);
            setVessels(allVessels);
            setFilteredVessels(impactedVessels);
          } else {
            throw new Error(`Fallback failed: ${fallbackResponse.status}`);
          }
        } catch (fallbackError) {
          console.error('🚨 Fallback also failed:', fallbackError);
          setVessels([]);
          setFilteredVessels([]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadVesselData();
  }, []);

  // REMOVED: Hardcoded vessel data replaced with API call above
  const keyVessels_OLD_DELETED = [
    // CRITICAL TRACKED VESSELS
    { 
      id: 1, name: "MSC GÜLSÜN", type: "Ultra Large Container Ship", 
      coordinates: { lat: 15.3694, lng: 38.9386 }, 
      status: "Delayed", destination: "Rotterdam", 
      mmsi: "636092932", imo: "9839242", 
      speed: 0.2, course: 315, dwt: 232618,
      operator: "MSC", flag: "Liberia",
      impacted: true, priority: "High",
      delayDays: 18,
      lastUpdate: new Date(Date.now() - 5 * 60 * 1000),
      riskLevel: "Critical",
      currentPort: "Red Sea",
      nextPort: "Rotterdam",
      eta: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      crew: 25,
      incidents: ["Red Sea Attacks", "Route Deviation"],
      tracking: "Active"
    },
    { 
      id: 2, name: "EVER GIVEN", type: "Ultra Large Container Ship", 
      coordinates: { lat: 20.5, lng: 40.3 }, 
      status: "Rerouted", destination: "Hamburg", 
      mmsi: "353136000", imo: "9811000",
      speed: 12.4, course: 180, dwt: 220940,
      operator: "Evergreen", flag: "Panama",
      impacted: true, priority: "High",
      delayDays: 15,
      lastUpdate: new Date(Date.now() - 2 * 60 * 1000),
      riskLevel: "High",
      currentPort: "Red Sea Transit",
      nextPort: "Hamburg",
      eta: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
      crew: 25,
      incidents: ["Historical Suez Incident", "Current Red Sea Reroute"],
      tracking: "Enhanced"
    },
    { 
      id: 3, name: "MAERSK LIMA", type: "Large Container Ship", 
      coordinates: { lat: 9.08, lng: -79.68 }, 
      status: "Stuck", destination: "Los Angeles", 
      mmsi: "219018400", imo: "9778425",
      speed: 0.0, course: 0, dwt: 147700,
      operator: "Maersk", flag: "Denmark",
      impacted: true, priority: "Critical",
      delayDays: 21,
      lastUpdate: new Date(Date.now() - 30 * 60 * 1000),
      riskLevel: "Critical",
      currentPort: "Panama Canal",
      nextPort: "Los Angeles",
      eta: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      crew: 24,
      incidents: ["Panama Canal Drought", "Queue Delay"],
      tracking: "Continuous"
    },
    { 
      id: 4, name: "COSCO SHIPPING GEMINI", type: "Ultra Large Container Ship", 
      coordinates: { lat: 44.6, lng: 33.5 }, 
      status: "Emergency", destination: "TBD", 
      mmsi: "477995300", imo: "9795600",
      speed: 0.0, course: 0, dwt: 199000,
      operator: "COSCO", flag: "Hong Kong",
      impacted: true, priority: "Critical",
      delayDays: 45,
      lastUpdate: new Date(Date.now() - 10 * 60 * 1000),
      riskLevel: "Emergency",
      currentPort: "Black Sea",
      nextPort: "Under Assessment",
      eta: null,
      crew: 23,
      incidents: ["Geopolitical Crisis", "Port Access Denied"],
      tracking: "Emergency Response"
    },
    { 
      id: 5, name: "HAPAG-LLOYD BERLIN", type: "Large Container Ship", 
      coordinates: { lat: 53.5511, lng: 9.9937 }, 
      status: "Loading", destination: "New York", 
      mmsi: "636091759", imo: "9742448",
      speed: 0.0, course: 0, dwt: 142000,
      operator: "Hapag-Lloyd", flag: "Liberia",
      impacted: false, priority: "Medium",
      delayDays: 0,
      lastUpdate: new Date(Date.now() - 1 * 60 * 1000),
      riskLevel: "Low",
      currentPort: "Hamburg",
      nextPort: "New York",
      eta: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      crew: 22,
      incidents: [],
      tracking: "Standard"
    },
    { 
      id: 6, name: "CMA CGM MARCO POLO", type: "Ultra Large Container Ship", 
      coordinates: { lat: 31.2304, lng: 121.4737 }, 
      status: "Underway", destination: "Los Angeles", 
      mmsi: "201799000", imo: "9454436",
      speed: 19.2, course: 85, dwt: 187541,
      operator: "CMA CGM", flag: "France",
      impacted: false, priority: "Medium",
      delayDays: 0,
      lastUpdate: new Date(Date.now() - 3 * 60 * 1000),
      riskLevel: "Low",
      currentPort: "Shanghai",
      nextPort: "Los Angeles",
      eta: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      crew: 26,
      incidents: [],
      tracking: "Standard"
    },
    { 
      id: 7, name: "MEDITERRANEAN SHIPPINGCO", type: "Ultra Large Container Ship", 
      coordinates: { lat: 1.3521, lng: 103.8198 }, 
      status: "At Port", destination: "Europe", 
      mmsi: "636019825", imo: "9863091",
      speed: 0.0, course: 0, dwt: 238000,
      operator: "MSC", flag: "Liberia",
      impacted: false, priority: "High",
      delayDays: 0,
      lastUpdate: new Date(Date.now() - 15 * 60 * 1000),
      riskLevel: "Medium",
      currentPort: "Singapore",
      nextPort: "Rotterdam",
      eta: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      crew: 25,
      incidents: [],
      tracking: "Enhanced"
    },
    { 
      id: 8, name: "OOCL HONG KONG", type: "Ultra Large Container Ship", 
      coordinates: { lat: 22.3193, lng: 114.1694 }, 
      status: "Underway", destination: "Long Beach", 
      mmsi: "477701300", imo: "9839262",
      speed: 22.1, course: 95, dwt: 210890,
      operator: "OOCL", flag: "Hong Kong",
      impacted: false, priority: "Medium",
      delayDays: 0,
      lastUpdate: new Date(Date.now() - 8 * 60 * 1000),
      riskLevel: "Low",
      currentPort: "Hong Kong",
      nextPort: "Long Beach",
      eta: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
      crew: 24,
      incidents: [],
      tracking: "Standard"
    },
    { 
      id: 9, name: "EMMA MAERSK", type: "Ultra Large Container Ship", 
      coordinates: { lat: 56.1629, lng: 10.2039 }, 
      status: "Maintenance", destination: "TBD", 
      mmsi: "219001637", imo: "9321483",
      speed: 0.0, course: 0, dwt: 156907,
      operator: "Maersk", flag: "Denmark",
      impacted: false, priority: "Low",
      delayDays: 3,
      lastUpdate: new Date(Date.now() - 45 * 60 * 1000),
      riskLevel: "Low",
      currentPort: "Aarhus",
      nextPort: "TBD",
      eta: null,
      crew: 13,
      incidents: ["Scheduled Maintenance"],
      tracking: "Limited"
    },
    { 
      id: 10, name: "ONE APUS", type: "Ultra Large Container Ship", 
      coordinates: { lat: 35.6762, lng: 139.6503 }, 
      status: "Loading", destination: "Long Beach", 
      mmsi: "432179000", imo: "9806079",
      speed: 0.0, course: 0, dwt: 141420,
      operator: "ONE", flag: "Japan",
      impacted: false, priority: "Medium",
      delayDays: 0,
      lastUpdate: new Date(Date.now() - 20 * 60 * 1000),
      riskLevel: "Low",
      currentPort: "Tokyo",
      nextPort: "Long Beach",
      eta: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
      crew: 21,
      incidents: [],
      tracking: "Standard"
    }
  ];

  // REMOVED: Old hardcoded data loading replaced with API call above
  useEffect(() => {
    // Hardcoded vessel loading removed - now using API
    
    // Mobile detection
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Initialize Leaflet map - WITH REF RETRY
  useEffect(() => {
    const initMapWithRetry = () => {
      console.log('🗺️ STARTING MAP INIT');
      console.log('🗺️ mapRef.current:', !!mapRef.current);
      
      if (!mapRef.current) {
        console.log('⏳ MAP REF NOT READY, retrying in 100ms...');
        setTimeout(initMapWithRetry, 100);
        return;
      }
      
      if (map) {
        console.log('✅ MAP ALREADY EXISTS');
        return;
      }
      
      try {
        console.log('🗺️ CREATING MAP...');
        const leafletMap = L.map(mapRef.current).setView([20, 0], 2);
        
        console.log('🗺️ ADDING TILES...');
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(leafletMap);
        
        console.log('🗺️ CREATING MARKER LAYER...');
        const markerGroup = L.layerGroup().addTo(leafletMap);
        
        console.log('🗺️ SETTING STATE...');
        setMap(leafletMap);
        setMarkersLayer(markerGroup);
        
        console.log('✅ MAP COMPLETE!');
        
      } catch (error) {
        console.error('❌ MAP ERROR:', error);
      }
    };
    
    // Start the retry process
    initMapWithRetry();
  }, []);

  // Debug: Log when component mounts
  useEffect(() => {
    console.log('🚢 VesselTracking component mounted successfully');
    console.log('🚢 mapRef after mount:', !!mapRef.current);
  }, []);

  // Update map markers
  useEffect(() => {
    console.log(`🗺️ Map update triggered - map: ${!!map}, markersLayer: ${!!markersLayer}, vessels: ${vessels.length}`);
    if (!map || !markersLayer) {
      console.log(`⚠️ Map update skipped - map: ${!!map}, markersLayer: ${!!markersLayer}`);
      return;
    }

    const updateMarkers = () => {
      try {
        console.log('🔍 CRITICAL DEBUG: updateMarkers function called');
        console.log('🔍 Map object exists:', !!map);
        console.log('🔍 MarkersLayer exists:', !!markersLayer);
        
        if (!markersLayer) {
          console.log('❌ No markersLayer, cannot plot vessels');
          return;
        }
        
        markersLayer.clearLayers();
        console.log('🔍 Markers cleared successfully');

        // Display ALL vessels on map, limit for performance
        const vesselsToDisplay = vessels.slice(0, mapDisplayLimit);
        console.log(`🗺️ VESSEL TRACKING MAP DEBUG:`);
        console.log(`- Total vessels loaded: ${vessels.length}`);
        console.log(`- Vessels to display on map: ${vesselsToDisplay.length}`);
        console.log(`- Map display limit: ${mapDisplayLimit}`);
        if (vessels.length > 0) {
          console.log(`- First vessel data:`, vessels[0]);
          console.log(`- First vessel coordinates:`, vessels[0].coordinates);
        }
        
        console.log(`🔍 Starting to process ${vesselsToDisplay.length} vessels for map plotting`);
        
        vesselsToDisplay.forEach((vessel, index) => {
          console.log(`🔍 Processing vessel ${index + 1}/${vesselsToDisplay.length}: ${vessel.name}`);
          
          // Extract coordinates from various possible formats
          let lat, lng;
          if (vessel.coordinates) {
            if (Array.isArray(vessel.coordinates) && vessel.coordinates.length === 2) {
              [lat, lng] = vessel.coordinates;
              console.log(`🔍 Vessel ${vessel.name} - extracted coords from array: [${lat}, ${lng}]`);
            } else if (vessel.coordinates.lat && vessel.coordinates.lng) {
              lat = vessel.coordinates.lat;
              lng = vessel.coordinates.lng;
              console.log(`🔍 Vessel ${vessel.name} - extracted coords from object: [${lat}, ${lng}]`);
            }
          } else if (vessel.latitude && vessel.longitude) {
            lat = vessel.latitude;
            lng = vessel.longitude;
            console.log(`🔍 Vessel ${vessel.name} - extracted coords from lat/lng fields: [${lat}, ${lng}]`);
          }
          
          // Skip vessels without valid coordinates
          if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            console.log(`❌ Vessel ${vessel.name} SKIPPED - invalid coordinates: lat=${lat}, lng=${lng}`);
            return;
          }
          
          console.log(`✅ Vessel ${vessel.name} - coordinates validated: [${lat}, ${lng}]`);
          
          const course = vessel.course || 0;
          const priority = vessel.priority || (vessel.impacted ? 'High' : 'Medium');
          const size = priority === 'Critical' ? 16 : priority === 'High' ? 14 : 12;
          
          const getVesselColor = (vessel) => {
            if (vessel.impacted) {
              // Impacted vessels - Red/Orange based on risk level
              switch(vessel.riskLevel) {
                case 'Emergency': return '#dc2626'; // Dark red
                case 'Critical': return '#ea580c';  // Orange-red
                case 'High': return '#f59e0b';      // Orange
                default: return '#ef4444';          // Red for impacted
              }
            } else {
              // Non-impacted vessels - Blue/Green shades
              switch(vessel.riskLevel) {
                case 'High': return '#3b82f6';      // Blue
                case 'Medium': return '#10b981';    // Green
                case 'Low': return '#22c55e';       // Light green
                default: return '#6b7280';          // Gray for normal
              }
            }
          };
          
          const vesselColor = getVesselColor(vessel);

          // Create directional vessel marker
          const vesselIcon = L.divIcon({
            html: `
              <div style="
                width: ${size}px; 
                height: ${size}px; 
                transform: rotate(${course}deg);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="
                  width: 0; 
                  height: 0; 
                  border-left: ${size/2}px solid transparent;
                  border-right: ${size/2}px solid transparent;
                  border-bottom: ${size}px solid ${vesselColor};
                  filter: drop-shadow(0 0 3px rgba(0,0,0,0.6));
                  ${vessel.impacted ? 'filter: drop-shadow(0 0 6px ' + vesselColor + ');' : ''}
                "></div>
              </div>
            `,
            className: 'vessel-marker',
            iconSize: [size, size],
            iconAnchor: [size/2, size/2]
          });

          console.log(`🚢 Creating marker for vessel ${vessel.name} at [${lat}, ${lng}]`);
          
          const marker = L.marker([lat, lng], { icon: vesselIcon });
          console.log(`✅ Marker created successfully for ${vessel.name}`);

          marker.bindPopup(`
            <div style="font-family: Arial, sans-serif; color: #333; min-width: 300px;">
              <div style="background: linear-gradient(45deg, ${vesselColor}, ${vesselColor}aa); color: white; padding: 8px; margin: -8px -8px 12px -8px; border-radius: 4px;">
                <strong style="font-size: 16px;">${vessel.name}</strong>
                <div style="font-size: 12px; opacity: 0.9;">${vessel.type}</div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                <div><strong>Status:</strong> <span style="color: ${getRiskColor(vessel.riskLevel)};">${vessel.status}</span></div>
                <div><strong>Priority:</strong> ${vessel.priority}</div>
                <div><strong>Risk Level:</strong> ${vessel.riskLevel}</div>
                <div><strong>Speed:</strong> ${vessel.speed} kts</div>
                <div><strong>Course:</strong> ${course}°</div>
                <div><strong>MMSI:</strong> ${vessel.mmsi}</div>
                <div><strong>IMO:</strong> ${vessel.imo}</div>
                <div><strong>Flag:</strong> ${vessel.flag}</div>
                <div><strong>Operator:</strong> ${vessel.operator || vessel.owner}</div>
                <div><strong>DWT:</strong> ${vessel.dwt.toLocaleString()}</div>
                <div><strong>Crew:</strong> ${vessel.crew || vessel.crew_size} people</div>
              </div>
              
              <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                <div style="font-size: 12px;"><strong>Current:</strong> ${vessel.currentPort || vessel.status || 'At Sea'}</div>
                <div style="font-size: 12px;"><strong>Destination:</strong> ${vessel.nextPort || vessel.destination}</div>
                ${vessel.eta ? `<div style="font-size: 12px;"><strong>ETA:</strong> ${vessel.eta instanceof Date ? vessel.eta.toLocaleDateString() : new Date(vessel.eta).toLocaleDateString()}</div>` : ''}
                <div style="font-size: 12px;"><strong>Tracking:</strong> ${vessel.tracking || 'Active'}</div>
              </div>
              
              ${(vessel.incidents && vessel.incidents.length > 0) ? `
                <div style="margin-top: 8px; padding: 6px; background: #fef3c7; border-radius: 4px; border-left: 3px solid #f59e0b;">
                  <div style="font-size: 11px; font-weight: bold; color: #92400e;">Active Incidents:</div>
                  ${vessel.incidents.map(incident => `<div style="font-size: 11px; color: #92400e;">• ${incident}</div>`).join('')}
                </div>
              ` : ''}
            </div>
          `, {
            maxWidth: 350,
            className: 'custom-popup'
          });

          marker.on('click', () => setSelectedVessel(vessel));
          markersLayer.addLayer(marker);
          console.log(`✅ Vessel ${vessel.name} marker added to map layer`);
        });
      } catch (error) {
        console.error('Failed to update markers:', error);
      }
    };

    updateMarkers();
  }, [map, markersLayer, vessels, mapDisplayLimit]);

  // Filter vessels based on search and filters (LIST shows only IMPACTED vessels)
  useEffect(() => {
    // Start with only impacted vessels for the list/cards
    let filtered = vessels.filter(vessel => vessel.impacted === true);

    if (searchTerm) {
      filtered = filtered.filter(vessel => 
        vessel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vessel.mmsi.includes(searchTerm) ||
        vessel.imo.includes(searchTerm) ||
        vessel.operator.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(vessel => vessel.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(vessel => vessel.type.toLowerCase().includes(typeFilter.toLowerCase()));
    }

    if (impactFilter !== "all") {
      if (impactFilter === "impacted") {
        filtered = filtered.filter(vessel => vessel.impacted);
      } else if (impactFilter === "normal") {
        filtered = filtered.filter(vessel => !vessel.impacted);
      }
    }

    if (originCountryFilter !== "all") {
      filtered = filtered.filter(vessel => 
        vessel.flag && vessel.flag.toLowerCase().includes(originCountryFilter.toLowerCase())
      );
    }

    if (destinationFilter !== "all") {
      filtered = filtered.filter(vessel => 
        vessel.destination && vessel.destination.toLowerCase().includes(destinationFilter.toLowerCase())
      );
    }

    setFilteredVessels(filtered);
  }, [vessels, searchTerm, statusFilter, typeFilter, impactFilter, originCountryFilter, destinationFilter]);

  // Extract unique countries for filters
  const getUniqueCountries = () => {
    const countries = new Set();
    vessels.forEach(vessel => {
      if (vessel.flag) countries.add(vessel.flag);
    });
    return Array.from(countries).sort();
  };

  const getUniqueDestinations = () => {
    const destinations = new Set();
    vessels.forEach(vessel => {
      if (vessel.destination) {
        // Extract city/country from destination (e.g., "Port of Shanghai" -> "Shanghai")
        const cleanDestination = vessel.destination.replace(/^Port of\s+/i, '').trim();
        destinations.add(cleanDestination);
      }
    });
    return Array.from(destinations).sort();
  };

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
      case 'stuck': return 'bg-red-100 text-red-800 border-red-200';
      case 'delayed': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'rerouted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'underway': return 'bg-green-100 text-green-800 border-green-200';
      case 'loading': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'at port': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'maintenance': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (riskLevel) => {
    switch(riskLevel) {
      case 'Emergency': return 'bg-red-100 text-red-800 border-red-200';
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const impactedVessels = vessels.filter(v => v.impacted);
  const totalVessels = vessels.length;
  const impactedCount = impactedVessels.length;


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading vessel tracking data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              Impacted Vessel Tracking
              <Badge className="bg-red-100 text-red-800 border-red-200">Critical</Badge>
            </h1>
            <p className="text-gray-600 mt-2">Real-time monitoring of vessels affected by disruptions and incidents</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Map shows:</span>
              <select 
                value={mapDisplayLimit} 
                onChange={(e) => setMapDisplayLimit(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value={100}>Top 100</option>
                <option value={200}>Top 200</option>
                <option value={300}>Top 300</option>
                <option value={500}>Top 500</option>
                <option value={1000}>Top 1000</option>
                <option value={vessels.length}>All {vessels.length}</option>
              </select>
              <span className="text-gray-500">vessels</span>
            </div>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Grid
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <Eye className="h-4 w-4 mr-1" />
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Performance Info */}
      {vessels.length > 100 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
            <h3 className="text-blue-800 font-medium">Performance Mode Active</h3>
          </div>
          <p className="text-blue-700 text-sm mt-1">
            Showing {Math.min(mapDisplayLimit, totalVessels)} of {totalVessels} vessels on map. 
            List below shows only {impactedCount} impacted vessels. Use dropdown to adjust map display.
          </p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Vessels</p>
                <p className="text-3xl font-bold text-gray-900">{totalVessels}</p>
                <p className="text-xs text-gray-500 mt-1">Visible on map</p>
              </div>
              <Ship className="h-12 w-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Impacted Vessels</p>
                <p className="text-3xl font-bold text-red-600">{impactedCount}</p>
                <p className="text-xs text-gray-500 mt-1">Listed below (affected by disruptions)</p>
              </div>
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tracked Vessels</p>
                <p className="text-3xl font-bold text-blue-600">{totalVessels}</p>
                <p className="text-xs text-gray-500 mt-1">Key maritime vessels</p>
              </div>
              <Ship className="h-12 w-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>


      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search vessels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="underway">Underway</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
                <SelectItem value="stuck">Stuck</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="loading">Loading</SelectItem>
                <SelectItem value="at port">At Port</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ultra large container">Ultra Large Container</SelectItem>
                <SelectItem value="large container">Large Container</SelectItem>
                <SelectItem value="bulk carrier">Bulk Carrier</SelectItem>
                <SelectItem value="tanker">Tanker</SelectItem>
              </SelectContent>
            </Select>

            <Select value={impactFilter} onValueChange={setImpactFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Vessels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vessels</SelectItem>
                <SelectItem value="impacted">Impacted Only</SelectItem>
                <SelectItem value="normal">Normal Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={originCountryFilter} onValueChange={setOriginCountryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {getUniqueCountries().map(country => (
                  <SelectItem key={country} value={country}>
                    🏳️ {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={destinationFilter} onValueChange={setDestinationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Destinations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Destinations</SelectItem>
                {getUniqueDestinations().map(destination => (
                  <SelectItem key={destination} value={destination}>
                    🎯 {destination}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setTypeFilter("all");
                setImpactFilter("all");
                setOriginCountryFilter("all");
                setDestinationFilter("all");
              }}
              className="w-full"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Global Vessel Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Global Vessel Positions
            <Badge variant="secondary">{filteredVessels.length} vessels</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {!isMobile ? (
            <div style={{ position: 'relative' }}>
              <div 
                ref={mapRef} 
                id="vessel-tracking-map"
                style={{ 
                  height: '500px', 
                  borderRadius: '8px', 
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb'
                }} 
              />
            
            {/* Map Legend */}
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '12px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              fontSize: '12px',
              zIndex: 1000,
              maxWidth: '200px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Vessel Status:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#666', marginBottom: '4px' }}>IMPACTED VESSELS:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '0', height: '0', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '10px solid #dc2626' }}></div>
                  <span style={{ fontSize: '11px' }}>Emergency</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '0', height: '0', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '10px solid #ea580c' }}></div>
                  <span style={{ fontSize: '11px' }}>Critical</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '0', height: '0', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '10px solid #ef4444' }}></div>
                  <span style={{ fontSize: '11px' }}>High/Other</span>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#666', marginTop: '8px', marginBottom: '4px' }}>NORMAL VESSELS:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '0', height: '0', borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '8px solid #3b82f6' }}></div>
                  <span style={{ fontSize: '11px' }}>High Risk</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '0', height: '0', borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '8px solid #10b981' }}></div>
                  <span style={{ fontSize: '11px' }}>Medium Risk</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '0', height: '0', borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '8px solid #6b7280' }}></div>
                  <span style={{ fontSize: '11px' }}>Low/Normal</span>
                </div>
              </div>
            </div>

            <style dangerouslySetInnerHTML={{
              __html: `
                .vessel-marker {
                  background: transparent !important;
                  border: none !important;
                  box-shadow: none !important;
                }
                .leaflet-popup-content-wrapper {
                  border-radius: 8px;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                }
                .custom-popup .leaflet-popup-content {
                  margin: 8px;
                }
              `
            }} />
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Ship className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Vessel Positions</h3>
              <p className="text-gray-600 text-sm mb-4">
                Interactive map disabled for mobile performance. Vessel details available below.
              </p>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-red-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-red-600">{filteredVessels.filter(v => v.priority === 'Critical').length}</div>
                  <div className="text-xs text-red-700">Critical</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-orange-600">{filteredVessels.filter(v => v.priority === 'High').length}</div>
                  <div className="text-xs text-orange-700">High</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-yellow-600">{filteredVessels.filter(v => v.priority === 'Medium').length}</div>
                  <div className="text-xs text-yellow-700">Medium</div>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <div className="text-lg font-bold text-green-600">{filteredVessels.filter(v => v.priority === 'Low').length}</div>
                  <div className="text-xs text-green-700">Low</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vessel List/Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Ship className="h-5 w-5" />
              Tracked Vessels ({filteredVessels.length})
            </span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              <RefreshCw className="h-3 w-3 mr-1" />
              Auto-updating
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVessels.map((vessel) => (
                <Card key={vessel.id} className={`cursor-pointer transition-all hover:shadow-md ${vessel.impacted ? 'border-red-200 bg-red-50' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{vessel.name}</h3>
                        <p className="text-sm text-gray-600">{vessel.type}</p>
                        {vessel.last_updated && (
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            Updated: {new Date(vessel.last_updated).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <Badge className={getRiskColor(vessel.riskLevel)}>
                        {vessel.riskLevel}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Status:</span>
                        <Badge className={getStatusColor(vessel.status)}>
                          {vessel.status}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Speed:</span>
                        <span className="text-sm font-medium">{vessel.speed} kts</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Destination:</span>
                        <span className="text-sm font-medium">{vessel.nextPort}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">DWT:</span>
                        <span className="text-sm font-medium text-blue-600">{vessel.dwt.toLocaleString()}</span>
                      </div>

                      {vessel.delayDays > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Delay:</span>
                          <span className="text-sm font-medium text-red-600">{vessel.delayDays} days</span>
                        </div>
                      )}

                      {(vessel.incidents && vessel.incidents.length > 0) && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded border-l-2 border-yellow-400">
                          <p className="text-xs font-medium text-yellow-800">Active Incidents:</p>
                          {vessel.incidents.map((incident, idx) => (
                            <p key={idx} className="text-xs text-yellow-700">• {incident}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-500">
                      <span>MMSI: {vessel.mmsi}</span>
                      <span>Updated: {Math.floor((Date.now() - vessel.lastUpdate) / 60000)}m ago</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVessels.map((vessel) => (
                <Card key={vessel.id} className={`cursor-pointer transition-all hover:shadow-md ${vessel.impacted ? 'border-red-200 bg-red-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">
                      <div className="lg:col-span-2">
                        <h3 className="font-bold text-lg text-gray-900">{vessel.name}</h3>
                        <p className="text-sm text-gray-600">{vessel.type}</p>
                        <p className="text-xs text-gray-500">MMSI: {vessel.mmsi}</p>
                        {vessel.last_updated && (
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            Updated: {new Date(vessel.last_updated).toLocaleString()}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <Badge className={getStatusColor(vessel.status)}>
                          {vessel.status}
                        </Badge>
                        <span className="text-xs text-gray-500 mt-1">{vessel.speed} kts</span>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm font-medium">{vessel.nextPort}</p>
                        <p className="text-xs text-gray-500">
                          {vessel.eta ? vessel.eta.toLocaleDateString() : 'TBD'}
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm font-medium text-blue-600">{vessel.dwt.toLocaleString()} DWT</p>
                        {vessel.delayDays > 0 && (
                          <p className="text-xs text-red-600">{vessel.delayDays} days delay</p>
                        )}
                      </div>
                      
                      <div className="flex justify-end">
                        <Badge className={getRiskColor(vessel.riskLevel)}>
                          {vessel.riskLevel}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
