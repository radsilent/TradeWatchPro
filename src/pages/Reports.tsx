import React, { useState, useEffect } from 'react';
import { realDataService, Vessel, Tariff } from '../services/realDataService';

function Reports() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTime, setRefreshTime] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [vesselsData, tariffsData] = await Promise.all([
          realDataService.getVessels(500),
          realDataService.getTariffs(50)
        ]);
        
        setVessels(vesselsData.vessels);
        setTariffs(tariffsData.tariffs);
        setRefreshTime(new Date().toLocaleTimeString());
      } catch (err: any) {
        console.error('Error fetching report data:', err);
        setError(err.message || "Failed to load report data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000); // Refresh every 5 minutes for reports
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Trade Reports</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Generating reports...</div>
        </div>
      </div>
    );
  }

  // Calculate report metrics
  const totalVessels = vessels.length;
  const impactedVessels = vessels.filter(v => v.impacted).length;
  const highRiskVessels = vessels.filter(v => v.riskLevel === 'High').length;
  const avgSpeed = vessels.length > 0 ? 
    Math.round(vessels.reduce((sum, v) => sum + (v.speed || 0), 0) / vessels.length) : 0;

  const highTariffs = tariffs.filter(t => parseFloat(t.rate) > 15).length;
  const activeTariffs = tariffs.filter(t => t.status === 'active').length;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trade Reports</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive maritime trade analysis and insights
          </p>
        </div>
        <div className="flex gap-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Export PDF
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            Export Excel
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Executive Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{totalVessels}</div>
            <div className="text-sm text-muted-foreground">Total Vessels Tracked</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{impactedVessels}</div>
            <div className="text-sm text-muted-foreground">Vessels Impacted</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{highRiskVessels}</div>
            <div className="text-sm text-muted-foreground">High Risk Vessels</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{avgSpeed}</div>
            <div className="text-sm text-muted-foreground">Avg Speed (knots)</div>
          </div>
        </div>
      </div>

      {/* Fleet Performance Report */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Fleet Performance Report</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800">Operational Efficiency</h3>
              <div className="text-2xl font-bold text-blue-600 mt-2">
                {Math.round((totalVessels - impactedVessels) / totalVessels * 100)}%
              </div>
              <p className="text-sm text-blue-700 mt-1">Vessels operating normally</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800">Route Optimization</h3>
              <div className="text-2xl font-bold text-green-600 mt-2">87%</div>
              <p className="text-sm text-green-700 mt-1">Routes optimized for efficiency</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-800">Cost Savings</h3>
              <div className="text-2xl font-bold text-purple-600 mt-2">5-15%</div>
              <p className="text-sm text-purple-700 mt-1">Potential operational savings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tariff Analysis */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Tariff Analysis Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Tariff Overview</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Tariffs Monitored:</span>
                <span className="font-semibold">{tariffs.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Tariffs:</span>
                <span className="font-semibold">{activeTariffs}</span>
              </div>
              <div className="flex justify-between">
                <span>High Impact Tariffs (&gt;15%):</span>
                <span className="font-semibold text-red-600">{highTariffs}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Top Tariff Impacts</h3>
            <div className="space-y-2">
              {tariffs.slice(0, 5).map((tariff, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span className="text-sm">{tariff.product_category || 'Unknown Product'}</span>
                  <span className={`text-sm font-semibold ${
                    parseFloat(tariff.rate) > 15 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {tariff.rate || '0%'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Risk Assessment Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Risk Distribution</h3>
            <div className="space-y-3">
              {['Low', 'Medium', 'High'].map(risk => {
                const count = vessels.filter(v => v.riskLevel === risk).length;
                const percentage = totalVessels > 0 ? Math.round(count / totalVessels * 100) : 0;
                return (
                  <div key={risk} className="flex items-center justify-between">
                    <span>{risk} Risk</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            risk === 'High' ? 'bg-red-500' :
                            risk === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Recommendations</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-500">•</span>
                <span>Monitor high-risk vessels more frequently</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>Optimize routes for impacted vessels</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500">•</span>
                <span>Review tariff impacts on trade routes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500">•</span>
                <span>Implement predictive maintenance schedules</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Report Generation */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Generate Custom Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
            <div className="text-blue-600 text-2xl mb-2">📊</div>
            <div className="font-medium">Performance Report</div>
            <div className="text-sm text-muted-foreground">Fleet efficiency and KPIs</div>
          </button>
          
          <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
            <div className="text-green-600 text-2xl mb-2">💰</div>
            <div className="font-medium">Financial Report</div>
            <div className="text-sm text-muted-foreground">Cost analysis and savings</div>
          </button>
          
          <button className="p-4 bg-red-50 hover:bg-red-100 rounded-lg text-left transition-colors">
            <div className="text-red-600 text-2xl mb-2">⚠️</div>
            <div className="font-medium">Risk Report</div>
            <div className="text-sm text-muted-foreground">Risk assessment and mitigation</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Reports;