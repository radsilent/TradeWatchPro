import React, { useState, useEffect } from "react";
import { Port, Disruption, Tariff } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Ship, AlertTriangle, DollarSign, Clock, Anchor, Navigation, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function ImpactAnalysis() {
  const [ports, setPorts] = useState([]);
  const [disruptions, setDisruptions] = useState([]);
  const [tariffs, setTariffs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1year');

  useEffect(() => {
    loadImpactData();
  }, []);

  const loadImpactData = async () => {
    setIsLoading(true);
    try {
      const [portsData, disruptionsData, tariffsData] = await Promise.all([
        Port.list('-strategic_importance', 200),
        Disruption.list('-created_date', 100),
        Tariff.list('-effectiveDate', 50)
      ]);
      
      setPorts(portsData);
      setDisruptions(disruptionsData);
      setTariffs(tariffsData);
      
      console.log('Impact Chain Analysis Data Loaded:', {
        ports: portsData.length,
        disruptions: disruptionsData.length,
        tariffs: tariffsData.length
      });
    } catch (error) {
      console.error("Error loading impact chain data:", error);
    }
    setIsLoading(false);
  };

  // Create impact chain analysis: Tariffs/Disruptions → Ports → Vessels
  const getImpactChainAnalysis = () => {
    const impactChains = [];
    
    // Process disruptions that affect ports, which then affect vessels
    disruptions.forEach((disruption) => {
      const affectedPorts = getPortsAffectedByDisruption(disruption);
      affectedPorts.forEach(port => {
        const vesselsAtPort = generateVesselsForPort(port, disruption, 'disruption');
        impactChains.push({
          id: `disruption-${disruption.id}-${port.id}`,
          type: 'disruption',
          source: disruption,
          affectedPort: port,
          impactedVessels: vesselsAtPort,
          impactSeverity: disruption.severity || 'medium',
          totalCosts: vesselsAtPort.reduce((sum, v) => sum + (v.additionalCosts || 0), 0),
          totalDelayHours: vesselsAtPort.reduce((sum, v) => sum + (v.delayHours || 0), 0)
        });
      });
    });

    // Process tariffs that affect ports, which then affect vessels
    tariffs.forEach((tariff) => {
      const affectedPorts = getPortsAffectedByTariff(tariff);
      affectedPorts.forEach(port => {
        const vesselsAtPort = generateVesselsForPort(port, tariff, 'tariff');
        impactChains.push({
          id: `tariff-${tariff.id}-${port.id || port.name}`,
          type: 'tariff',
          source: tariff,
          affectedPort: port,
          impactedVessels: vesselsAtPort,
          impactSeverity: getTariffSeverity(tariff.currentRate || tariff.rate),
          totalCosts: vesselsAtPort.reduce((sum, v) => sum + (v.tariffCost || 0), 0),
          totalTariffRate: tariff.currentRate || parseFloat(tariff.rate) || 0
        });
      });
    });

    return impactChains.slice(0, 100); // Limit for performance
  };

  // Find ports affected by a disruption
  const getPortsAffectedByDisruption = (disruption) => {
    const affectedPorts = [];
    
    // Check if disruption affects specific regions/countries
    const affectedRegions = disruption.affected_regions || disruption.affectedRegions || [];
    const affectedCountries = disruption.affected_countries || disruption.affectedCountries || [];
    
    // If disruption mentions specific locations, match to ports
    const disruptionText = `${disruption.title || ''} ${disruption.description || ''} ${disruption.location || ''}`.toLowerCase();
    
    ports.forEach(port => {
      let isAffected = false;
      
      // Check by region
      if (affectedRegions.some(region => 
        port.region?.toLowerCase().includes(region.toLowerCase()) ||
        port.country?.toLowerCase().includes(region.toLowerCase())
      )) {
        isAffected = true;
      }
      
      // Check by country
      if (affectedCountries.some(country => 
        port.country?.toLowerCase().includes(country.toLowerCase())
      )) {
        isAffected = true;
      }
      
      // Check by port name or location mentioned in disruption
      if (disruptionText.includes(port.name?.toLowerCase()) ||
          disruptionText.includes(port.country?.toLowerCase()) ||
          disruptionText.includes(port.region?.toLowerCase())) {
        isAffected = true;
      }
      
      // Global/maritime disruptions affect major ports
      if (disruption.category === 'maritime' || disruption.category === 'global' ||
          disruptionText.includes('canal') || disruptionText.includes('strait') ||
          disruptionText.includes('shipping') || disruptionText.includes('port')) {
        if (port.strategic_importance && port.strategic_importance > 70) {
          isAffected = true;
        }
      }
      
      if (isAffected) {
        affectedPorts.push(port);
      }
    });
    
    // If no specific ports found, return top strategic ports
    if (affectedPorts.length === 0) {
      return ports.filter(p => p.strategic_importance && p.strategic_importance > 80).slice(0, 5);
    }
    
    return affectedPorts.slice(0, 10); // Limit to 10 ports per disruption
  };

  // Find ports affected by a tariff
  const getPortsAffectedByTariff = (tariff) => {
    const affectedPorts = [];
    const tariffCountries = tariff.countries || [];
    
    if (tariffCountries.length === 0) {
      // If no specific countries, return major trading ports
      return ports.filter(p => p.strategic_importance && p.strategic_importance > 85).slice(0, 3);
    }
    
    ports.forEach(port => {
      // Check if port's country is affected by tariff
      if (tariffCountries.some(country => 
        port.country?.toLowerCase().includes(country.toLowerCase()) ||
        country.toLowerCase().includes(port.country?.toLowerCase())
      )) {
        affectedPorts.push(port);
      }
    });
    
    return affectedPorts.slice(0, 8); // Limit to 8 ports per tariff
  };

  // Generate vessels that use a specific port
  const generateVesselsForPort = (port, source, impactType) => {
    const vessels = [];
    const vesselTypes = ['Container Ship', 'Bulk Carrier', 'Tanker', 'Car Carrier', 'General Cargo'];
    const flagStates = ['Panama', 'Liberia', 'Marshall Islands', 'Hong Kong', 'Singapore', 'Malta', 'Bahamas'];
    const operators = ['Maersk', 'MSC', 'CMA CGM', 'COSCO', 'Hapag-Lloyd', 'ONE', 'Evergreen', 'Yang Ming'];
    
    // Number of vessels based on port importance
    const portImportance = port.strategic_importance || 50;
    const numVessels = Math.min(12, Math.floor((portImportance / 10) + Math.random() * 5) + 2);
    
    for (let i = 0; i < numVessels; i++) {
      const vesselType = vesselTypes[Math.floor(Math.random() * vesselTypes.length)];
      const flagState = flagStates[Math.floor(Math.random() * flagStates.length)];
      const operator = operators[Math.floor(Math.random() * operators.length)];
      
      const vessel = {
        id: `vessel-${port.id || port.name}-${i}`,
        name: generateVesselName(vesselType),
        imo: `IMO${Math.floor(Math.random() * 9000000) + 1000000}`,
        type: vesselType,
        flagState: flagState,
        operator: operator,
        dwt: generateDWT(vesselType),
        length: generateLength(vesselType),
        beam: generateBeam(vesselType),
        yearBuilt: Math.floor(Math.random() * 15) + 2009,
        impactType: impactType,
        impactSource: source.title || source.name,
        impactSeverity: impactType === 'disruption' ? (source.severity || 'medium') : getTariffSeverity(source.currentRate || source.rate),
        affectedPort: port,
        portName: port.name,
        portCountry: port.country,
        portCoordinates: port.coordinates,
        currentPosition: generatePositionNearPort(port),
        destination: generateDestination(),
        eta: new Date(Date.now() + (Math.random() * 30 * 24 * 60 * 60 * 1000)),
        status: generateVesselStatus(),
        fuelConsumption: Math.floor(Math.random() * 100) + 20,
        crewSize: Math.floor(Math.random() * 20) + 15,
        lastUpdate: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
      };
      
      // Add impact-specific data
      if (impactType === 'disruption') {
        vessel.delayHours = Math.floor(Math.random() * 168) + 12; // 12-180 hours
        vessel.additionalCosts = Math.floor(Math.random() * 500000) + 50000; // $50k-$550k
        vessel.cargoValue = Math.floor(Math.random() * 50000000) + 5000000; // $5M-$55M
      } else if (impactType === 'tariff') {
        vessel.tariffRate = `${source.currentRate || parseFloat(source.rate) || 0}%`;
        vessel.tariffCost = Math.floor(Math.random() * 2000000) + 100000; // $100k-$2.1M
        vessel.cargoValue = Math.floor(Math.random() * 80000000) + 10000000; // $10M-$90M
      }
      
      vessels.push(vessel);
    }
    
    return vessels;
  };

  // Generate position near a specific port
  const generatePositionNearPort = (port) => {
    if (!port.coordinates) {
      return { lat: 0, lng: 0, area: 'Unknown' };
    }
    
    // Generate position within 50km of port
    const latOffset = (Math.random() - 0.5) * 0.5; // ~50km
    const lngOffset = (Math.random() - 0.5) * 0.5;
    
    return {
      lat: port.coordinates.lat + latOffset,
      lng: port.coordinates.lng + lngOffset,
      area: `Near ${port.name}`
    };
  };

  const generateVesselsFromDisruption = (disruption, startId) => {
    const vessels = [];
    const vesselTypes = ['Container Ship', 'Bulk Carrier', 'Tanker', 'Car Carrier', 'General Cargo'];
    const flagStates = ['Panama', 'Liberia', 'Marshall Islands', 'Hong Kong', 'Singapore', 'Malta', 'Bahamas'];
    const operators = ['Maersk', 'MSC', 'CMA CGM', 'COSCO', 'Hapag-Lloyd', 'ONE', 'Evergreen', 'Yang Ming'];
    
    const numVessels = Math.min(8, Math.floor(Math.random() * 12) + 3);
    
    for (let i = 0; i < numVessels; i++) {
      const vesselType = vesselTypes[Math.floor(Math.random() * vesselTypes.length)];
      const flagState = flagStates[Math.floor(Math.random() * flagStates.length)];
      const operator = operators[Math.floor(Math.random() * operators.length)];
      
      vessels.push({
        id: `vessel-${startId + i}`,
        name: generateVesselName(vesselType),
        imo: `IMO${Math.floor(Math.random() * 9000000) + 1000000}`,
        type: vesselType,
        flagState: flagState,
        operator: operator,
        dwt: generateDWT(vesselType),
        length: generateLength(vesselType),
        beam: generateBeam(vesselType),
        yearBuilt: Math.floor(Math.random() * 15) + 2009,
        impactType: 'disruption',
        impactSource: disruption.title || disruption.name,
        impactSeverity: disruption.severity || 'medium',
        impactCategory: disruption.category || 'operational',
        affectedRoutes: generateAffectedRoutes(disruption),
        delayHours: Math.floor(Math.random() * 168) + 12, // 12-180 hours
        additionalCosts: Math.floor(Math.random() * 500000) + 50000, // $50k-$550k
        cargoValue: Math.floor(Math.random() * 50000000) + 5000000, // $5M-$55M
        currentPosition: generatePosition(),
        destination: generateDestination(),
        eta: new Date(Date.now() + (Math.random() * 30 * 24 * 60 * 60 * 1000)),
        status: generateVesselStatus(),
        fuelConsumption: Math.floor(Math.random() * 100) + 20, // tons/day
        crewSize: Math.floor(Math.random() * 20) + 15,
        lastUpdate: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
      });
    }
    
    return vessels;
  };

  const generateVesselsFromTariff = (tariff, startId) => {
    const vessels = [];
    const vesselTypes = ['Container Ship', 'Bulk Carrier', 'Tanker', 'Car Carrier', 'General Cargo'];
    const flagStates = ['Panama', 'Liberia', 'Marshall Islands', 'Hong Kong', 'Singapore'];
    const operators = ['Maersk', 'MSC', 'CMA CGM', 'COSCO', 'Hapag-Lloyd'];
    
    const numVessels = Math.min(6, Math.floor(Math.random() * 10) + 2);
    
    for (let i = 0; i < numVessels; i++) {
      const vesselType = vesselTypes[Math.floor(Math.random() * vesselTypes.length)];
      const flagState = flagStates[Math.floor(Math.random() * flagStates.length)];
      const operator = operators[Math.floor(Math.random() * operators.length)];
      
      vessels.push({
        id: `vessel-${startId + i}`,
        name: generateVesselName(vesselType),
        imo: `IMO${Math.floor(Math.random() * 9000000) + 1000000}`,
        type: vesselType,
        flagState: flagState,
        operator: operator,
        dwt: generateDWT(vesselType),
        length: generateLength(vesselType),
        beam: generateBeam(vesselType),
        yearBuilt: Math.floor(Math.random() * 15) + 2009,
        impactType: 'tariff',
        impactSource: tariff.name || tariff.title,
        impactSeverity: getTariffSeverity(tariff.currentRate || tariff.rate),
        impactCategory: 'economic',
        affectedRoutes: generateTariffRoutes(tariff),
        tariffRate: `${tariff.currentRate || parseFloat(tariff.rate) || 0}%`,
        tariffCost: Math.floor(Math.random() * 2000000) + 100000, // $100k-$2.1M
        cargoValue: Math.floor(Math.random() * 80000000) + 10000000, // $10M-$90M
        currentPosition: generatePosition(),
        destination: generateDestination(),
        eta: new Date(Date.now() + (Math.random() * 45 * 24 * 60 * 60 * 1000)),
        status: generateVesselStatus(),
        fuelConsumption: Math.floor(Math.random() * 100) + 20,
        crewSize: Math.floor(Math.random() * 20) + 15,
        lastUpdate: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
      });
    }
    
    return vessels;
  };

  // Helper functions for vessel generation
  const generateVesselName = (type) => {
    const prefixes = ['MSC', 'MAERSK', 'CMA CGM', 'COSCO', 'HAPAG', 'ONE', 'EVER', 'YANG MING'];
    const suffixes = ['EXPRESS', 'GALAXY', 'FORTUNE', 'VICTORY', 'PIONEER', 'NAVIGATOR', 'EXPLORER', 'CHAMPION'];
    const cities = ['SHANGHAI', 'HAMBURG', 'ROTTERDAM', 'SINGAPORE', 'TOKYO', 'BUSAN', 'VALENCIA', 'BREMEN'];
    
    if (Math.random() > 0.5) {
      return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
    } else {
      return cities[Math.floor(Math.random() * cities.length)];
    }
  };

  const generateDWT = (type) => {
    switch (type) {
      case 'Container Ship': return Math.floor(Math.random() * 180000) + 20000;
      case 'Bulk Carrier': return Math.floor(Math.random() * 300000) + 50000;
      case 'Tanker': return Math.floor(Math.random() * 250000) + 30000;
      case 'Car Carrier': return Math.floor(Math.random() * 60000) + 10000;
      default: return Math.floor(Math.random() * 80000) + 15000;
    }
  };

  const generateLength = (type) => {
    switch (type) {
      case 'Container Ship': return Math.floor(Math.random() * 200) + 200;
      case 'Bulk Carrier': return Math.floor(Math.random() * 150) + 180;
      case 'Tanker': return Math.floor(Math.random() * 180) + 150;
      case 'Car Carrier': return Math.floor(Math.random() * 50) + 150;
      default: return Math.floor(Math.random() * 100) + 120;
    }
  };

  const generateBeam = (length) => {
    return Math.floor(length * 0.15) + Math.floor(Math.random() * 10);
  };

  const generateAffectedRoutes = (disruption) => {
    const routes = [
      'Asia-Europe', 'Trans-Pacific', 'Asia-North America', 'Europe-North America',
      'Intra-Asia', 'Middle East-Asia', 'South America-Asia', 'Africa-Europe',
      'Red Sea Route', 'Suez Canal Route', 'Panama Canal Route', 'Cape Route'
    ];
    
    const numRoutes = Math.floor(Math.random() * 3) + 1;
    const selectedRoutes = [];
    
    for (let i = 0; i < numRoutes; i++) {
      const route = routes[Math.floor(Math.random() * routes.length)];
      if (!selectedRoutes.includes(route)) {
        selectedRoutes.push(route);
      }
    }
    
    return selectedRoutes;
  };

  const generateTariffRoutes = (tariff) => {
    const countries = tariff.countries || [];
    if (countries.length === 0) return ['Global Trade'];
    
    return countries.map(country => `Routes to/from ${country}`);
  };

  const generatePosition = () => {
    const positions = [
      { lat: 1.29, lng: 103.85, area: 'Singapore Strait' },
      { lat: 30.04, lng: 32.34, area: 'Suez Canal' },
      { lat: 9.08, lng: -79.68, area: 'Panama Canal' },
      { lat: 51.92, lng: 4.48, area: 'North Sea' },
      { lat: 36.10, lng: -5.35, area: 'Strait of Gibraltar' },
      { lat: 26.55, lng: 56.25, area: 'Strait of Hormuz' },
      { lat: -34.36, lng: 18.42, area: 'Cape of Good Hope' }
    ];
    
    return positions[Math.floor(Math.random() * positions.length)];
  };

  const generateDestination = () => {
    const ports = [
      'Port of Shanghai', 'Port of Singapore', 'Port of Rotterdam', 'Port of Hamburg',
      'Port of Los Angeles', 'Port of Long Beach', 'Port of Antwerp', 'Port of Busan',
      'Port of Hong Kong', 'Port of Shenzhen', 'Port of Valencia', 'Port of Bremen'
    ];
    
    return ports[Math.floor(Math.random() * ports.length)];
  };

  const generateVesselStatus = () => {
    const statuses = ['En Route', 'At Anchor', 'In Port', 'Delayed', 'Diverted', 'Under Repair'];
    const weights = [0.4, 0.15, 0.2, 0.15, 0.08, 0.02];
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < statuses.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return statuses[i];
      }
    }
    
    return 'En Route';
  };

  const getTariffSeverity = (rate) => {
    const numRate = parseFloat(rate) || 0;
    if (numRate > 30) return 'critical';
    if (numRate > 15) return 'high';
    if (numRate > 5) return 'medium';
    return 'low';
  };

  // Get impact chain statistics
  const getImpactChainStatistics = () => {
    const impactChains = getImpactChainAnalysis();
    const allVessels = impactChains.flatMap(chain => chain.impactedVessels);
    
    const stats = {
      totalImpactChains: impactChains.length,
      totalAffectedPorts: [...new Set(impactChains.map(chain => chain.affectedPort.id || chain.affectedPort.name))].length,
      totalVessels: allVessels.length,
      disruptionChains: impactChains.filter(c => c.type === 'disruption').length,
      tariffChains: impactChains.filter(c => c.type === 'tariff').length,
      criticalImpacts: impactChains.filter(c => c.impactSeverity === 'critical').length,
      highImpacts: impactChains.filter(c => c.impactSeverity === 'high').length,
      mediumImpacts: impactChains.filter(c => c.impactSeverity === 'medium').length,
      lowImpacts: impactChains.filter(c => c.impactSeverity === 'low').length,
      totalDelayCosts: impactChains.reduce((sum, c) => sum + (c.totalCosts || 0), 0),
      totalTariffCosts: impactChains.filter(c => c.type === 'tariff').reduce((sum, c) => sum + (c.totalCosts || 0), 0),
      averageVesselsPerPort: allVessels.length / stats.totalAffectedPorts || 0,
      averageDelayHours: impactChains.reduce((sum, c) => sum + (c.totalDelayHours || 0), 0) / impactChains.filter(c => c.totalDelayHours).length || 0
    };
    
    return stats;
  };

  // Get vessel type breakdown
  const getVesselTypeBreakdown = () => {
    const vessels = getVesselImpacts();
    const typeCount = {};
    
    vessels.forEach(vessel => {
      typeCount[vessel.type] = (typeCount[vessel.type] || 0) + 1;
    });
    
    return Object.entries(typeCount).map(([type, count]) => ({
      name: type,
      value: count,
      percentage: ((count / vessels.length) * 100).toFixed(1)
    }));
  };

  // Get impact severity breakdown
  const getImpactSeverityBreakdown = () => {
    const vessels = getVesselImpacts();
    const severityCount = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    vessels.forEach(vessel => {
      severityCount[vessel.impactSeverity]++;
    });
    
    return Object.entries(severityCount).map(([severity, count]) => ({
      name: severity.charAt(0).toUpperCase() + severity.slice(1),
      value: count,
      percentage: ((count / vessels.length) * 100).toFixed(1)
    }));
  };

  // Get route impact analysis
  const getRouteImpactAnalysis = () => {
    const vessels = getVesselImpacts();
    const routeImpacts = {};
    
    vessels.forEach(vessel => {
      vessel.affectedRoutes?.forEach(route => {
        if (!routeImpacts[route]) {
          routeImpacts[route] = {
            route,
            vessels: 0,
            totalCosts: 0,
            averageDelay: 0,
            cargoValue: 0,
            delays: []
          };
        }
        routeImpacts[route].vessels++;
        routeImpacts[route].totalCosts += (vessel.additionalCosts || 0) + (vessel.tariffCost || 0);
        routeImpacts[route].cargoValue += vessel.cargoValue || 0;
        if (vessel.delayHours) {
          routeImpacts[route].delays.push(vessel.delayHours);
        }
      });
    });
    
    return Object.values(routeImpacts).map(route => ({
      ...route,
      averageDelay: route.delays.length > 0 ? 
        route.delays.reduce((a, b) => a + b, 0) / route.delays.length : 0,
      avgCostPerVessel: route.totalCosts / route.vessels
    })).sort((a, b) => b.totalCosts - a.totalCosts);
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delayed': return 'bg-red-100 text-red-800';
      case 'diverted': return 'bg-orange-100 text-orange-800';
      case 'under repair': return 'bg-red-100 text-red-800';
      case 'at anchor': return 'bg-yellow-100 text-yellow-800';
      case 'in port': return 'bg-blue-100 text-blue-800';
      case 'en route': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const CHART_COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading vessel impact analysis...</p>
        </div>
      </div>
    );
  }

  const impactChains = getImpactChainAnalysis();
  const stats = getImpactChainStatistics();
  const allVessels = impactChains.flatMap(chain => chain.impactedVessels);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Impact Chain Analysis</h1>
          <p className="text-slate-600 mt-2">
            How tariffs and disruptions affect ports, which then impact vessels using those ports
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedTimeframe === '6months' ? 'default' : 'outline'}
            onClick={() => setSelectedTimeframe('6months')}
            size="sm"
          >
            6 Months
          </Button>
          <Button
            variant={selectedTimeframe === '1year' ? 'default' : 'outline'}
            onClick={() => setSelectedTimeframe('1year')}
            size="sm"
          >
            1 Year
          </Button>
          <Button
            variant={selectedTimeframe === '2years' ? 'default' : 'outline'}
            onClick={() => setSelectedTimeframe('2years')}
            size="sm"
          >
            2 Years
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Impact Chains</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalImpactChains.toLocaleString()}</p>
              </div>
              <Navigation className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-4 flex text-sm text-slate-600">
              <span className="text-red-600">{stats.disruptionChains}</span>&nbsp;disruption,&nbsp;
              <span className="text-orange-600">{stats.tariffChains}</span>&nbsp;tariff
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Affected Ports</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalAffectedPorts}</p>
              </div>
              <MapPin className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-4 text-sm text-slate-600">
              Avg {stats.averageVesselsPerPort.toFixed(1)} vessels per port
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Impacted Vessels</p>
                <p className="text-2xl font-bold text-red-600">{stats.totalVessels}</p>
              </div>
              <Ship className="h-8 w-8 text-red-600" />
            </div>
            <div className="mt-4 text-sm text-slate-600">
              Critical: {stats.criticalImpacts} | High: {stats.highImpacts}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Impact Costs</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalDelayCosts + stats.totalTariffCosts)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-4 text-sm text-slate-600">
              Avg delay: {stats.averageDelayHours.toFixed(0)}h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ship className="h-5 w-5" />
              Vessel Type Impact Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Impact Severity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={severityBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Route Impact Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Most Impacted Trade Routes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {routeAnalysis.slice(0, 10).map((route, index) => (
              <div key={route.route} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-slate-700">#{index + 1}</span>
                    <div>
                      <h3 className="font-medium text-slate-900">{route.route}</h3>
                      <p className="text-sm text-slate-600">
                        {route.vessels} vessels affected • Avg delay: {route.averageDelay.toFixed(0)}h
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{formatCurrency(route.totalCosts)}</p>
                  <p className="text-sm text-slate-600">Total impact costs</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Impact Chain Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Impact Chain Analysis
          </CardTitle>
          <p className="text-sm text-slate-600 mt-1">
            Showing how tariffs and disruptions flow through ports to affect vessels
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {impactChains.slice(0, 20).map((chain) => (
              <div key={chain.id} className="border border-slate-200 rounded-lg p-4">
                {/* Impact Source */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={chain.type === 'disruption' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}>
                        {chain.type.toUpperCase()}
                      </Badge>
                      <Badge className={getSeverityColor(chain.impactSeverity)}>
                        {chain.impactSeverity}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">
                      {chain.source.title || chain.source.name}
                    </h3>
                    {chain.type === 'tariff' && chain.totalTariffRate && (
                      <p className="text-sm text-orange-600 font-medium">
                        Tariff Rate: {chain.totalTariffRate}%
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{formatCurrency(chain.totalCosts)}</p>
                    <p className="text-xs text-slate-600">Total impact cost</p>
                  </div>
                </div>

                {/* Arrow indicating flow */}
                <div className="flex items-center justify-center my-3">
                  <div className="flex items-center text-slate-400">
                    <span className="text-sm">affects</span>
                    <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {/* Affected Port */}
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-slate-900">{chain.affectedPort.name}</h4>
                    <span className="text-sm text-slate-600">
                      {chain.affectedPort.country}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {chain.affectedPort.strategic_importance && (
                      <div>
                        <span className="text-slate-600">Strategic Importance:</span>
                        <span className="ml-1 font-medium">{chain.affectedPort.strategic_importance}</span>
                      </div>
                    )}
                    {chain.affectedPort.annual_throughput && (
                      <div>
                        <span className="text-slate-600">Annual TEU:</span>
                        <span className="ml-1 font-medium">{(chain.affectedPort.annual_throughput / 1000000).toFixed(1)}M</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow indicating flow */}
                <div className="flex items-center justify-center my-3">
                  <div className="flex items-center text-slate-400">
                    <span className="text-sm">impacts</span>
                    <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {/* Impacted Vessels */}
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Ship className="h-4 w-4 text-slate-600" />
                    <h4 className="font-medium text-slate-900">
                      {chain.impactedVessels.length} Vessels Affected
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {chain.impactedVessels.slice(0, 4).map((vessel, index) => (
                      <div key={vessel.id} className="bg-white rounded p-2 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-slate-900">{vessel.name}</span>
                          <Badge className={getStatusColor(vessel.status)} size="sm">
                            {vessel.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-600">
                          <span>{vessel.type}</span> • <span>{vessel.flagState}</span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          {vessel.impactType === 'disruption' && vessel.delayHours && (
                            <span className="text-red-600">Delay: {vessel.delayHours}h</span>
                          )}
                          {vessel.impactType === 'tariff' && vessel.tariffRate && (
                            <span className="text-orange-600">Tariff: {vessel.tariffRate}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {chain.impactedVessels.length > 4 && (
                    <div className="mt-2 text-xs text-slate-500 text-center">
                      +{chain.impactedVessels.length - 4} more vessels affected
                    </div>
                  )}

                  {/* Summary stats for this chain */}
                  <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-600">Total Cost:</span>
                      <p className="font-medium text-red-600">{formatCurrency(chain.totalCosts)}</p>
                    </div>
                    {chain.totalDelayHours && (
                      <div>
                        <span className="text-slate-600">Total Delays:</span>
                        <p className="font-medium text-orange-600">{chain.totalDelayHours}h</p>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-600">Vessels:</span>
                      <p className="font-medium text-slate-900">{chain.impactedVessels.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
