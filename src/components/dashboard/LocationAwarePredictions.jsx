import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MapPin, Anchor, Fuel, TrendingUp, Clock, AlertCircle, Navigation } from 'lucide-react';
import streamingClient from '../../api/streamingClient';

const LocationAwarePredictions = () => {
  const [predictions, setPredictions] = useState({
    portCongestion: [],
    fuelIndex: [],
    routePerformance: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedTimeHorizon, setSelectedTimeHorizon] = useState(48);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Major regions for filtering
  const regions = [
    { value: 'all', label: 'All Regions' },
    { value: 'East Asia', label: 'East Asia' },
    { value: 'Southeast Asia', label: 'Southeast Asia' },
    { value: 'North Europe', label: 'North Europe' },
    { value: 'West Coast US', label: 'West Coast US' },
    { value: 'Middle East', label: 'Middle East' }
  ];

  // Load location-aware predictions
  const loadLocationAwarePredictions = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Generate comprehensive location-aware predictions
      const portCongestionPredictions = generatePortCongestionPredictions();
      const fuelIndexPredictions = generateFuelIndexPredictions();
      const routePerformancePredictions = generateRoutePerformancePredictions();
      
      setPredictions({
        portCongestion: portCongestionPredictions,
        fuelIndex: fuelIndexPredictions,
        routePerformance: routePerformancePredictions
      });
      
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Error loading location-aware predictions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTimeHorizon]);

  useEffect(() => {
    loadLocationAwarePredictions();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadLocationAwarePredictions, 300000);
    return () => clearInterval(interval);
  }, [loadLocationAwarePredictions]);

  // Generate port congestion predictions with locations
  const generatePortCongestionPredictions = () => {
    const majorPorts = [
      {
        port: "Shanghai",
        country: "China",
        region: "East Asia",
        location: { lat: 31.2304, lng: 121.4737 },
        congestionLevel: Math.random() * 0.4 + 0.4, // 40-80%
        waitingTime: Math.random() * 24 + 6, // 6-30 hours
        vesselQueue: Math.floor(Math.random() * 30 + 10),
        economicImpact: Math.floor(Math.random() * 50000000 + 10000000),
        peakTime: new Date(Date.now() + Math.random() * selectedTimeHorizon * 60 * 60 * 1000),
        factors: ["Seasonal demand increase", "Weather delays", "Labor negotiations"]
      },
      {
        port: "Singapore",
        country: "Singapore", 
        region: "Southeast Asia",
        location: { lat: 1.2644, lng: 103.8315 },
        congestionLevel: Math.random() * 0.3 + 0.3, // 30-60%
        waitingTime: Math.random() * 18 + 4, // 4-22 hours
        vesselQueue: Math.floor(Math.random() * 25 + 8),
        economicImpact: Math.floor(Math.random() * 40000000 + 8000000),
        peakTime: new Date(Date.now() + Math.random() * selectedTimeHorizon * 60 * 60 * 1000),
        factors: ["Transshipment volume surge", "Bunkering demand", "Port maintenance"]
      },
      {
        port: "Rotterdam",
        country: "Netherlands",
        region: "North Europe", 
        location: { lat: 51.9225, lng: 4.47917 },
        congestionLevel: Math.random() * 0.35 + 0.25, // 25-60%
        waitingTime: Math.random() * 16 + 3, // 3-19 hours
        vesselQueue: Math.floor(Math.random() * 20 + 6),
        economicImpact: Math.floor(Math.random() * 35000000 + 6000000),
        peakTime: new Date(Date.now() + Math.random() * selectedTimeHorizon * 60 * 60 * 1000),
        factors: ["Rhine River congestion", "Industrial demand", "Container backlog"]
      },
      {
        port: "Los Angeles/Long Beach",
        country: "United States",
        region: "West Coast US",
        location: { lat: 33.7361, lng: -118.2639 },
        congestionLevel: Math.random() * 0.5 + 0.4, // 40-90%
        waitingTime: Math.random() * 36 + 8, // 8-44 hours
        vesselQueue: Math.floor(Math.random() * 40 + 15),
        economicImpact: Math.floor(Math.random() * 80000000 + 20000000),
        peakTime: new Date(Date.now() + Math.random() * selectedTimeHorizon * 60 * 60 * 1000),
        factors: ["Holiday shopping surge", "Truck driver shortage", "Rail congestion"]
      },
      {
        port: "Dubai (Jebel Ali)",
        country: "UAE",
        region: "Middle East",
        location: { lat: 25.0657, lng: 55.1713 },
        congestionLevel: Math.random() * 0.3 + 0.2, // 20-50%
        waitingTime: Math.random() * 14 + 2, // 2-16 hours
        vesselQueue: Math.floor(Math.random() * 18 + 5),
        economicImpact: Math.floor(Math.random() * 30000000 + 5000000),
        peakTime: new Date(Date.now() + Math.random() * selectedTimeHorizon * 60 * 60 * 1000),
        factors: ["Regional transshipment", "Energy exports", "Ramadan schedule adjustments"]
      },
      {
        port: "Busan",
        country: "South Korea",
        region: "East Asia",
        location: { lat: 35.1040, lng: 129.0756 },
        congestionLevel: Math.random() * 0.4 + 0.3, // 30-70%
        waitingTime: Math.random() * 20 + 5, // 5-25 hours
        vesselQueue: Math.floor(Math.random() * 22 + 7),
        economicImpact: Math.floor(Math.random() * 25000000 + 4000000),
        peakTime: new Date(Date.now() + Math.random() * selectedTimeHorizon * 60 * 60 * 1000),
        factors: ["Semiconductor shipments", "Auto exports", "Winter weather prep"]
      }
    ];

    const allPredictions = majorPorts.map(port => ({
      ...port,
      predictionId: `PORT_${port.port.replace(/\s+/g, '_').toUpperCase()}_${Date.now()}`,
      confidence: Math.random() * 0.25 + 0.75, // 75-100% (some will be filtered)
      alternativePorts: majorPorts
        .filter(p => p.region === port.region && p.port !== port.port)
        .slice(0, 2)
        .map(p => ({ name: p.port, distanceKm: Math.floor(Math.random() * 500 + 100) })),
      timestamp: new Date()
    }));
    
    // Filter out predictions with confidence < 80%
    return allPredictions.filter(prediction => prediction.confidence >= 0.8);
  };

  // Generate fuel index predictions with locations
  const generateFuelIndexPredictions = () => {
    const fuelHubs = [
      {
        hub: "Singapore Bunkering Hub",
        country: "Singapore",
        region: "Southeast Asia",
        location: { lat: 1.2644, lng: 103.8315 },
        vlsfoPrice: 650 + Math.random() * 100 - 50, // $600-700/ton
        mgoPrice: 720 + Math.random() * 120 - 60, // $660-780/ton
        priceChange: (Math.random() - 0.5) * 10, // -5% to +5%
        volatilityIndex: Math.random() * 0.3 + 0.1, // 10-40%
        supplyLevel: Math.random() > 0.6 ? "adequate" : Math.random() > 0.3 ? "tight" : "surplus",
        demandPressure: Math.random() > 0.5 ? "high" : Math.random() > 0.25 ? "normal" : "low",
        queueTime: Math.random() * 4 + 1, // 1-5 hours
        marketInfluence: 0.92,
        drivers: ["Crude oil prices", "Regional demand", "Refinery capacity", "Weather disruptions"]
      },
      {
        hub: "Rotterdam Bunkering Hub",
        country: "Netherlands", 
        region: "North Europe",
        location: { lat: 51.9225, lng: 4.47917 },
        vlsfoPrice: 665 + Math.random() * 90 - 45,
        mgoPrice: 735 + Math.random() * 110 - 55,
        priceChange: (Math.random() - 0.5) * 8,
        volatilityIndex: Math.random() * 0.25 + 0.08,
        supplyLevel: Math.random() > 0.7 ? "adequate" : Math.random() > 0.4 ? "tight" : "surplus",
        demandPressure: Math.random() > 0.6 ? "high" : "normal",
        queueTime: Math.random() * 3 + 0.5,
        marketInfluence: 0.78,
        drivers: ["North Sea production", "EU regulations", "Seasonal demand", "Supply chain logistics"]
      },
      {
        hub: "Fujairah Bunkering Hub",
        country: "UAE",
        region: "Middle East",
        location: { lat: 25.1164, lng: 56.3404 },
        vlsfoPrice: 630 + Math.random() * 80 - 40,
        mgoPrice: 700 + Math.random() * 100 - 50,
        priceChange: (Math.random() - 0.5) * 12,
        volatilityIndex: Math.random() * 0.35 + 0.15,
        supplyLevel: Math.random() > 0.5 ? "adequate" : "tight",
        demandPressure: Math.random() > 0.4 ? "high" : "normal",
        queueTime: Math.random() * 5 + 1.5,
        marketInfluence: 0.62,
        drivers: ["Geopolitical tensions", "Regional refinery output", "Transit demand", "Currency fluctuations"]
      },
      {
        hub: "Hong Kong Bunkering",
        country: "Hong Kong",
        region: "East Asia",
        location: { lat: 22.3193, lng: 114.1694 },
        vlsfoPrice: 655 + Math.random() * 85 - 42,
        mgoPrice: 725 + Math.random() * 105 - 52,
        priceChange: (Math.random() - 0.5) * 9,
        volatilityIndex: Math.random() * 0.28 + 0.12,
        supplyLevel: Math.random() > 0.65 ? "adequate" : "tight",
        demandPressure: Math.random() > 0.55 ? "high" : "normal",
        queueTime: Math.random() * 3.5 + 1,
        marketInfluence: 0.45,
        drivers: ["China trade flows", "Singapore pricing", "Local demand", "Shipping activity"]
      }
    ];

    const allPredictions = fuelHubs.map(hub => ({
      ...hub,
      predictionId: `FUEL_${hub.hub.replace(/\s+/g, '_').toUpperCase()}_${Date.now()}`,
      confidence: Math.random() * 0.2 + 0.75, // 75-95% (some will be filtered)
      regionalDifferential: {
        "Southeast Asia": (Math.random() - 0.5) * 6,
        "North Europe": (Math.random() - 0.5) * 8,
        "East Asia": (Math.random() - 0.5) * 5,
        "Middle East": (Math.random() - 0.5) * 7
      },
      alternativeHubs: fuelHubs
        .filter(h => h.region !== hub.region)
        .slice(0, 2)
        .map(h => ({ 
          name: h.hub, 
          distanceKm: Math.floor(Math.random() * 2000 + 500),
          priceDiff: (Math.random() - 0.5) * 50
        })),
      timestamp: new Date()
    }));
    
    // Filter out predictions with confidence < 80%
    return allPredictions.filter(prediction => prediction.confidence >= 0.8);
  };

  // Generate route performance predictions with geographic segments
  const generateRoutePerformancePredictions = () => {
    const shippingRoutes = [
      {
        route: "Asia-Europe Main Line",
        segment: "Malacca Strait",
        country: "Malaysia/Singapore",
        region: "Southeast Asia",
        location: { lat: 4.0, lng: 100.0 },
        transitDelay: Math.random() * 12 + 2, // 2-14 hours
        fuelIncrease: Math.random() * 15 + 5, // 5-20%
        weatherImpact: Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "medium" : "low",
        congestionProb: Math.random() * 0.6 + 0.2, // 20-80%
        speedReduction: Math.random() * 10 + 5, // 5-15%
        costImpact: Math.floor(Math.random() * 500000 + 100000),
        factors: ["Monsoon weather", "Traffic density", "Piracy alerts", "Port congestion"]
      },
      {
        route: "Trans-Pacific Main Line", 
        segment: "North Pacific Ocean",
        country: "International Waters",
        region: "North Pacific",
        location: { lat: 45.0, lng: -150.0 },
        transitDelay: Math.random() * 18 + 6, // 6-24 hours
        fuelIncrease: Math.random() * 25 + 10, // 10-35%
        weatherImpact: Math.random() > 0.6 ? "high" : Math.random() > 0.3 ? "medium" : "low",
        congestionProb: Math.random() * 0.3 + 0.1, // 10-40%
        speedReduction: Math.random() * 15 + 8, // 8-23%
        costImpact: Math.floor(Math.random() * 800000 + 200000),
        factors: ["Pacific storms", "Ocean currents", "Seasonal winds", "Ice warnings"]
      },
      {
        route: "Asia-Europe Main Line",
        segment: "Suez Canal",
        country: "Egypt",
        region: "Middle East",
        location: { lat: 30.0131, lng: 32.5899 },
        transitDelay: Math.random() * 8 + 1, // 1-9 hours
        fuelIncrease: Math.random() * 10 + 2, // 2-12%
        weatherImpact: "low",
        congestionProb: Math.random() * 0.5 + 0.3, // 30-80%
        speedReduction: Math.random() * 8 + 3, // 3-11%
        costImpact: Math.floor(Math.random() * 300000 + 50000),
        factors: ["Canal traffic", "Transit scheduling", "Pilot availability", "Weather conditions"]
      },
      {
        route: "Trans-Atlantic Route",
        segment: "English Channel", 
        country: "UK/France",
        region: "North Europe",
        location: { lat: 50.0, lng: 1.0 },
        transitDelay: Math.random() * 6 + 1, // 1-7 hours
        fuelIncrease: Math.random() * 12 + 3, // 3-15%
        weatherImpact: Math.random() > 0.5 ? "medium" : "low",
        congestionProb: Math.random() * 0.7 + 0.2, // 20-90%
        speedReduction: Math.random() * 12 + 4, // 4-16%
        costImpact: Math.floor(Math.random() * 400000 + 80000),
        factors: ["Ferry traffic", "Fishing vessels", "Weather conditions", "Dover TSS"]
      }
    ];

    const allPredictions = shippingRoutes.map(route => ({
      ...route,
      predictionId: `ROUTE_${route.route.replace(/\s+/g, '_')}_${route.segment.replace(/\s+/g, '_')}_${Date.now()}`,
      confidence: Math.random() * 0.25 + 0.7, // 70-95% (some will be filtered)
      alternativeRoute: route.segment === "Suez Canal" ? "Cape of Good Hope" : 
                       route.segment === "Malacca Strait" ? "Sunda Strait" : "None available",
      seasonalFactor: Math.random() > 0.5 ? "peak_season" : "normal_season",
      timestamp: new Date()
    }));
    
    // Filter out predictions with confidence < 80%
    return allPredictions.filter(prediction => prediction.confidence >= 0.8);
  };

  // Filter predictions by region
  const filterByRegion = (predictions, region) => {
    if (region === 'all') return predictions;
    return predictions.filter(p => p.region === region);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getSeverityColor = (level) => {
    if (typeof level === 'number') {
      if (level > 0.7) return 'bg-red-100 text-red-800';
      if (level > 0.5) return 'bg-orange-100 text-orange-800';
      if (level > 0.3) return 'bg-yellow-100 text-yellow-800';
      return 'bg-green-100 text-green-800';
    }
    
    const colors = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800',
      'critical': 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Location-Aware Predictions</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Location-Aware Maritime Predictions</h2>
          <p className="text-gray-600">Geographic-specific forecasts for ports, fuel, and routes</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            {regions.map(region => (
              <option key={region.value} value={region.value}>
                {region.label}
              </option>
            ))}
          </select>
          <select
            value={selectedTimeHorizon}
            onChange={(e) => setSelectedTimeHorizon(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value={24}>24 hours</option>
            <option value={48}>48 hours</option>
            <option value={72}>72 hours</option>
            <option value={168}>1 week</option>
          </select>
          <Button onClick={loadLocationAwarePredictions} size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Port Congestion Predictions */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Anchor className="h-5 w-5 text-blue-600" />
          Port Congestion Predictions
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filterByRegion(predictions.portCongestion, selectedRegion).map((port) => (
            <Card key={port.predictionId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    {port.port}
                  </CardTitle>
                  <Badge className={getSeverityColor(port.congestionLevel)}>
                    {Math.round(port.congestionLevel * 100)}%
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{port.country} • {port.region}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Waiting Time:</span>
                    <p className="font-medium">{port.waitingTime.toFixed(1)}h</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Queue Length:</span>
                    <p className="font-medium">{port.vesselQueue} vessels</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Economic Impact:</span>
                    <p className="font-medium">{formatCurrency(port.economicImpact)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Peak Time:</span>
                    <p className="font-medium">{port.peakTime.toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600">Key Factors:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {port.factors.slice(0, 3).map((factor, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {port.alternativePorts.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600">Alternatives:</span>
                    <div className="text-sm mt-1">
                      {port.alternativePorts.map((alt, idx) => (
                        <div key={idx} className="text-xs text-gray-500">
                          {alt.name} ({alt.distanceKm}km)
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                  <span>Confidence: {Math.round(port.confidence * 100)}%</span>
                  <span>Updated: {port.timestamp.toLocaleTimeString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Fuel Index Predictions */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Fuel className="h-5 w-5 text-orange-600" />
          Fuel Index Predictions
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filterByRegion(predictions.fuelIndex, selectedRegion).map((fuel) => (
            <Card key={fuel.predictionId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-orange-600" />
                    {fuel.hub}
                  </CardTitle>
                  <Badge variant={fuel.priceChange >= 0 ? "destructive" : "default"}>
                    {formatPercentage(fuel.priceChange)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{fuel.country} • {fuel.region}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">VLSFO Price:</span>
                    <p className="font-medium">${fuel.vlsfoPrice.toFixed(0)}/ton</p>
                  </div>
                  <div>
                    <span className="text-gray-600">MGO Price:</span>
                    <p className="font-medium">${fuel.mgoPrice.toFixed(0)}/ton</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Supply Level:</span>
                    <p className="font-medium capitalize">{fuel.supplyLevel}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Queue Time:</span>
                    <p className="font-medium">{fuel.queueTime.toFixed(1)}h</p>
                  </div>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600">Volatility Index:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(fuel.volatilityIndex * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm">{Math.round(fuel.volatilityIndex * 100)}%</span>
                  </div>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600">Key Drivers:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {fuel.drivers.slice(0, 3).map((driver, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {driver}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                  <span>Market Influence: {Math.round(fuel.marketInfluence * 100)}%</span>
                  <span>Updated: {fuel.timestamp.toLocaleTimeString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Route Performance Predictions */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Navigation className="h-5 w-5 text-green-600" />
          Route Performance Predictions
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filterByRegion(predictions.routePerformance, selectedRegion).map((route) => (
            <Card key={route.predictionId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-green-600" />
                    {route.segment}
                  </CardTitle>
                  <Badge className={getSeverityColor(route.weatherImpact)}>
                    {route.weatherImpact} impact
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{route.route} • {route.region}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Transit Delay:</span>
                    <p className="font-medium">{route.transitDelay.toFixed(1)}h</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Fuel Increase:</span>
                    <p className="font-medium">{route.fuelIncrease.toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Speed Reduction:</span>
                    <p className="font-medium">{route.speedReduction.toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Cost Impact:</span>
                    <p className="font-medium">{formatCurrency(route.costImpact)}</p>
                  </div>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600">Congestion Probability:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${route.congestionProb * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm">{Math.round(route.congestionProb * 100)}%</span>
                  </div>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600">Contributing Factors:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {route.factors.slice(0, 4).map((factor, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {route.alternativeRoute && route.alternativeRoute !== "None available" && (
                  <div>
                    <span className="text-sm text-gray-600">Alternative Route:</span>
                    <p className="text-sm font-medium text-blue-600">{route.alternativeRoute}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                  <span>Confidence: {Math.round(route.confidence * 100)}%</span>
                  <span>Updated: {route.timestamp.toLocaleTimeString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      {lastUpdate && (
        <div className="flex items-center justify-between pt-4 border-t text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span>{predictions.portCongestion.length} port predictions</span>
            <span>{predictions.fuelIndex.length} fuel predictions</span>
            <span>{predictions.routePerformance.length} route predictions</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationAwarePredictions;
