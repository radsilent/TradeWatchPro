import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { realDataService, Vessel, Disruption } from '../../services/realDataService';

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface VesselMapProps {
  height?: string;
  showControls?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const VesselMap: React.FC<VesselMapProps> = ({ 
  height = '600px', 
  showControls = true,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const disruptionsRef = useRef<L.LayerGroup>(new L.LayerGroup());
  
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [showDisruptions, setShowDisruptions] = useState(true);
  const [showVessels, setShowVessels] = useState(true);
  const [vesselFilter, setVesselFilter] = useState<string>('all');

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [25.0, 0.0], // Center on global view
      zoom: 2,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      dragging: true,
      touchZoom: true,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // Add layer groups
    markersRef.current.addTo(map);
    disruptionsRef.current.addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [vesselData, disruptionData] = await Promise.all([
        realDataService.getVessels(500), // Get 500 vessels for good coverage
        realDataService.getDisruptions()
      ]);

      setVessels(vesselData.vessels);
      setDisruptions(disruptionData.disruptions);
      setLastUpdate(new Date());
      
      console.log(`🗺️ Map updated: ${vesselData.vessels.length} vessels, ${disruptionData.disruptions.length} disruptions`);
    } catch (err) {
      console.error('Error fetching map data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Update vessel markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    markersRef.current.clearLayers();

    if (!showVessels) return;

    const filteredVessels = vessels.filter(vessel => {
      if (vesselFilter === 'all') return true;
      if (vesselFilter === 'impacted') return vessel.impacted;
      if (vesselFilter === 'high-risk') return vessel.riskLevel === 'High';
      return vessel.type.toLowerCase().includes(vesselFilter.toLowerCase());
    });

    filteredVessels.forEach(vessel => {
      const { latitude, longitude } = vessel;
      
      if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) return;

      // Create vessel icon based on type and status
      const getVesselIcon = (vessel: Vessel) => {
        let color = '#3B82F6'; // Default blue
        let size = 'small';

        // Color by risk/impact
        if (vessel.impacted) {
          color = '#EF4444'; // Red for impacted
          size = 'large';
        } else if (vessel.riskLevel === 'High') {
          color = '#F59E0B'; // Orange for high risk
          size = 'medium';
        } else if (vessel.priority === 'High') {
          color = '#8B5CF6'; // Purple for high priority
        }

        // Size by vessel type
        if (vessel.type.includes('Container') || vessel.type.includes('Tanker')) {
          size = size === 'small' ? 'medium' : 'large';
        }

        const sizeMap = {
          small: [8, 8],
          medium: [12, 12],
          large: [16, 16]
        };

        return L.divIcon({
          className: 'vessel-marker',
          html: `
            <div style="
              width: ${sizeMap[size][0]}px;
              height: ${sizeMap[size][1]}px;
              background-color: ${color};
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              color: white;
              font-weight: bold;
            ">
              🚢
            </div>
          `,
          iconSize: sizeMap[size] as [number, number],
          iconAnchor: [sizeMap[size][0] / 2, sizeMap[size][1] / 2],
        });
      };

      const marker = L.marker([latitude, longitude], {
        icon: getVesselIcon(vessel)
      });

      // Create detailed popup
      const popupContent = `
        <div style="min-width: 250px;">
          <h3 style="margin: 0 0 8px 0; color: #1F2937; font-size: 14px; font-weight: bold;">
            ${vessel.name}
          </h3>
          <div style="font-size: 12px; line-height: 1.4;">
            <p><strong>Type:</strong> ${vessel.type}</p>
            <p><strong>Flag:</strong> ${vessel.flag || 'Unknown'}</p>
            <p><strong>Speed:</strong> ${vessel.speed} knots</p>
            <p><strong>Course:</strong> ${vessel.course}°</p>
            <p><strong>Status:</strong> ${vessel.status}</p>
            ${vessel.destination ? `<p><strong>Destination:</strong> ${vessel.destination}</p>` : ''}
            ${vessel.route ? `<p><strong>Route:</strong> ${vessel.route}</p>` : ''}
            <p><strong>Risk Level:</strong> 
              <span style="color: ${vessel.riskLevel === 'High' ? '#EF4444' : vessel.riskLevel === 'Medium' ? '#F59E0B' : '#10B981'};">
                ${vessel.riskLevel}
              </span>
            </p>
            ${vessel.impacted ? '<p style="color: #EF4444; font-weight: bold;">⚠️ IMPACTED BY DISRUPTION</p>' : ''}
            <p style="color: #6B7280; font-size: 10px; margin-top: 8px;">
              Last Update: ${new Date(vessel.last_updated).toLocaleString()}
            </p>
            ${vessel.data_source ? `<p style="color: #6B7280; font-size: 10px;">Source: ${vessel.data_source}</p>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.addLayer(marker);
    });
  }, [vessels, showVessels, vesselFilter]);

  // Update disruption markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    disruptionsRef.current.clearLayers();

    if (!showDisruptions) return;

    disruptions.forEach(disruption => {
      const [latitude, longitude] = disruption.coordinates;
      
      if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) return;

      // Create disruption icon based on severity
      const getDisruptionIcon = (disruption: Disruption) => {
        const severityColors = {
          high: '#EF4444',
          medium: '#F59E0B',
          low: '#10B981'
        };

        const color = severityColors[disruption.severity] || '#6B7280';
        const size = disruption.severity === 'high' ? 20 : disruption.severity === 'medium' ? 16 : 12;

        return L.divIcon({
          className: 'disruption-marker',
          html: `
            <div style="
              width: ${size}px;
              height: ${size}px;
              background-color: ${color};
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: ${size * 0.6}px;
              color: white;
              animation: pulse 2s infinite;
            ">
              ⚠️
            </div>
            <style>
              @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.7; }
                100% { transform: scale(1); opacity: 1; }
              }
            </style>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      };

      const marker = L.marker([latitude, longitude], {
        icon: getDisruptionIcon(disruption)
      });

      // Create disruption popup
      const popupContent = `
        <div style="min-width: 280px;">
          <h3 style="margin: 0 0 8px 0; color: #1F2937; font-size: 14px; font-weight: bold;">
            ${disruption.title}
          </h3>
          <div style="font-size: 12px; line-height: 1.4;">
            <p><strong>Severity:</strong> 
              <span style="color: ${disruption.severity === 'high' ? '#EF4444' : disruption.severity === 'medium' ? '#F59E0B' : '#10B981'}; text-transform: uppercase; font-weight: bold;">
                ${disruption.severity}
              </span>
            </p>
            <p><strong>Type:</strong> ${disruption.type}</p>
            <p><strong>Status:</strong> ${disruption.status}</p>
            <p><strong>Category:</strong> ${disruption.category}</p>
            <p><strong>Affected Regions:</strong> ${disruption.affected_regions.join(', ')}</p>
            <p style="margin: 8px 0;"><strong>Description:</strong></p>
            <p style="font-style: italic; color: #4B5563;">${disruption.description}</p>
            <p><strong>Confidence:</strong> ${disruption.confidence}%</p>
            ${disruption.is_prediction ? '<p style="color: #8B5CF6; font-weight: bold;">🔮 PREDICTION</p>' : ''}
            <p style="color: #6B7280; font-size: 10px; margin-top: 8px;">
              Last Update: ${new Date(disruption.last_updated).toLocaleString()}
            </p>
            ${disruption.sources && disruption.sources.length > 0 ? 
              `<p style="color: #6B7280; font-size: 10px;">Source: ${disruption.sources[0].name}</p>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      disruptionsRef.current.addLayer(marker);
    });
  }, [disruptions, showDisruptions]);

  const vesselTypes = [...new Set(vessels.map(v => v.type))].sort();
  const impactedCount = vessels.filter(v => v.impacted).length;
  const highRiskCount = vessels.filter(v => v.riskLevel === 'High').length;
  const activeDisruptionsCount = disruptions.filter(d => d.status === 'active').length;

  return (
    <div className="relative">
      {/* Map Container */}
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="rounded-lg border border-gray-200 shadow-sm"
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading real-time data...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error loading data:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Controls Panel */}
      {showControls && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h4 className="font-semibold text-sm mb-3">Map Controls</h4>
          
          {/* Layer Toggles */}
          <div className="space-y-2 mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showVessels}
                onChange={(e) => setShowVessels(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Show Vessels ({vessels.length})</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showDisruptions}
                onChange={(e) => setShowDisruptions(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Show Disruptions ({disruptions.length})</span>
            </label>
          </div>

          {/* Vessel Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Filter Vessels:</label>
            <select
              value={vesselFilter}
              onChange={(e) => setVesselFilter(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All Vessels</option>
              <option value="impacted">Impacted ({impactedCount})</option>
              <option value="high-risk">High Risk ({highRiskCount})</option>
              {vesselTypes.slice(0, 5).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Stats */}
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Active Disruptions:</span>
              <span className="font-semibold text-red-600">{activeDisruptionsCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Impacted Vessels:</span>
              <span className="font-semibold text-orange-600">{impactedCount}</span>
            </div>
            <div className="flex justify-between">
              <span>High Risk:</span>
              <span className="font-semibold text-yellow-600">{highRiskCount}</span>
            </div>
          </div>

          {/* Last Update */}
          {lastUpdate && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Last Update: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="w-full mt-2 bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
        <h5 className="font-semibold text-xs mb-2">Legend</h5>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>Normal Vessel</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            <span>High Risk</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>Impacted</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
            <span>Disruption</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VesselMap;
