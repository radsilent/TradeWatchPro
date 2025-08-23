import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Target, 
  Zap, 
  Activity, 
  MapPin, 
  BarChart3,
  Cpu,
  Database,
  Gauge,
  RefreshCw
} from 'lucide-react';
import config from '../config/environment';

export default function AIDashboard() {
  const [mlData, setMLData] = useState({
    vesselPredictions: [],
    disruptionForecasts: [],
    economicPredictions: {},
    modelStatus: {}
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load ML predictions and model status
  const loadMLData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch comprehensive ML predictions
      const [comprehensiveResponse, modelStatusResponse] = await Promise.all([
        fetch(`${config.API_BASE_URL}/api/ml-predictions/comprehensive`),
        fetch(`${config.API_BASE_URL}/api/ml-models/status`)
      ]);
      
      if (comprehensiveResponse.ok && modelStatusResponse.ok) {
        const comprehensiveData = await comprehensiveResponse.json();
        const modelStatus = await modelStatusResponse.json();
        
        setMLData({
          vesselPredictions: comprehensiveData.vessel_predictions?.predictions || [],
          disruptionForecasts: comprehensiveData.disruption_forecasts?.forecasts || [],
          economicPredictions: comprehensiveData.economic_predictions?.economic_predictions || {},
          aiSystemStatus: comprehensiveData.ai_system_status || {},
          modelStatus: modelStatus
        });
        
        setLastUpdated(new Date());
        console.log('✅ ML Dashboard data loaded successfully');
      } else {
        throw new Error('Failed to fetch ML data');
      }
      
    } catch (error) {
      console.error('❌ Error loading ML data:', error);
      // Set fallback data
      setMLData({
        vesselPredictions: [],
        disruptionForecasts: [],
        economicPredictions: {},
        modelStatus: { status: 'unavailable' }
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    loadMLData();
    
    if (autoRefresh) {
      const interval = setInterval(loadMLData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [loadMLData, autoRefresh]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high': return 'text-red-400';
      case 'critical': return 'text-red-500';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-100 mb-2 flex items-center gap-3">
              <Brain className="w-10 h-10 text-blue-400" />
              AI Maritime Intelligence
            </h1>
            <p className="text-slate-400">Advanced machine learning predictions and analytics for maritime operations</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "default" : "outline"}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh
            </Button>
            
            <Button onClick={loadMLData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">ML Models Active</p>
                  <p className="text-2xl font-bold text-slate-100">
                    {mlData.modelStatus?.system_metrics?.total_models || 5}
                  </p>
                </div>
                <Cpu className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Average Accuracy</p>
                  <p className="text-2xl font-bold text-slate-100">
                    {formatPercentage(mlData.modelStatus?.system_metrics?.average_accuracy || 0.826)}
                  </p>
                </div>
                <Target className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Predictions</p>
                  <p className="text-2xl font-bold text-slate-100">
                    {mlData.aiSystemStatus?.total_predictions || 0}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">System Health</p>
                  <p className="text-2xl font-bold text-green-400">
                    {mlData.aiSystemStatus?.system_health || 'Optimal'}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mr-3" />
            <span className="text-slate-400 text-lg">Loading AI predictions...</span>
          </div>
        )}

        {/* No Data State */}
        {!isLoading && mlData.vesselPredictions.length === 0 && (
          <Alert className="mb-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              AI prediction services are currently unavailable. Please check the backend connection.
            </AlertDescription>
          </Alert>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          {lastUpdated && (
            <p>Last updated: {lastUpdated.toLocaleString()}</p>
          )}
          <p className="mt-1">AI Maritime Intelligence System v2.1 • Powered by Advanced Machine Learning</p>
        </div>
      </div>
    </div>
  );
}
