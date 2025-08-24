import React, { useState, useEffect } from 'react';
import { realDataService, Disruption } from '../services/realDataService';

function Alerts() {
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTime, setRefreshTime] = useState<string>('');

  useEffect(() => {
    const fetchDisruptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await realDataService.getDisruptions();
        setDisruptions(data.disruptions);
        setRefreshTime(new Date().toLocaleTimeString());
      } catch (err: any) {
        console.error("Failed to fetch disruptions:", err);
        setError(err.message || "Failed to load disruption data.");
        setDisruptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDisruptions();
    const interval = setInterval(fetchDisruptions, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Maritime Alerts</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading alerts...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Maritime Alerts</h1>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-red-700">Error loading alerts: {error}</p>
        </div>
      </div>
    );
  }

  const activeAlerts = disruptions.filter(d => d.status === 'active').length;
  const highSeverity = disruptions.filter(d => d.severity === 'high').length;
  const predictions = disruptions.filter(d => d.event_type === 'prediction').length;
  const avgConfidence = disruptions.length > 0 ? 
    Math.round(disruptions.reduce((sum, d) => sum + (d.confidence || 0), 0) / disruptions.length) : 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Maritime Alerts</h1>
          <p className="text-muted-foreground mt-1">
            Real-time maritime disruptions and security alerts
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          <span className="text-sm text-muted-foreground">Live Monitoring</span>
        </div>
      </div>

      {/* Alert Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
              <p className="text-2xl font-bold">{activeAlerts}</p>
            </div>
            <div className="text-red-500 text-2xl">🚨</div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">High Severity</p>
              <p className="text-2xl font-bold">{highSeverity}</p>
            </div>
            <div className="text-orange-500 text-2xl">⚠️</div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Predictions</p>
              <p className="text-2xl font-bold">{predictions}</p>
            </div>
            <div className="text-blue-500 text-2xl">🔮</div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Confidence</p>
              <p className="text-2xl font-bold">{avgConfidence}%</p>
            </div>
            <div className="text-green-500 text-2xl">📊</div>
          </div>
        </div>
      </div>

      {/* Alert List */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Current Alerts</h2>
        <div className="space-y-4">
          {disruptions.slice(0, 20).map((alert, index) => (
            <div key={alert.id || index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {alert.severity?.toUpperCase() || 'LOW'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      alert.status === 'active' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {alert.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                      {alert.type || 'General'}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2">{alert.title || 'Maritime Alert'}</h3>
                  <p className="text-muted-foreground mb-2">{alert.description || 'Maritime disruption affecting operations.'}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Confidence: {alert.confidence || 0}%</span>
                    <span>Type: {alert.event_type || 'current'}</span>
                    {alert.coordinates && (
                      <span>Location: {alert.coordinates[0]?.toFixed(2)}, {alert.coordinates[1]?.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {alert.last_updated ? new Date(alert.last_updated).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alert Categories */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Alert Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Weather', 'Security', 'Port Operations'].map(category => {
            const count = disruptions.filter(d => d.type === category).length;
            return (
              <div key={category} className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{category}</span>
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {count} active alerts
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Alerts;