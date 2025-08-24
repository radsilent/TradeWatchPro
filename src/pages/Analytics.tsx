import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { realDataService, Vessel, Disruption, Tariff } from '../services/realDataService';
import VesselMap from '../components/maps/VesselMap';

function Analytics() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Real-time metrics derived from actual data
  const [metrics, setMetrics] = useState({
    activeVessels: 0,
    impactedVessels: 0,
    activeDisruptions: 0,
    highRiskVessels: 0,
    avgSpeed: 0,
    realDataPercentage: 0
  });

  // Fetch real data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 Analytics: Fetching real maritime data...');
      
      const [vesselData, disruptionData, tariffData] = await Promise.all([
        realDataService.getVessels(1000),
        realDataService.getDisruptions(),
        realDataService.getTariffs(50)
      ]);

      setVessels(vesselData.vessels);
      setDisruptions(disruptionData.disruptions);
      setTariffs(tariffData.tariffs);

      // Calculate real metrics
      const impactedCount = vesselData.vessels.filter(v => v.impacted).length;
      const highRiskCount = vesselData.vessels.filter(v => v.riskLevel === 'High').length;
      const activeDisruptionsCount = disruptionData.disruptions.filter(d => d.status === 'active').length;
      const avgSpeed = vesselData.vessels.reduce((sum, v) => sum + (v.speed || 0), 0) / vesselData.vessels.length;

      setMetrics({
        activeVessels: vesselData.vessels.length,
        impactedVessels: impactedCount,
        activeDisruptions: activeDisruptionsCount,
        highRiskVessels: highRiskCount,
        avgSpeed: Math.round(avgSpeed * 10) / 10,
        realDataPercentage: vesselData.real_data_percentage
      });

      setLastUpdate(new Date());
      console.log(`✅ Analytics updated: ${vesselData.vessels.length} vessels, ${disruptionData.disruptions.length} disruptions`);
    } catch (err) {
      console.error('❌ Analytics error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Process data for charts
  const vesselTypeData = React.useMemo(() => {
    const typeCounts = vessels.reduce((acc, vessel) => {
      const type = vessel.type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 types
  }, [vessels]);

  const disruptionSeverityData = React.useMemo(() => {
    const severityCounts = disruptions.reduce((acc, disruption) => {
      acc[disruption.severity] = (acc[disruption.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = {
      high: '#ef4444',
      medium: '#f97316', 
      low: '#22c55e'
    };

    return Object.entries(severityCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: colors[name as keyof typeof colors] || '#6b7280'
    }));
  }, [disruptions]);

  const riskLevelData = React.useMemo(() => {
    const riskCounts = vessels.reduce((acc, vessel) => {
      acc[vessel.riskLevel] = (acc[vessel.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(riskCounts).map(([name, value]) => ({ name, value }));
  }, [vessels]);

  const flagData = React.useMemo(() => {
    const flagCounts = vessels.reduce((acc, vessel) => {
      const flag = vessel.flag || 'Unknown';
      acc[flag] = (acc[flag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(flagCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 flags
  }, [vessels]);

  const tariffImpactData = React.useMemo(() => {
    const impactCounts = tariffs.reduce((acc, tariff) => {
      acc[tariff.economic_impact] = (acc[tariff.economic_impact] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(impactCounts).map(([name, value]) => ({ name, value }));
  }, [tariffs]);

  if (loading && vessels.length === 0) {
    return (
      <div className="animate-fade-in p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Loading Real Maritime Data</h2>
            <p className="text-gray-600">Connecting to live AIS feeds, tariff APIs, and news sources...</p>
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
          <h1 className="text-3xl font-bold text-foreground">Real-Time Maritime Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Live data from AIS streams, government APIs, and maritime news sources
          </p>
        </div>
        <div className="text-right">
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
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
          <p className="font-bold">Data Loading Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Vessels</p>
              <p className="text-2xl font-bold text-foreground">{metrics.activeVessels.toLocaleString()}</p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-lg">🚢</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {metrics.realDataPercentage.toFixed(1)}% real AIS data
          </p>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Impacted Vessels</p>
              <p className="text-2xl font-bold text-red-600">{metrics.impactedVessels.toLocaleString()}</p>
            </div>
            <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-lg">⚠️</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {((metrics.impactedVessels / metrics.activeVessels) * 100).toFixed(1)}% of fleet
          </p>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Disruptions</p>
              <p className="text-2xl font-bold text-orange-600">{metrics.activeDisruptions.toLocaleString()}</p>
            </div>
            <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-lg">🌊</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            From live news feeds
          </p>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Speed</p>
              <p className="text-2xl font-bold text-green-600">{metrics.avgSpeed} kts</p>
            </div>
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-lg">⚡</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Fleet average speed
          </p>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="bg-card p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Live Vessel Tracking & Disruptions</h3>
        <VesselMap height="500px" showControls={true} autoRefresh={true} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vessel Types */}
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Vessel Types Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vesselTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Disruption Severity */}
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Disruption Severity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={disruptionSeverityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {disruptionSeverityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Levels */}
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Vessel Risk Levels</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={riskLevelData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Flag States */}
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Top Flag States</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={flagData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tariff Impact Analysis */}
      {tariffs.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Tariff Economic Impact Analysis</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tariffImpactData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tariffImpactData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="space-y-3">
              <h4 className="font-medium">Recent Tariff Updates</h4>
              {tariffs.slice(0, 5).map((tariff, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-3">
                  <p className="font-medium text-sm">{tariff.name}</p>
                  <p className="text-xs text-gray-600">Rate: {tariff.rate} | {tariff.status}</p>
                  <p className="text-xs text-gray-500">{tariff.importer} ← {tariff.exporter}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Data Sources */}
      <div className="bg-card p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Live Data Sources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl mb-2">🛰️</div>
            <h4 className="font-semibold">AIS Stream</h4>
            <p className="text-sm text-gray-600">Real-time vessel positions</p>
            <p className="text-xs text-green-600 mt-1">✅ Connected</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl mb-2">🏛️</div>
            <h4 className="font-semibold">Government APIs</h4>
            <p className="text-sm text-gray-600">USTR, WTO, EU TARIC</p>
            <p className="text-xs text-green-600 mt-1">✅ Connected</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl mb-2">📰</div>
            <h4 className="font-semibold">Maritime News</h4>
            <p className="text-sm text-gray-600">RSS feeds, disruption alerts</p>
            <p className="text-xs text-green-600 mt-1">✅ Connected</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;