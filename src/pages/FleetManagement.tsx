import React, { useState, useEffect } from 'react';
import VesselMap from '../components/maps/VesselMap';
import { realDataService, Vessel } from '../services/realDataService';

function FleetManagement() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTime, setRefreshTime] = useState<string>('');

  useEffect(() => {
    const fetchVessels = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await realDataService.getVessels(1000); // Fetch up to 1000 vessels
        setVessels(data.vessels);
        setRefreshTime(new Date().toLocaleTimeString());
      } catch (err: any) {
        console.error("Failed to fetch vessels for fleet management:", err);
        setError(err.message || "Failed to load vessel data.");
        setVessels([]); // Clear vessels on error
      } finally {
        setLoading(false);
      }
    };

    fetchVessels();
    const interval = setInterval(fetchVessels, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Fleet Management</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading fleet data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Fleet Management</h1>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-red-700">Error loading fleet data: {error}</p>
        </div>
      </div>
    );
  }

  const totalVessels = vessels.length;
  const inTransit = vessels.filter(v => v.status === 'Under way using engine').length;
  const impacted = vessels.filter(v => v.impacted).length;
  const highRisk = vessels.filter(v => v.riskLevel === 'High').length;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fleet Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage your maritime fleet operations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm text-muted-foreground">Live Tracking</span>
        </div>
      </div>

      {/* Fleet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Vessels</p>
              <p className="text-2xl font-bold">{totalVessels}</p>
            </div>
            <div className="text-blue-500 text-2xl">🚢</div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">In Transit</p>
              <p className="text-2xl font-bold">{inTransit}</p>
            </div>
            <div className="text-green-500 text-2xl">⚡</div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Impacted</p>
              <p className="text-2xl font-bold">{impacted}</p>
            </div>
            <div className="text-orange-500 text-2xl">🚨</div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">High Risk</p>
              <p className="text-2xl font-bold">{highRisk}</p>
            </div>
            <div className="text-red-500 text-2xl">⚠️</div>
          </div>
        </div>
      </div>

      {/* Fleet Map */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Fleet Tracking Map</h2>
        <VesselMap vessels={vessels} height="600px" />
      </div>

      {/* Vessel List */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Active Fleet</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Vessel</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Location</th>
                <th className="text-left p-3">Speed</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Risk</th>
                <th className="text-left p-3">Flag</th>
              </tr>
            </thead>
            <tbody>
              {vessels.map((vessel, index) => (
                <tr key={vessel.id || index} className="border-b hover:bg-muted/50">
                  <td className="p-3">
                    <div>
                      <div className="font-medium">{vessel.name || 'Unknown Vessel'}</div>
                      <div className="text-sm text-muted-foreground">MMSI: {vessel.mmsi || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="p-3">{vessel.type || 'Unknown'}</td>
                  <td className="p-3">
                    <div className="text-sm">
                      <div>Lat: {vessel.latitude ? vessel.latitude.toFixed(4) : 'N/A'}</div>
                      <div>Lng: {vessel.longitude ? vessel.longitude.toFixed(4) : 'N/A'}</div>
                    </div>
                  </td>
                  <td className="p-3">{vessel.speed ? Math.round(vessel.speed) : 0} kts</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      vessel.status === 'Under way using engine' ? 'bg-green-100 text-green-800' :
                      vessel.status === 'At anchor' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {vessel.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      vessel.riskLevel === 'High' ? 'bg-red-100 text-red-800' :
                      vessel.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {vessel.riskLevel || 'Low'}
                    </span>
                  </td>
                  <td className="p-3">{vessel.flag || 'Unknown'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
            <div className="text-blue-600 text-2xl mb-2">📊</div>
            <div className="font-medium">Generate Report</div>
            <div className="text-sm text-muted-foreground">Create fleet performance report</div>
          </button>
          
          <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
            <div className="text-green-600 text-2xl mb-2">🗺️</div>
            <div className="font-medium">View Map</div>
            <div className="text-sm text-muted-foreground">See all vessels on interactive map</div>
          </button>
          
          <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors">
            <div className="text-purple-600 text-2xl mb-2">⚙️</div>
            <div className="font-medium">Fleet Settings</div>
            <div className="text-sm text-muted-foreground">Configure fleet parameters</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default FleetManagement;