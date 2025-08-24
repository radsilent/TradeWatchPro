import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { realDataService, Disruption, Vessel } from '../services/realDataService';

function Alerts() {
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Disruption | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch real alert data
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚨 Alerts: Fetching real disruption and vessel data...');
      const [disruptionData, vesselData] = await Promise.all([
        realDataService.getDisruptions(),
        realDataService.getVessels(500) // Get vessels for impact analysis
      ]);
      
      setDisruptions(disruptionData.disruptions);
      setVessels(vesselData.vessels);
      setLastUpdate(new Date());
      console.log(`✅ Alerts updated: ${disruptionData.disruptions.length} disruptions, ${vesselData.vessels.length} vessels`);
    } catch (err) {
      console.error('❌ Alerts error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Auto-refresh every 30 seconds for alerts
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter disruptions
  const filteredDisruptions = React.useMemo(() => {
    let filtered = disruptions;

    if (filterSeverity !== 'all') {
      filtered = filtered.filter(d => d.severity === filterSeverity);
    }

    if (filterType !== 'all') {
      if (filterType === 'active') {
        filtered = filtered.filter(d => d.status === 'active');
      } else if (filterType === 'predictions') {
        filtered = filtered.filter(d => d.is_prediction);
      } else {
        filtered = filtered.filter(d => d.type === filterType);
      }
    }

    return filtered.sort((a, b) => {
      // Sort by severity (high first), then by date
      const severityOrder = { high: 3, medium: 2, low: 1 };
      const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
      if (severityDiff !== 0) return severityDiff;
      
      return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
    });
  }, [disruptions, filterSeverity, filterType]);

  // Alert statistics
  const alertStats = React.useMemo(() => {
    const activeAlerts = disruptions.filter(d => d.status === 'active').length;
    const highSeverityAlerts = disruptions.filter(d => d.severity === 'high' && d.status === 'active').length;
    const impactedVessels = vessels.filter(v => v.impacted).length;
    const predictions = disruptions.filter(d => d.is_prediction).length;

    const severityDistribution = disruptions.reduce((acc, disruption) => {
      acc[disruption.severity] = (acc[disruption.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeDistribution = disruptions.reduce((acc, disruption) => {
      acc[disruption.type] = (acc[disruption.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const regionDistribution = disruptions.reduce((acc, disruption) => {
      disruption.affected_regions.forEach(region => {
        acc[region] = (acc[region] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return {
      activeAlerts,
      highSeverityAlerts,
      impactedVessels,
      predictions,
      severityDistribution,
      typeDistribution,
      regionDistribution
    };
  }, [disruptions, vessels]);

  // Chart data
  const severityChartData = Object.entries(alertStats.severityDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: name === 'high' ? '#ef4444' : name === 'medium' ? '#f59e0b' : '#22c55e'
  }));

  const typeChartData = Object.entries(alertStats.typeDistribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const regionChartData = Object.entries(alertStats.regionDistribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const disruptionTypes = [...new Set(disruptions.map(d => d.type))].sort();

  const dismissAlert = (alertId: string) => {
    // In a real app, this would call an API to dismiss the alert
    setDisruptions(prev => prev.filter(d => d.id !== alertId));
  };

  const acknowledgeAlert = (alertId: string) => {
    // In a real app, this would call an API to acknowledge the alert
    setDisruptions(prev => prev.map(d => 
      d.id === alertId ? { ...d, status: 'acknowledged' } : d
    ));
  };

  if (loading && disruptions.length === 0) {
    return (
      <div className="animate-fade-in p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Loading Real-Time Alerts</h2>
            <p className="text-gray-600">Fetching live maritime disruptions and vessel impacts...</p>
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
          <h1 className="text-3xl font-bold text-foreground">Maritime Alerts & Disruptions</h1>
          <p className="text-muted-foreground mt-1">
            Real-time monitoring of {alertStats.activeAlerts} active disruptions affecting {alertStats.impactedVessels} vessels
          </p>
        </div>
        <div className="text-right">
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Alerts'}
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
          <p className="font-bold">Alert System Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
              <p className="text-2xl font-bold text-red-600">{alertStats.activeAlerts.toLocaleString()}</p>
            </div>
            <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-lg">🚨</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            From live news feeds
          </p>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">High Severity</p>
              <p className="text-2xl font-bold text-orange-600">{alertStats.highSeverityAlerts.toLocaleString()}</p>
            </div>
            <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-lg">⚠️</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Require immediate attention
          </p>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Impacted Vessels</p>
              <p className="text-2xl font-bold text-blue-600">{alertStats.impactedVessels.toLocaleString()}</p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-lg">🚢</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Affected by disruptions
          </p>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Predictions</p>
              <p className="text-2xl font-bold text-purple-600">{alertStats.predictions.toLocaleString()}</p>
            </div>
            <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 text-lg">🔮</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            AI-powered forecasts
          </p>
        </div>
      </div>

      {/* Alert Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Distribution */}
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Alert Severity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={severityChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {severityChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Alert Types */}
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Alert Types</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={typeChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={10} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Affected Regions */}
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Affected Regions</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={regionChartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} fontSize={10} />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alert List */}
      <div className="bg-card rounded-lg border">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Active Alerts</h3>
            <div className="flex gap-4">
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="all">All Severities</option>
                <option value="high">High ({alertStats.severityDistribution.high || 0})</option>
                <option value="medium">Medium ({alertStats.severityDistribution.medium || 0})</option>
                <option value="low">Low ({alertStats.severityDistribution.low || 0})</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="all">All Types</option>
                <option value="active">Active Only ({alertStats.activeAlerts})</option>
                <option value="predictions">Predictions ({alertStats.predictions})</option>
                {disruptionTypes.slice(0, 5).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredDisruptions.slice(0, 20).map((alert) => (
            <div key={alert.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      alert.severity === 'high' 
                        ? 'bg-red-100 text-red-800'
                        : alert.severity === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      alert.status === 'active'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {alert.status.toUpperCase()}
                    </span>
                    {alert.is_prediction && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        🔮 PREDICTION
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{alert.type}</span>
                  </div>
                  
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{alert.title}</h4>
                  <p className="text-gray-600 mb-3">{alert.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>📍 {alert.affected_regions.join(', ')}</span>
                    <span>🎯 Confidence: {alert.confidence}%</span>
                    <span>🕒 {new Date(alert.last_updated).toLocaleString()}</span>
                  </div>

                  {alert.sources && alert.sources.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-400">
                        Source: {alert.sources[0].name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setSelectedAlert(alert)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                  {alert.status === 'active' && (
                    <>
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDisruptions.length > 20 && (
          <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">
            Showing first 20 of {filteredDisruptions.length} alerts
          </div>
        )}

        {filteredDisruptions.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No alerts match the current filters.
          </div>
        )}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{selectedAlert.title}</h3>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedAlert.severity === 'high' 
                    ? 'bg-red-100 text-red-800'
                    : selectedAlert.severity === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {selectedAlert.severity.toUpperCase()}
                </span>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {selectedAlert.type}
                </span>
                {selectedAlert.is_prediction && (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                    🔮 PREDICTION
                  </span>
                )}
              </div>

              <p className="text-gray-700">{selectedAlert.description}</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Status:</strong> {selectedAlert.status}</p>
                  <p><strong>Category:</strong> {selectedAlert.category}</p>
                  <p><strong>Confidence:</strong> {selectedAlert.confidence}%</p>
                </div>
                <div>
                  <p><strong>Affected Regions:</strong> {selectedAlert.affected_regions.join(', ')}</p>
                  <p><strong>Coordinates:</strong> {selectedAlert.coordinates[0].toFixed(2)}, {selectedAlert.coordinates[1].toFixed(2)}</p>
                  <p><strong>Quality Score:</strong> {selectedAlert.quality_score}/5</p>
                </div>
              </div>

              {selectedAlert.sources && selectedAlert.sources.length > 0 && (
                <div>
                  <p className="font-semibold mb-2">Sources:</p>
                  {selectedAlert.sources.map((source, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      <p><strong>{source.name}</strong> ({source.reliability})</p>
                      <p className="text-xs">Published: {new Date(source.published_date).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs text-gray-500">
                <p>Created: {new Date(selectedAlert.created_date).toLocaleString()}</p>
                <p>Last Updated: {new Date(selectedAlert.last_updated).toLocaleString()}</p>
                {selectedAlert.start_date && (
                  <p>Start Date: {new Date(selectedAlert.start_date).toLocaleString()}</p>
                )}
                {selectedAlert.end_date && (
                  <p>End Date: {new Date(selectedAlert.end_date).toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Alerts;