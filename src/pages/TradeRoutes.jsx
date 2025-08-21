import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TradeRoutes from "../components/dashboard/TradeRoutes";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Ship, TrendingUp, Globe, MapPin, Activity, AlertTriangle } from "lucide-react";

export default function TradeRoutesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1year');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    // Mobile detection
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Trade route performance data
  const routePerformance = [
    { name: 'Asia-Europe', volume: 24.5, efficiency: 92, delays: 3.2, cost: 1240 },
    { name: 'Trans-Pacific', volume: 18.7, efficiency: 88, delays: 2.8, cost: 980 },
    { name: 'Asia-Middle East', volume: 12.3, efficiency: 75, delays: 8.5, cost: 620 },
    { name: 'Europe-Americas', volume: 9.8, efficiency: 95, delays: 1.2, cost: 540 },
    { name: 'Intra-Asia', volume: 15.2, efficiency: 90, delays: 2.1, cost: 450 },
    { name: 'Panama Route', volume: 6.8, efficiency: 82, delays: 5.8, cost: 380 },
    { name: 'Northern Sea', volume: 2.1, efficiency: 65, delays: 12.5, cost: 120 },
    { name: 'Africa-Global', volume: 6.7, efficiency: 78, delays: 6.2, cost: 280 }
  ];

  // Vessel traffic data
  const vesselTraffic = [
    { route: 'Asia-Europe', cargo: 45, tanker: 15, bulk: 25, container: 85 },
    { route: 'Trans-Pacific', cargo: 35, tanker: 10, bulk: 20, container: 75 },
    { route: 'Asia-Middle East', cargo: 25, tanker: 35, bulk: 15, container: 45 },
    { route: 'Europe-Americas', cargo: 30, tanker: 12, bulk: 18, container: 55 },
    { route: 'Intra-Asia', cargo: 40, tanker: 8, bulk: 22, container: 70 },
    { route: 'Panama Route', cargo: 20, tanker: 18, bulk: 12, container: 35 },
    { route: 'Northern Sea', cargo: 8, tanker: 5, bulk: 15, container: 12 },
    { route: 'Africa-Global', cargo: 15, tanker: 20, bulk: 25, container: 30 }
  ];

  // Risk assessment data
  const riskData = [
    { factor: 'Geopolitical', critical: 3, high: 2, medium: 2, low: 1 },
    { factor: 'Weather', critical: 1, high: 4, medium: 2, low: 1 },
    { factor: 'Piracy', critical: 2, high: 1, medium: 3, low: 2 },
    { factor: 'Infrastructure', critical: 1, high: 2, medium: 4, low: 1 },
    { factor: 'Regulatory', critical: 0, high: 3, medium: 3, low: 2 }
  ];

  // Trade volume trends (monthly data)
  const volumeTrends = [
    { month: 'Jan', asiaEurope: 24.2, transPacific: 18.1, asiaME: 12.0, euroAmericas: 9.5 },
    { month: 'Feb', asiaEurope: 23.8, transPacific: 18.3, asiaME: 11.8, euroAmericas: 9.7 },
    { month: 'Mar', asiaEurope: 24.9, transPacific: 18.9, asiaME: 12.2, euroAmericas: 9.9 },
    { month: 'Apr', asiaEurope: 24.1, transPacific: 18.5, asiaME: 12.5, euroAmericas: 9.6 },
    { month: 'May', asiaEurope: 25.2, transPacific: 19.1, asiaME: 12.8, euroAmericas: 10.1 },
    { month: 'Jun', asiaEurope: 24.7, transPacific: 18.8, asiaME: 12.1, euroAmericas: 9.8 },
    { month: 'Jul', asiaEurope: 24.5, transPacific: 18.7, asiaME: 12.3, euroAmericas: 9.8 },
    { month: 'Aug', asiaEurope: 24.3, transPacific: 18.6, asiaME: 12.4, euroAmericas: 9.9 },
    { month: 'Sep', asiaEurope: 24.8, transPacific: 18.9, asiaME: 12.6, euroAmericas: 10.0 },
    { month: 'Oct', asiaEurope: 24.6, transPacific: 18.8, asiaME: 12.2, euroAmericas: 9.7 },
    { month: 'Nov', asiaEurope: 24.4, transPacific: 18.4, asiaME: 12.0, euroAmericas: 9.8 },
    { month: 'Dec', asiaEurope: 24.9, transPacific: 19.0, asiaME: 12.5, euroAmericas: 10.2 }
  ];

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return '#10b981';
    if (efficiency >= 80) return '#3b82f6';
    if (efficiency >= 70) return '#f59e0b';
    return '#ef4444';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading trade routes analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Global Trade Routes Analysis</h1>
          <p className="text-slate-400">Comprehensive analysis of major shipping lanes, trade vectors, and route performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Trade Routes</p>
                  <p className="text-2xl font-bold text-slate-100">8</p>
                  <p className="text-green-400 text-xs">Global coverage</p>
                </div>
                <Ship className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Volume</p>
                  <p className="text-2xl font-bold text-slate-100">96.1M TEU</p>
                  <p className="text-green-400 text-xs">+2.8% YoY</p>
                </div>
                <Activity className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Trade Value</p>
                  <p className="text-2xl font-bold text-slate-100">$4.61T</p>
                  <p className="text-blue-400 text-xs">Annual total</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Critical Chokepoints</p>
                  <p className="text-2xl font-bold text-slate-100">5</p>
                  <p className="text-red-400 text-xs">High risk</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Trade Routes Map */}
        <TradeRoutes />

        {/* Detailed Analysis Tabs */}
        <Tabs defaultValue="performance" className="space-y-6 mt-8">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
            <TabsTrigger value="performance">Route Performance</TabsTrigger>
            <TabsTrigger value="traffic">Vessel Traffic</TabsTrigger>
            <TabsTrigger value="risks">Risk Analysis</TabsTrigger>
            <TabsTrigger value="trends">Volume Trends</TabsTrigger>
          </TabsList>

          {/* Route Performance */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-slate-100">Route Efficiency Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={routePerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        labelStyle={{ color: '#f9fafb' }}
                      />
                      <Bar dataKey="efficiency" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-slate-100">Average Delays by Route</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={routePerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        labelStyle={{ color: '#f9fafb' }}
                        formatter={(value) => [`${value} days`, 'Average Delay']}
                      />
                      <Bar dataKey="delays" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Performance Table */}
            <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-100">Detailed Route Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {isMobile ? (
                  /* Mobile Card Layout */
                  <div className="space-y-4">
                    {routePerformance.map((route, index) => (
                      <div key={index} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-slate-100 font-medium text-sm">{route.name}</h4>
                          <Badge className={route.efficiency >= 85 ? 'bg-green-500' : route.efficiency >= 75 ? 'bg-yellow-500' : 'bg-red-500'}>
                            {route.efficiency >= 85 ? 'Optimal' : route.efficiency >= 75 ? 'Good' : 'Needs Attention'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400">Volume:</span>
                            <span className="text-slate-300 ml-1">{route.volume}M TEU</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Efficiency:</span>
                            <span className="text-slate-300 ml-1">{route.efficiency}%</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Delays:</span>
                            <span className="text-slate-300 ml-1">{route.delays} days</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Value:</span>
                            <span className="text-slate-300 ml-1">${route.cost}B</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Desktop Table Layout */
                  <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left text-slate-300 p-3">Route</th>
                        <th className="text-left text-slate-300 p-3">Volume (TEU)</th>
                        <th className="text-left text-slate-300 p-3">Efficiency</th>
                        <th className="text-left text-slate-300 p-3">Avg Delays</th>
                        <th className="text-left text-slate-300 p-3">Trade Value</th>
                        <th className="text-left text-slate-300 p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routePerformance.map((route, index) => (
                        <tr key={index} className="border-b border-slate-700/50">
                          <td className="p-3 text-slate-100 font-medium">{route.name}</td>
                          <td className="p-3 text-slate-300">{route.volume}M</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: getEfficiencyColor(route.efficiency) }}
                              ></div>
                              <span className="text-slate-300">{route.efficiency}%</span>
                            </div>
                          </td>
                          <td className="p-3 text-slate-300">{route.delays} days</td>
                          <td className="p-3 text-slate-300">${route.cost}B</td>
                          <td className="p-3">
                            <Badge className={route.efficiency >= 85 ? 'bg-green-500' : route.efficiency >= 75 ? 'bg-yellow-500' : 'bg-red-500'}>
                              {route.efficiency >= 85 ? 'Optimal' : route.efficiency >= 75 ? 'Good' : 'Needs Attention'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vessel Traffic */}
          <TabsContent value="traffic" className="space-y-6">
            <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-100">Vessel Type Distribution by Route</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={vesselTraffic}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="route" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#f9fafb' }}
                    />
                    <Bar dataKey="container" stackId="a" fill="#3b82f6" name="Container" />
                    <Bar dataKey="cargo" stackId="a" fill="#10b981" name="General Cargo" />
                    <Bar dataKey="tanker" stackId="a" fill="#f59e0b" name="Tanker" />
                    <Bar dataKey="bulk" stackId="a" fill="#8b5cf6" name="Bulk Carrier" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risk Analysis */}
          <TabsContent value="risks" className="space-y-6">
            <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-100">Risk Factors by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={riskData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="factor" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#f9fafb' }}
                    />
                    <Bar dataKey="critical" stackId="a" fill="#dc2626" name="Critical" />
                    <Bar dataKey="high" stackId="a" fill="#f59e0b" name="High" />
                    <Bar dataKey="medium" stackId="a" fill="#3b82f6" name="Medium" />
                    <Bar dataKey="low" stackId="a" fill="#10b981" name="Low" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Volume Trends */}
          <TabsContent value="trends" className="space-y-6">
            <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-100">Monthly Trade Volume Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={volumeTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#f9fafb' }}
                    />
                    <Line type="monotone" dataKey="asiaEurope" stroke="#3b82f6" strokeWidth={2} name="Asia-Europe" />
                    <Line type="monotone" dataKey="transPacific" stroke="#10b981" strokeWidth={2} name="Trans-Pacific" />
                    <Line type="monotone" dataKey="asiaME" stroke="#f59e0b" strokeWidth={2} name="Asia-Middle East" />
                    <Line type="monotone" dataKey="euroAmericas" stroke="#8b5cf6" strokeWidth={2} name="Europe-Americas" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
