import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { realDataService, Vessel } from '../services/realDataService';
import VesselMap from '../components/maps/VesselMap';

function FleetManagement() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch real vessel data
  const fetchVessels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚢 Fleet Management: Fetching real vessel data...');
      const data = await realDataService.getVessels(2000); // Get more vessels for fleet management
      
      setVessels(data.vessels);
      setLastUpdate(new Date());
      console.log(`✅ Fleet updated: ${data.vessels.length} vessels (${data.real_data_percentage}% real data)`);
    } catch (err) {
      console.error('❌ Fleet error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVessels();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchVessels, 120000);
    return () => clearInterval(interval);
  }, []);

  // Filter and sort vessels
  const filteredVessels = React.useMemo(() => {
    let filtered = vessels;

    // Apply type filter
    if (filterType !== 'all') {
      if (filterType === 'impacted') {
        filtered = filtered.filter(v => v.impacted);
      } else if (filterType === 'high-risk') {
        filtered = filtered.filter(v => v.riskLevel === 'High');
      } else {
        filtered = filtered.filter(v => v.type.toLowerCase().includes(filterType.toLowerCase()));
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'speed':
          return (b.speed || 0) - (a.speed || 0);
        case 'risk':
          const riskOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          return (riskOrder[b.riskLevel as keyof typeof riskOrder] || 0) - (riskOrder[a.riskLevel as keyof typeof riskOrder] || 0);
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    return filtered;
  }, [vessels, filterType, sortBy]);

  // Fleet statistics
  const fleetStats = React.useMemo(() => {
    const totalVessels = vessels.length;
    const impactedVessels = vessels.filter(v => v.impacted).length;
    const highRiskVessels = vessels.filter(v => v.riskLevel === 'High').length;
    const averageSpeed = vessels.reduce((sum, v) => sum + (v.speed || 0), 0) / totalVessels;
    
    const typeDistribution = vessels.reduce((acc, vessel) => {
      acc[vessel.type] = (acc[vessel.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const flagDistribution = vessels.reduce((acc, vessel) => {
      const flag = vessel.flag || 'Unknown';
      acc[flag] = (acc[flag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalVessels,
      impactedVessels,
      highRiskVessels,
      averageSpeed: Math.round(averageSpeed * 10) / 10,
      typeDistribution,
      flagDistribution
    };
  }, [vessels]);

  // Chart data
  const typeChartData = Object.entries(fleetStats.typeDistribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const flagChartData = Object.entries(fleetStats.flagDistribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const riskChartData = [
    { name: 'Low Risk', value: vessels.filter(v => v.riskLevel === 'Low').length, color: '#22c55e' },
    { name: 'Medium Risk', value: vessels.filter(v => v.riskLevel === 'Medium').length, color: '#f59e0b' },
    { name: 'High Risk', value: vessels.filter(v => v.riskLevel === 'High').length, color: '#ef4444' },
  ];

  const vesselTypes = [...new Set(vessels.map(v => v.type))].sort();

  if (loading && vessels.length === 0) {
    return (
      <div className="animate-fade-in p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Loading Fleet Data</h2>
            <p className="text-gray-600">Fetching real-time vessel information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fleet Management</h1>
          <p className="text-muted-foreground mt-1">
            Real-time tracking of {fleetStats.totalVessels.toLocaleString()} vessels worldwide
          </p>
        </div>
        <div className="text-right">
          <button
            onClick={fetchVessels}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Fleet'}
          </button>
          {lastUpdate && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Fleet Data Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Fleet Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Vessels</p>
              <p className="text-2xl font-bold text-foreground">{fleetStats.totalVessels.toLocaleString()}</p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-lg">🚢</span>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Impacted Vessels</p>
              <p className="text-2xl font-bold text-red-600">{fleetStats.impactedVessels.toLocaleString()}</p>
            </div>
            <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-lg">⚠️</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {((fleetStats.impactedVessels / fleetStats.totalVessels) * 100).toFixed(1)}% of fleet
          </p>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">High Risk</p>
              <p className="text-2xl font-bold text-orange-600">{fleetStats.highRiskVessels.toLocaleString()}</p>
            </div>
            <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-lg">🔥</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Require attention
          </p>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Speed</p>
              <p className="text-2xl font-bold text-green-600">{fleetStats.averageSpeed} kts</p>
            </div>
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-lg">⚡</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Fleet average
          </p>
        </div>
      </div>

      {/* Fleet Map */}
      <div className="bg-card p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Fleet Positions & Risk Assessment</h3>
        <VesselMap height="500px" showControls={true} autoRefresh={true} />
      </div>

      {/* Fleet Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vessel Types */}
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Fleet Composition</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={10} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {riskChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Flag States */}
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Flag States</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={flagChartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={60} fontSize={10} />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vessel List */}
      <div className="bg-card rounded-lg border">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Vessel List</h3>
            <div className="flex gap-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="all">All Vessels ({vessels.length})</option>
                <option value="impacted">Impacted ({fleetStats.impactedVessels})</option>
                <option value="high-risk">High Risk ({fleetStats.highRiskVessels})</option>
                {vesselTypes.slice(0, 5).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="name">Sort by Name</option>
                <option value="speed">Sort by Speed</option>
                <option value="risk">Sort by Risk</option>
                <option value="type">Sort by Type</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vessel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flag</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Speed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVessels.slice(0, 50).map((vessel) => (
                <tr key={vessel.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{vessel.name}</div>
                      <div className="text-sm text-gray-500">IMO: {vessel.imo || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vessel.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vessel.flag || 'Unknown'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vessel.speed} kts</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      vessel.impacted 
                        ? 'bg-red-100 text-red-800' 
                        : vessel.status === 'Underway' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {vessel.impacted ? '⚠️ Impacted' : vessel.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      vessel.riskLevel === 'High' 
                        ? 'bg-red-100 text-red-800'
                        : vessel.riskLevel === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {vessel.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedVessel(vessel)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredVessels.length > 50 && (
          <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">
            Showing first 50 of {filteredVessels.length} vessels
          </div>
        )}
      </div>

      {/* Vessel Detail Modal */}
      {selectedVessel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{selectedVessel.name}</h3>
              <button
                onClick={() => setSelectedVessel(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>IMO:</strong> {selectedVessel.imo || 'N/A'}</p>
                <p><strong>MMSI:</strong> {selectedVessel.mmsi || 'N/A'}</p>
                <p><strong>Type:</strong> {selectedVessel.type}</p>
                <p><strong>Flag:</strong> {selectedVessel.flag || 'Unknown'}</p>
                <p><strong>Length:</strong> {selectedVessel.length || 'N/A'} m</p>
                <p><strong>Beam:</strong> {selectedVessel.beam || 'N/A'} m</p>
              </div>
              <div>
                <p><strong>Speed:</strong> {selectedVessel.speed} knots</p>
                <p><strong>Course:</strong> {selectedVessel.course}°</p>
                <p><strong>Status:</strong> {selectedVessel.status}</p>
                <p><strong>Risk Level:</strong> {selectedVessel.riskLevel}</p>
                <p><strong>Destination:</strong> {selectedVessel.destination || 'N/A'}</p>
                <p><strong>Route:</strong> {selectedVessel.route || 'N/A'}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <p><strong>Position:</strong> {selectedVessel.latitude.toFixed(4)}, {selectedVessel.longitude.toFixed(4)}</p>
              <p><strong>Last Update:</strong> {new Date(selectedVessel.last_updated).toLocaleString()}</p>
              {selectedVessel.data_source && (
                <p><strong>Data Source:</strong> {selectedVessel.data_source}</p>
              )}
              {selectedVessel.impacted && (
                <p className="text-red-600 font-semibold mt-2">⚠️ This vessel is impacted by active disruptions</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FleetManagement;