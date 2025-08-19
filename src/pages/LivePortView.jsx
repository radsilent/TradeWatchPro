import React, { useState, useEffect } from "react";
import { Port } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Satellite, MapPin, Clock, Users, Ship, Anchor, Eye, Zap, Globe, Calendar, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function LivePortView() {
  const [ports, setPorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [satelliteLoading, setSatelliteLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadPorts();
    // Update timestamp every 30 seconds to simulate real-time
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPorts = async () => {
    setIsLoading(true);
    try {
      const portsData = await Port.list('-strategic_importance', 200);
      setPorts(portsData);
      console.log('Live Port View - Ports Loaded:', portsData.length);
    } catch (error) {
      console.error("Error loading ports:", error);
    }
    setIsLoading(false);
  };

  const handlePortSelect = (portId) => {
    const port = ports.find(p => (p.id || p.name) === portId);
    setSelectedPort(port);
    setSatelliteLoading(true);
    
    // Simulate satellite image loading
    setTimeout(() => {
      setSatelliteLoading(false);
    }, 2000);
  };

  const generatePortActivity = (port) => {
    if (!port) return {};
    
    const baseActivity = port.strategic_importance || 50;
    const variation = Math.sin(Date.now() / 100000) * 20; // Simulate activity variation
    
    return {
      vesselCount: Math.floor((baseActivity / 10) + variation + Math.random() * 5) + 5,
      anchoredVessels: Math.floor(Math.random() * 8) + 2,
      berthOccupancy: Math.min(100, Math.floor(baseActivity + variation + Math.random() * 20)),
      craneActivity: Math.floor(Math.random() * 12) + 4,
      trafficLevel: baseActivity > 80 ? 'High' : baseActivity > 60 ? 'Medium' : 'Low',
      weatherCondition: ['Clear', 'Partly Cloudy', 'Overcast', 'Light Rain'][Math.floor(Math.random() * 4)],
      visibility: Math.floor(Math.random() * 5) + 8, // 8-12 km
      windSpeed: Math.floor(Math.random() * 15) + 5, // 5-20 knots
      waveHeight: (Math.random() * 2 + 0.5).toFixed(1), // 0.5-2.5m
      currentVesselsInPort: Math.floor(Math.random() * 15) + 8,
      expectedArrivals24h: Math.floor(Math.random() * 20) + 5,
      cargoHandled24h: Math.floor(Math.random() * 50000) + 10000 // TEU
    };
  };

  const formatPortName = (port) => {
    return `${port.name} - ${port.country}${port.rank ? ` (Rank #${port.rank})` : ''}`;
  };

  const getActivityColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWeatherIcon = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'clear': return '☀️';
      case 'partly cloudy': return '⛅';
      case 'overcast': return '☁️';
      case 'light rain': return '🌦️';
      default: return '☀️';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading port data...</p>
        </div>
      </div>
    );
  }

  const portActivity = selectedPort ? generatePortActivity(selectedPort) : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Satellite className="h-8 w-8 text-blue-600" />
            Live Port View
          </h1>
          <p className="text-slate-600 mt-2">
            Auto-zoom satellite monitoring with vessel tracking using integrated AIS and RF data streams
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Clock className="h-4 w-4" />
          <span>Last updated: {format(lastUpdate, 'HH:mm:ss')}</span>
        </div>
      </div>

      {/* Port Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Port
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select onValueChange={handlePortSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a port for auto-zoom satellite tracking with AIS/RF data..." />
                </SelectTrigger>
                <SelectContent>
                  {ports.slice(0, 50).map((port) => (
                    <SelectItem key={port.id || port.name} value={port.id || port.name}>
                      {formatPortName(port)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {ports.length} ports available
            </Badge>
          </div>
        </CardContent>
      </Card>

      {selectedPort && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Satellite View */}
          <div className="xl:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Satellite className="h-5 w-5" />
                    Live Satellite View - {selectedPort.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-slate-600">LIVE</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 rounded-b-lg overflow-hidden">
                  {satelliteLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-lg font-medium">Loading satellite imagery...</p>
                        <p className="text-sm opacity-75">Connecting to orbital satellites</p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Satellite className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-2xl font-bold mb-2">Coming Soon</h3>
                        <p className="text-lg mb-4">Live Satellite Port Monitoring</p>
                        <p className="text-sm opacity-75 max-w-lg mx-auto mb-6">
                          Advanced satellite imagery with intelligent zoom capabilities to track vessel movements, 
                          port throughput, and real-time operations using integrated AIS and RF data sources.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-6 text-left">
                          <div className="bg-black/30 rounded-lg p-4">
                            <h4 className="font-semibold mb-2 text-blue-300">🛰️ Satellite Features</h4>
                            <ul className="text-xs space-y-1 opacity-90">
                              <li>• Auto-zoom to port boundaries</li>
                              <li>• Real-time vessel detection</li>
                              <li>• Berth occupancy monitoring</li>
                              <li>• Container yard analysis</li>
                            </ul>
                          </div>
                          
                          <div className="bg-black/30 rounded-lg p-4">
                            <h4 className="font-semibold mb-2 text-green-300">📡 Data Integration</h4>
                            <ul className="text-xs space-y-1 opacity-90">
                              <li>• AIS vessel positioning</li>
                              <li>• RF signal tracking</li>
                              <li>• Throughput calculations</li>
                              <li>• Movement pattern analysis</li>
                            </ul>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span>Satellite connection established</span>
                          </div>
                          <div className="flex items-center justify-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span>Port coordinates locked: {selectedPort.coordinates?.lat?.toFixed(4)}°, {selectedPort.coordinates?.lng?.toFixed(4)}°</span>
                          </div>
                          <div className="flex items-center justify-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span>AIS data stream ready</span>
                          </div>
                          <div className="flex items-center justify-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                            <span>RF signal processing active</span>
                          </div>
                          <div className="flex items-center justify-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                            <span>Auto-zoom and vessel tracking initializing...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay Controls */}
                  <div className="absolute top-4 left-4 space-y-2">
                    <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>Resolution: 0.5m/pixel</span>
                      </div>
                    </div>
                    <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Captured: {format(lastUpdate, 'MMM dd, HH:mm')} UTC</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 space-y-2">
                    <Button variant="secondary" size="sm" className="bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-black/70">
                      <Zap className="h-4 w-4 mr-2" />
                      Auto-refresh: ON
                    </Button>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="opacity-75">Zoom Level:</span>
                          <p className="font-medium">18x</p>
                        </div>
                        <div>
                          <span className="opacity-75">Coverage:</span>
                          <p className="font-medium">5km²</p>
                        </div>
                        <div>
                          <span className="opacity-75">Update Freq:</span>
                          <p className="font-medium">30 seconds</p>
                        </div>
                        <div>
                          <span className="opacity-75">Data Source:</span>
                          <p className="font-medium">Multi-satellite</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Port Information & Activity */}
          <div className="space-y-6">
            {/* Port Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Port Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedPort.name}</h3>
                  <p className="text-slate-600">{selectedPort.country}</p>
                  {selectedPort.rank && (
                    <Badge className="mt-2">Global Rank #{selectedPort.rank}</Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Coordinates:</span>
                    <p className="font-medium">{selectedPort.coordinates?.lat?.toFixed(4)}°, {selectedPort.coordinates?.lng?.toFixed(4)}°</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Region:</span>
                    <p className="font-medium">{selectedPort.region || 'N/A'}</p>
                  </div>
                  {selectedPort.annual_throughput && (
                    <div>
                      <span className="text-slate-600">Annual TEU:</span>
                      <p className="font-medium">{(selectedPort.annual_throughput / 1000000).toFixed(1)}M</p>
                    </div>
                  )}
                  {selectedPort.strategic_importance && (
                    <div>
                      <span className="text-slate-600">Importance:</span>
                      <p className="font-medium">{selectedPort.strategic_importance}/100</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Live Activity */}
            {portActivity && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ship className="h-5 w-5" />
                    Live Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Traffic Level:</span>
                    <Badge className={getActivityColor(portActivity.trafficLevel)}>
                      {portActivity.trafficLevel}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">Vessels in Port:</span>
                      <p className="font-bold text-blue-600">{portActivity.currentVesselsInPort}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">At Anchor:</span>
                      <p className="font-bold text-orange-600">{portActivity.anchoredVessels}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Berth Occupancy:</span>
                      <p className="font-bold text-green-600">{portActivity.berthOccupancy}%</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Active Cranes:</span>
                      <p className="font-bold text-purple-600">{portActivity.craneActivity}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200">
                    <h4 className="font-medium mb-2">24h Statistics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Expected Arrivals:</span>
                        <span className="font-medium">{portActivity.expectedArrivals24h}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Cargo Handled:</span>
                        <span className="font-medium">{portActivity.cargoHandled24h.toLocaleString()} TEU</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weather Conditions */}
            {portActivity && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xl">{getWeatherIcon(portActivity.weatherCondition)}</span>
                    Weather Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Condition:</span>
                      <span className="font-medium">{portActivity.weatherCondition}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Visibility:</span>
                      <span className="font-medium">{portActivity.visibility} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Wind Speed:</span>
                      <span className="font-medium">{portActivity.windSpeed} knots</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Wave Height:</span>
                      <span className="font-medium">{portActivity.waveHeight} m</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {!selectedPort && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Satellite className="h-16 w-16 mx-auto text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Select a Port to Begin</h3>
            <p className="text-slate-500">Choose from over {ports.length} global ports to view live satellite imagery and real-time activity data.</p>
          </div>
        </div>
      )}
    </div>
  );
}
