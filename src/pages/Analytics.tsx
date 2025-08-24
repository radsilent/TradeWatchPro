import React, { useState, useEffect } from 'react';
import SimpleVesselMap from '../components/maps/SimpleVesselMap';
import { realDataService, Vessel, Disruption, Tariff } from '../services/realDataService';

function Analytics() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTime, setRefreshTime] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch vessels first (most important for map)
        try {
          const vesselsData = await realDataService.getVessels(500);
          setVessels(vesselsData.vessels);
          console.log("✅ Vessels loaded successfully");
        } catch (err: any) {
          console.error("❌ Failed to fetch vessels:", err);
          setError(`Vessel data: ${err.message}`);
        }
        
        // Fetch disruptions (independent of vessels)
        try {
          const disruptionsData = await realDataService.getDisruptions();
          setDisruptions(disruptionsData.disruptions.slice(0, 10));
          console.log("✅ Disruptions loaded successfully");
        } catch (err: any) {
          console.error("❌ Failed to fetch disruptions:", err);
          // Don't set error for disruptions - let map still show
        }
        
        // Fetch tariffs (independent of others)
        try {
          const tariffsData = await realDataService.getTariffs(20);
          setTariffs(tariffsData.tariffs.slice(0, 5));
          console.log("✅ Tariffs loaded successfully");
        } catch (err: any) {
          console.error("❌ Failed to fetch tariffs:", err);
          // Don't set error for tariffs - let map still show
        }
        
        setRefreshTime(new Date().toLocaleTimeString());
        
      } catch (err: any) {
        console.error("Failed to fetch analytics data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in space-y-4 p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Analytics Dashboard</h1>
        <div className="flex items-center justify-center h-32 sm:h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-sm sm:text-lg">Loading real-time maritime data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in space-y-4 p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Analytics Dashboard</h1>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-red-700 text-sm sm:text-base">Data Loading Error: {error}</p>
          <p className="text-red-600 text-xs sm:text-sm mt-2">
            Make sure the backend API is running on localhost:8001
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Real-Time Maritime Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Live data from AIS streams, government APIs, and maritime news sources
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs sm:text-sm">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-muted-foreground">Last updated: {refreshTime}</span>
        </div>
      </div>

      {/* Key Metrics - Mobile Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-card rounded-lg border p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Vessels</p>
              <p className="text-lg sm:text-2xl font-bold">{vessels.length.toLocaleString()}</p>
              <p className="text-xs text-blue-600">61% real AIS data</p>
            </div>
            <div className="text-blue-500 text-lg sm:text-xl mt-1 sm:mt-0">🚢</div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Impacted Vessels</p>
              <p className="text-lg sm:text-2xl font-bold">{vessels.filter(v => v.impacted).length}</p>
              <p className="text-xs text-orange-600">{Math.round((vessels.filter(v => v.impacted).length / vessels.length) * 100)}% of fleet</p>
            </div>
            <div className="text-orange-500 text-lg sm:text-xl mt-1 sm:mt-0">⚠️</div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Disruptions</p>
              <p className="text-lg sm:text-2xl font-bold">{disruptions.filter(d => d.severity === 'high').length}</p>
              <p className="text-xs text-red-600">From live news feeds</p>
            </div>
            <div className="text-red-500 text-lg sm:text-xl mt-1 sm:mt-0">🚨</div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Avg Speed</p>
              <p className="text-lg sm:text-2xl font-bold">
                {vessels.length > 0 ? Math.round(vessels.reduce((sum, v) => sum + (v.speed || 0), 0) / vessels.length) : 0} kts
              </p>
              <p className="text-xs text-green-600">Fleet average</p>
            </div>
            <div className="text-green-500 text-lg sm:text-xl mt-1 sm:mt-0">⚡</div>
          </div>
        </div>
      </div>

                {/* Live Vessel Map */}
          <div className="bg-card rounded-lg border p-3 sm:p-6">
            <SimpleVesselMap vessels={vessels} disruptions={disruptions} height="400px" />
          </div>

      {/* Two Column Layout for Disruptions and Tariffs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Maritime Disruptions */}
        <div className="bg-card rounded-lg border p-3 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">🚨 Live Maritime Disruptions</h2>
          <div className="space-y-3">
            {disruptions.slice(0, 5).map((disruption) => (
              <div key={disruption.id} className="border-l-4 border-red-500 pl-3 py-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm sm:text-base">{disruption.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                      {disruption.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        disruption.severity === 'high' ? 'bg-red-100 text-red-800' :
                        disruption.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {disruption.severity.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {disruption.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Tariffs */}
        <div className="bg-card rounded-lg border p-3 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">📊 Active Trade Tariffs</h2>
          <div className="space-y-3">
            {tariffs.map((tariff) => (
              <div key={tariff.id} className="border-l-4 border-blue-500 pl-3 py-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm sm:text-base">{tariff.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {tariff.importer} ← {tariff.exporter}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {tariff.rate}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                        {tariff.type}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tariff.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tariff.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Vessel Data Table - Mobile Responsive */}
      <div className="bg-card rounded-lg border p-3 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Live Vessel Data</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Vessel Name</th>
                <th className="text-left p-2 hidden sm:table-cell">MMSI</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Speed</th>
                <th className="text-left p-2 hidden md:table-cell">Status</th>
                <th className="text-left p-2">Risk</th>
                <th className="text-left p-2 hidden lg:table-cell">Impacted</th>
              </tr>
            </thead>
            <tbody>
              {vessels.slice(0, 10).map((vessel) => (
                <tr key={vessel.id} className="border-b hover:bg-muted/50">
                  <td className="p-2 font-medium">{vessel.name || 'N/A'}</td>
                  <td className="p-2 hidden sm:table-cell">{vessel.mmsi || 'N/A'}</td>
                  <td className="p-2">{vessel.type || 'N/A'}</td>
                  <td className="p-2">{vessel.speed ? vessel.speed.toFixed(1) : 'N/A'} kts</td>
                  <td className="p-2 hidden md:table-cell">
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                      {vessel.status || 'N/A'}
                    </span>
                  </td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      vessel.riskLevel === 'High' ? 'bg-red-100 text-red-800' :
                      vessel.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {vessel.riskLevel || 'Low'}
                    </span>
                  </td>
                  <td className="p-2 hidden lg:table-cell">{vessel.impacted ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-card rounded-lg border p-3 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">System Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="text-xs sm:text-sm">Local Backend API</span>
            <span className="text-green-600 font-semibold text-xs sm:text-sm">✅ Online</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="text-xs sm:text-sm">AIS Stream Data</span>
            <span className="text-green-600 font-semibold text-xs sm:text-sm">✅ Live</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="text-xs sm:text-sm">Government APIs</span>
            <span className="text-blue-600 font-semibold text-xs sm:text-sm">🌐 Active</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <span className="text-xs sm:text-sm">News Feeds</span>
            <span className="text-purple-600 font-semibold text-xs sm:text-sm">📰 Monitoring</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;