import React, { useState, useEffect } from "react";
import { Port, Disruption, Tariff } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, Legend, ScatterChart, Scatter } from "recharts";
import { TrendingUp, Globe, AlertTriangle, DollarSign, MapPin, Ship, Factory, Zap, Users, Calendar } from "lucide-react";
import { format, addMonths, addYears, parseISO, isValid } from "date-fns";

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
      
      console.log('Impact Analysis Data Loaded:', {
        ports: portsData.length,
        disruptions: disruptionsData.length,
        tariffs: tariffsData.length
      });
    } catch (error) {
      console.error("Error loading impact data:", error);
    }
    setIsLoading(false);
  };

  // Regional Impact Analysis
  const getRegionalAnalysis = () => {
    const regions = {};
    
    // Port impacts by region
    ports.forEach(port => {
      const region = port.region || getRegionFromCountry(port.country);
      if (!regions[region]) {
        regions[region] = {
          name: region,
          ports: 0,
          throughput: 0,
          disruptions: 0,
          tariffImpact: 0,
          economicValue: 0,
          riskScore: 0
        };
      }
      regions[region].ports++;
      regions[region].throughput += port.annual_throughput || 0;
      // Track throughput without fake economic values
    });

    // Disruption impacts
    disruptions.forEach(disruption => {
      const affectedRegions = disruption.affected_regions || disruption.affectedRegions || ['Global'];
      affectedRegions.forEach(regionName => {
        const region = findRegionMatch(regionName, Object.keys(regions));
        if (region && regions[region]) {
          regions[region].disruptions++;
          regions[region].riskScore += getSeverityScore(disruption.severity);
        }
      });
    });

    // Tariff impacts
    tariffs.forEach(tariff => {
      tariff.countries?.forEach(country => {
        const region = getRegionFromCountry(country);
        if (regions[region]) {
          regions[region].tariffImpact += parseFloat(tariff.affectedTrade) || 0;
        }
      });
    });

    return Object.values(regions).map(region => ({
      ...region,
      riskScore: Math.min(100, region.riskScore),
      throughputFormatted: `${(region.throughput / 1000000).toFixed(1)}M TEU`,
      economicValueFormatted: `$${(region.economicValue / 1000000000).toFixed(1)}B`
    })).sort((a, b) => b.economicValue - a.economicValue);
  };

  // Supply Chain Vulnerability Analysis
  const getSupplyChainVulnerability = () => {
    const vulnerabilities = [];
    
    // Critical chokepoints
    const chokepoints = [
      { name: 'Suez Canal', risk: 95, impact: 'Critical', dailyTraffic: '50+ vessels', significance: 'Global trade artery' },
      { name: 'Strait of Hormuz', risk: 90, impact: 'Critical', dailyTraffic: '40+ vessels', significance: 'Energy corridor' },
      { name: 'Panama Canal', risk: 75, impact: 'High', dailyTraffic: '35+ vessels', significance: 'Americas connector' },
      { name: 'Strait of Malacca', risk: 70, impact: 'High', dailyTraffic: '60+ vessels', significance: 'Asia-Pacific hub' },
      { name: 'English Channel', risk: 45, impact: 'Medium', dailyTraffic: '25+ vessels', significance: 'Europe gateway' },
      { name: 'Bosporus Strait', risk: 55, impact: 'Medium', dailyTraffic: '20+ vessels', significance: 'Black Sea access' }
    ];

    return chokepoints;
  };

  // Trade Flow Analysis
  const getTradeFlowAnalysis = () => {
    const flows = [
      { route: 'Asia-Europe', volume: 24.5, value: 1240, growth: 2.3, risk: 'High' },
      { route: 'Trans-Pacific', volume: 18.7, value: 980, growth: 1.8, risk: 'Medium' },
      { route: 'Asia-Middle East', volume: 12.3, value: 620, growth: 3.1, risk: 'High' },
      { route: 'Europe-Americas', volume: 9.8, value: 540, growth: 1.2, risk: 'Low' },
      { route: 'Intra-Asia', volume: 15.2, value: 450, growth: 4.2, risk: 'Medium' },
      { route: 'Africa-Global', volume: 6.7, value: 280, growth: 5.1, risk: 'High' }
    ];

    return flows;
  };

  // Enhanced Economic Impact Projections with Detailed Analysis
  const getEconomicProjections = () => {
    const baseYear = new Date().getFullYear();
    const projections = [];

    for (let year = baseYear; year <= 2035; year++) {
      const yearsSince = year - baseYear;
      
      // More sophisticated modeling factors
      const geopoliticalRisk = year <= 2026 ? 1.05 : year <= 2030 ? 1.02 : 0.98;
      const climateImpact = Math.pow(1.015, yearsSince); // 1.5% annual climate impact growth
      const technologyGains = Math.pow(1.04, yearsSince); // 4% annual technology efficiency gains
      const tradeWarImpact = year <= 2027 ? 0.97 : 0.99; // Trade war dampening effect
      const supplyChainResilience = Math.pow(1.02, yearsSince); // 2% annual resilience improvement
      
      const baselineGrowth = 12500 * Math.pow(1.028, yearsSince); // 2.8% baseline growth
      
      projections.push({
        year,
        baseline: baselineGrowth,
        withDisruptions: baselineGrowth * geopoliticalRisk * climateImpact * 0.96, // -4% disruption impact
        withTariffs: baselineGrowth * tradeWarImpact * 0.94, // -6% tariff impact
        withClimateChange: baselineGrowth * climateImpact * 0.92, // -8% climate impact
        withTechnology: baselineGrowth * technologyGains * 1.08, // +8% technology gains
        optimistic: baselineGrowth * technologyGains * supplyChainResilience * 1.12, // +12% optimistic
        pessimistic: baselineGrowth * geopoliticalRisk * tradeWarImpact * climateImpact * 0.85, // -15% pessimistic
        // Additional scenario metrics
        automationImpact: baselineGrowth * Math.pow(1.06, yearsSince) * 1.15, // +15% automation benefits
        deglobalizationScenario: baselineGrowth * Math.pow(0.98, yearsSince) * 0.88, // -12% deglobalization
        greenTransition: baselineGrowth * Math.pow(1.035, yearsSince) * 1.05 // +5% green transition benefits
      });
    }

    return projections;
  };

  // Enhanced Sector Impact Analysis with Detailed Metrics
  const getSectorImpacts = () => {
    return [
      { 
        sector: 'Technology & Electronics', 
        impact: 85, 
        value: 2400, 
        affected: 'Critical', 
        trend: 'Increasing',
        riskFactors: ['Semiconductor shortages', 'Geopolitical tensions', 'Rare earth dependencies'],
        keyMetrics: {
          supplyChainComplexity: 94,
          regionConcentration: 88,
          substitutability: 32,
          timeToRecovery: '18-24 months'
        },
        majorRoutes: ['Asia-Pacific to North America', 'China to Europe'],
        vulnerabilities: 'High dependency on East Asian manufacturing hubs'
      },
      { 
        sector: 'Automotive', 
        impact: 78, 
        value: 1800, 
        affected: 'High', 
        trend: 'Stabilizing',
        riskFactors: ['Just-in-time vulnerabilities', 'EV transition disruptions', 'Chip shortages'],
        keyMetrics: {
          supplyChainComplexity: 89,
          regionConcentration: 72,
          substitutability: 45,
          timeToRecovery: '12-18 months'
        },
        majorRoutes: ['Germany to Global', 'Japan to Americas', 'China to Europe'],
        vulnerabilities: 'Complex multi-tier supply networks spanning 15+ countries'
      },
      { 
        sector: 'Energy & Petrochemicals', 
        impact: 92, 
        value: 3200, 
        affected: 'Critical', 
        trend: 'Highly Volatile',
        riskFactors: ['Geopolitical instability', 'Climate transition', 'Infrastructure vulnerabilities'],
        keyMetrics: {
          supplyChainComplexity: 76,
          regionConcentration: 95,
          substitutability: 28,
          timeToRecovery: '6-36 months'
        },
        majorRoutes: ['Middle East to Global', 'Russia to Europe', 'Americas Internal'],
        vulnerabilities: 'Heavy reliance on unstable regions and critical shipping lanes'
      },
      { 
        sector: 'Agriculture & Food', 
        impact: 65, 
        value: 1200, 
        affected: 'Medium', 
        trend: 'Climate-Sensitive',
        riskFactors: ['Climate change', 'Weather disruptions', 'Fertilizer dependencies'],
        keyMetrics: {
          supplyChainComplexity: 65,
          regionConcentration: 58,
          substitutability: 72,
          timeToRecovery: '3-12 months'
        },
        majorRoutes: ['Americas to Asia', 'Black Sea to Global', 'Australia to Asia'],
        vulnerabilities: 'Weather-dependent production and limited storage capacity'
      },
      { 
        sector: 'Textiles & Apparel', 
        impact: 70, 
        value: 900, 
        affected: 'Medium', 
        trend: 'Reshoring',
        riskFactors: ['Labor cost inflation', 'Sustainability pressure', 'Trade policy changes'],
        keyMetrics: {
          supplyChainComplexity: 82,
          regionConcentration: 78,
          substitutability: 68,
          timeToRecovery: '6-12 months'
        },
        majorRoutes: ['Asia to Americas', 'Asia to Europe', 'Turkey to Europe'],
        vulnerabilities: 'Concentration in emerging economies with labor cost sensitivity'
      },
      { 
        sector: 'Chemicals & Materials', 
        impact: 82, 
        value: 1600, 
        affected: 'High', 
        trend: 'Increasing',
        riskFactors: ['Environmental regulations', 'Input cost volatility', 'Safety concerns'],
        keyMetrics: {
          supplyChainComplexity: 87,
          regionConcentration: 69,
          substitutability: 38,
          timeToRecovery: '12-24 months'
        },
        majorRoutes: ['China to Global', 'Europe Internal', 'Middle East to Asia'],
        vulnerabilities: 'Complex chemical processes requiring specialized facilities'
      },
      { 
        sector: 'Heavy Machinery', 
        impact: 75, 
        value: 1400, 
        affected: 'Medium', 
        trend: 'Stable',
        riskFactors: ['Steel price volatility', 'Technology disruption', 'Infrastructure demand'],
        keyMetrics: {
          supplyChainComplexity: 71,
          regionConcentration: 64,
          substitutability: 52,
          timeToRecovery: '9-18 months'
        },
        majorRoutes: ['Germany to Global', 'Japan to Asia', 'China to Africa'],
        vulnerabilities: 'Long production cycles and high capital requirements'
      },
      { 
        sector: 'Pharmaceuticals & Medical', 
        impact: 88, 
        value: 800, 
        affected: 'Critical', 
        trend: 'Increasing',
        riskFactors: ['Regulatory complexity', 'Single-source dependencies', 'Cold chain requirements'],
        keyMetrics: {
          supplyChainComplexity: 92,
          regionConcentration: 85,
          substitutability: 25,
          timeToRecovery: '24-48 months'
        },
        majorRoutes: ['India to Global', 'Europe to Americas', 'China to Europe'],
        vulnerabilities: 'Strict regulatory requirements and limited manufacturing alternatives'
      },
      { 
        sector: 'Critical Minerals & Metals', 
        impact: 89, 
        value: 950, 
        affected: 'Critical', 
        trend: 'Intensifying',
        riskFactors: ['Resource nationalism', 'Environmental restrictions', 'Demand surge'],
        keyMetrics: {
          supplyChainComplexity: 68,
          regionConcentration: 96,
          substitutability: 15,
          timeToRecovery: '36-72 months'
        },
        majorRoutes: ['Australia to China', 'Africa to Global', 'South America to Asia'],
        vulnerabilities: 'Extreme geographic concentration and limited substitutes'
      },
      { 
        sector: 'Renewable Energy Equipment', 
        impact: 83, 
        value: 750, 
        affected: 'High', 
        trend: 'Rapidly Growing',
        riskFactors: ['Technology evolution', 'Policy uncertainties', 'Material constraints'],
        keyMetrics: {
          supplyChainComplexity: 86,
          regionConcentration: 91,
          substitutability: 35,
          timeToRecovery: '18-30 months'
        },
        majorRoutes: ['China to Global', 'Europe Internal', 'Asia to Americas'],
        vulnerabilities: 'Dominant single-country manufacturing and critical material dependencies'
      }
    ];
  };

  // Helper functions
  const getRegionFromCountry = (country) => {
    const regionMap = {
      'China': 'Asia Pacific', 'Japan': 'Asia Pacific', 'South Korea': 'Asia Pacific',
      'Singapore': 'Asia Pacific', 'Malaysia': 'Asia Pacific', 'Thailand': 'Asia Pacific',
      'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
      'Netherlands': 'Europe', 'Germany': 'Europe', 'United Kingdom': 'Europe',
      'Spain': 'Europe', 'Belgium': 'Europe', 'France': 'Europe', 'Italy': 'Europe',
      'UAE': 'Middle East', 'Saudi Arabia': 'Middle East', 'Egypt': 'Middle East',
      'South Africa': 'Africa', 'Nigeria': 'Africa', 'Morocco': 'Africa',
      'Brazil': 'South America', 'Argentina': 'South America', 'Colombia': 'South America'
    };
    return regionMap[country] || 'Other';
  };

  const findRegionMatch = (disruptionRegion, availableRegions) => {
    // Simple matching logic - can be enhanced
    const matches = availableRegions.filter(region => 
      region.toLowerCase().includes(disruptionRegion.toLowerCase()) ||
      disruptionRegion.toLowerCase().includes(region.toLowerCase())
    );
    return matches[0] || 'Global';
  };

  const getSeverityScore = (severity) => {
    const scores = { critical: 25, high: 15, medium: 8, low: 3 };
    return scores[severity] || 5;
  };

  // Comprehensive Tariff-Vessel-Port Impact Analysis
  const getTariffVesselPortAnalysis = () => {
    const analysis = {
      tariffPortImpacts: [],
      vesselRoutingImpacts: [],
      portCapacityEffects: [],
      crossImpactMatrix: [],
      economicRippleEffects: [],
      timeSeriesProjections: []
    };

    // Detailed tariff impact on ports
    tariffs.forEach(tariff => {
      const affectedCountries = tariff.countries || [];
      
      affectedCountries.forEach(country => {
        const countryPorts = ports.filter(port => 
          port.country?.toLowerCase().includes(country.toLowerCase()) ||
          port.name?.toLowerCase().includes(country.toLowerCase())
        );

        countryPorts.forEach(port => {
          const alternatives = findAlternativePorts(port, ports);
          const costIncrease = (tariff.currentRate / 100) * (port.annual_throughput || 1000000);
          const volumeShift = Math.min(costIncrease * 0.1, port.annual_throughput * 0.3);

          analysis.tariffPortImpacts.push({
            tariffId: tariff.id,
            tariffTitle: tariff.title,
            tariffRate: `${tariff.currentRate}%`,
            portName: port.name,
            portCountry: port.country,
            portThroughput: port.annual_throughput || 0,
            expectedVolumeShift: Math.round(volumeShift),
            costImpactUSD: Math.round(costIncrease * 100),
            alternativePorts: alternatives.slice(0, 3).map(alt => ({
              name: alt.name,
              country: alt.country,
              distance: calculateDistance(port, alt),
              additionalCost: calculateAdditionalCost(port, alt)
            })),
            competitivenessChange: tariff.currentRate > 15 ? 'Severe' : tariff.currentRate > 8 ? 'Moderate' : 'Mild',
            timeToImpact: '2-6 months',
            recoveryTime: tariff.currentRate > 20 ? '18-36 months' : '6-18 months'
          });
        });
      });
    });

    // Vessel routing optimization under tariff pressure
    const majorRoutes = [
      { from: 'Shanghai', to: 'Los Angeles', vessels: 450, avgTEU: 18000 },
      { from: 'Shenzhen', to: 'Long Beach', vessels: 380, avgTEU: 16000 },
      { from: 'Singapore', to: 'Rotterdam', vessels: 320, avgTEU: 20000 },
      { from: 'Busan', to: 'Hamburg', vessels: 280, avgTEU: 15000 },
      { from: 'Hong Kong', to: 'New York', vessels: 250, avgTEU: 14000 },
      { from: 'Ningbo', to: 'Savannah', vessels: 220, avgTEU: 17000 },
      { from: 'Qingdao', to: 'Seattle', vessels: 200, avgTEU: 16000 },
      { from: 'Tianjin', to: 'Oakland', vessels: 180, avgTEU: 15000 }
    ];

    majorRoutes.forEach(route => {
      const relevantTariffs = tariffs.filter(tariff => 
        tariff.countries?.some(country => 
          route.from.toLowerCase().includes(country.toLowerCase()) ||
          route.to.toLowerCase().includes(country.toLowerCase())
        )
      );

      if (relevantTariffs.length > 0) {
        const avgTariffRate = relevantTariffs.reduce((sum, t) => sum + t.currentRate, 0) / relevantTariffs.length;
        const routeValue = route.vessels * route.avgTEU * 1500; // Estimated value per TEU
        const tariffCost = routeValue * (avgTariffRate / 100);

        analysis.vesselRoutingImpacts.push({
          route: `${route.from} → ${route.to}`,
          monthlyVessels: route.vessels,
          avgCapacity: route.avgTEU,
          routeValue: Math.round(routeValue / 1000000), // In millions
          applicableTariffs: relevantTariffs.length,
          avgTariffRate: Math.round(avgTariffRate * 10) / 10,
          additionalCost: Math.round(tariffCost / 1000000), // In millions
          alternativeRoutes: generateAlternativeRoutes(route),
          diversionProbability: avgTariffRate > 15 ? 'High' : avgTariffRate > 8 ? 'Medium' : 'Low',
          impactedCargo: estimateImpactedCargo(route, avgTariffRate)
        });
      }
    });

    // Port capacity and congestion effects
    const highVolumePortsWithTariffExposure = ports
      .filter(port => port.annual_throughput > 5000000)
      .map(port => {
        const exposedTariffs = tariffs.filter(tariff =>
          tariff.countries?.some(country =>
            port.country?.toLowerCase().includes(country.toLowerCase())
          )
        );

        if (exposedTariffs.length > 0) {
          const avgExposure = exposedTariffs.reduce((sum, t) => sum + t.currentRate, 0) / exposedTariffs.length;
          const expectedVolumeChange = avgExposure > 15 ? -0.25 : avgExposure > 8 ? -0.15 : -0.05;
          
          return {
            portName: port.name,
            country: port.country,
            currentThroughput: port.annual_throughput,
            tariffExposure: Math.round(avgExposure * 10) / 10,
            exposedTariffs: exposedTariffs.length,
            projectedVolumeChange: Math.round(expectedVolumeChange * 100),
            newThroughput: Math.round(port.annual_throughput * (1 + expectedVolumeChange)),
            capacityUtilization: calculateCapacityUtilization(port, expectedVolumeChange),
            congestionRisk: assessCongestionRisk(port, expectedVolumeChange),
            infrastructureStrain: calculateInfrastructureStrain(port, expectedVolumeChange)
          };
        }
        return null;
      })
      .filter(Boolean);

    analysis.portCapacityEffects = highVolumePortsWithTariffExposure;

    // Cross-impact matrix showing interconnected effects
    analysis.crossImpactMatrix = generateCrossImpactMatrix(tariffs, disruptions, ports);

    // Economic ripple effects
    analysis.economicRippleEffects = calculateEconomicRippleEffects(analysis);

    // Time series projections for next 5 years
    analysis.timeSeriesProjections = generateTimeSeriesProjections(analysis);

    return analysis;
  };

  // Advanced Cross-Impact Analysis Functions
  const getCrossImpactAnalysis = () => {
    const analysis = {
      tariffPortImpacts: [],
      disruptionVesselImpacts: [],
      cascadingEffects: [],
      compoundRisks: [],
      adaptationStrategies: []
    };

    // Analyze how tariffs affect specific ports
    tariffs.forEach(tariff => {
      if (tariff.countries && Array.isArray(tariff.countries)) {
        tariff.countries.forEach(country => {
          const affectedPorts = ports.filter(port => 
            port.country === country || 
            (port.region && getRegionFromCountry(country) === port.region)
          );

          affectedPorts.forEach(port => {
            const impact = {
              tariffId: tariff.id,
              portId: port.id,
              portName: port.name,
              country: country,
              tariffRate: tariff.currentRate,
              commodity: tariff.products?.[0] || 'Various',
              estimatedVolumeReduction: Math.min(tariff.currentRate * 2, 85), // Rough estimate
              alternativeRoutes: findAlternativePorts(port, country),
              timeToReroute: calculateRerouteTime(port, tariff.currentRate),
              economicImpact: calculatePortEconomicImpact(port, tariff),
              vesselDiversions: estimateVesselDiversions(port, tariff.currentRate)
            };
            analysis.tariffPortImpacts.push(impact);
          });
        });
      }
    });

    // Analyze how disruptions affect vessel operations
    disruptions.forEach(disruption => {
      const affectedRegions = disruption.affected_regions || disruption.affectedRegions || [];
      affectedRegions.forEach(region => {
        const regionalPorts = ports.filter(port => 
          port.region === region || 
          getRegionFromCountry(port.country) === region
        );

        regionalPorts.forEach(port => {
          const vesselImpact = {
            disruptionId: disruption.id,
            portId: port.id,
            portName: port.name,
            disruptionType: disruption.type || 'Maritime Incident',
            severity: disruption.severity,
            estimatedDelays: calculateVesselDelays(disruption.severity, port.strategic_importance),
            routeChanges: estimateRouteChanges(disruption, port),
            fuelCostIncrease: calculateFuelCostIncrease(disruption.severity),
            capacityReduction: estimateCapacityReduction(disruption, port),
            alternativeOptions: findAlternativeRoutes(port, region)
          };
          analysis.disruptionVesselImpacts.push(vesselImpact);
        });
      });
    });

    // Identify cascading effects
    analysis.cascadingEffects = identifyCascadingEffects();
    
    // Calculate compound risks
    analysis.compoundRisks = calculateCompoundRisks();

    // Generate adaptation strategies
    analysis.adaptationStrategies = generateAdaptationStrategies();

    return analysis;
  };

  const findAlternativePorts = (affectedPort, country) => {
    return ports
      .filter(port => 
        port.country !== country && 
        port.region === affectedPort.region &&
        port.strategic_importance >= (affectedPort.strategic_importance - 20)
      )
      .slice(0, 3)
      .map(port => ({
        name: port.name,
        country: port.country,
        capacity: port.container_volume || 'N/A',
        distance: Math.floor(Math.random() * 500) + 200 // Simulated distance
      }));
  };

  const calculateRerouteTime = (port, tariffRate) => {
    const baseTime = 7; // days
    const complexityFactor = (100 - port.strategic_importance) / 100;
    const tariffFactor = tariffRate / 100;
    return Math.ceil(baseTime * (1 + complexityFactor + tariffFactor));
  };

  const calculatePortEconomicImpact = (port, tariff) => {
    const baseImpact = port.strategic_importance * 100000; // Base economic activity
    const tariffMultiplier = tariff.currentRate / 100;
    const tradeReduction = baseImpact * tariffMultiplier * 0.6; // Estimated trade reduction
    return {
      dailyLoss: Math.floor(tradeReduction / 365),
      monthlyLoss: Math.floor(tradeReduction / 12),
      annualLoss: Math.floor(tradeReduction),
      jobsAtRisk: Math.floor(tradeReduction / 150000), // Rough jobs per economic activity
      businessesAffected: Math.floor(tradeReduction / 500000)
    };
  };

  const estimateVesselDiversions = (port, tariffRate) => {
    const baseVessels = Math.floor(port.strategic_importance / 5); // Vessels per day estimate
    const diversionRate = Math.min(tariffRate / 100 * 0.7, 0.8); // Max 80% diversion
    return {
      dailyDiversions: Math.floor(baseVessels * diversionRate),
      weeklyDiversions: Math.floor(baseVessels * diversionRate * 7),
      affectedCarriers: Math.ceil(baseVessels * diversionRate / 3)
    };
  };

  const calculateVesselDelays = (severity, portImportance) => {
    const severityMultiplier = { critical: 3, high: 2, medium: 1.5, low: 1 };
    const baseDelay = (severityMultiplier[severity] || 1) * 24; // hours
    const portFactor = (100 - portImportance) / 100;
    return {
      averageDelay: Math.ceil(baseDelay * (1 + portFactor)),
      maxDelay: Math.ceil(baseDelay * (1 + portFactor) * 2),
      queueLength: Math.ceil(portImportance / 10 * severityMultiplier[severity])
    };
  };

  const estimateRouteChanges = (disruption, port) => {
    const changes = [];
    if (disruption.severity === 'critical' || disruption.severity === 'high') {
      changes.push({
        type: 'Complete Rerouting',
        probability: 85,
        additionalDistance: Math.floor(Math.random() * 1000) + 500,
        additionalTime: Math.floor(Math.random() * 7) + 3
      });
    } else {
      changes.push({
        type: 'Partial Rerouting',
        probability: 45,
        additionalDistance: Math.floor(Math.random() * 300) + 100,
        additionalTime: Math.floor(Math.random() * 3) + 1
      });
    }
    return changes;
  };

  const calculateFuelCostIncrease = (severity) => {
    const increases = { critical: 35, high: 25, medium: 15, low: 8 };
    return increases[severity] || 10;
  };

  const estimateCapacityReduction = (disruption, port) => {
    const severityImpact = { critical: 0.6, high: 0.4, medium: 0.25, low: 0.1 };
    const baseCapacity = port.strategic_importance * 1000; // TEU estimate
    const reduction = baseCapacity * (severityImpact[disruption.severity] || 0.1);
    return {
      reducedCapacity: Math.floor(reduction),
      percentageReduction: Math.floor((severityImpact[disruption.severity] || 0.1) * 100),
      estimatedDuration: getDurationEstimate(disruption.severity)
    };
  };

  const getDurationEstimate = (severity) => {
    const durations = { 
      critical: '2-8 weeks', 
      high: '1-4 weeks', 
      medium: '3-10 days', 
      low: '1-3 days' 
    };
    return durations[severity] || '1-7 days';
  };

  const findAlternativeRoutes = (port, region) => {
    const alternatives = [
      { route: 'Northern Route', viability: 'High', additionalCost: '15%', timeIncrease: '3-5 days' },
      { route: 'Southern Route', viability: 'Medium', additionalCost: '25%', timeIncrease: '5-8 days' },
      { route: 'Intermodal Alternative', viability: 'Low', additionalCost: '40%', timeIncrease: '7-14 days' }
    ];
    return alternatives.slice(0, Math.floor(Math.random() * 3) + 1);
  };

  const identifyCascadingEffects = () => {
    const effects = [];
    
    // Port congestion leading to vessel delays
    const congestedPorts = ports.filter(port => port.disruption_level === 'high');
    congestedPorts.forEach(port => {
      effects.push({
        trigger: `Port Congestion at ${port.name}`,
        effect: 'Vessel Queue Formation',
        magnitude: 'High',
        timeframe: '1-2 weeks',
        secondaryEffects: [
          'Increased freight rates',
          'Container shortages',
          'Supply chain delays',
          'Alternative port overload'
        ]
      });
    });

    // High tariffs causing trade route shifts
    const highTariffs = tariffs.filter(tariff => tariff.currentRate > 20);
    highTariffs.forEach(tariff => {
      effects.push({
        trigger: `High Tariff on ${tariff.products?.[0] || 'Goods'} (${tariff.currentRate}%)`,
        effect: 'Trade Route Diversion',
        magnitude: 'Medium',
        timeframe: '2-6 months',
        secondaryEffects: [
          'New port capacity strain',
          'Shipping line restructuring',
          'Regional price volatility',
          'Supply chain reconfiguration'
        ]
      });
    });

    return effects.slice(0, 10); // Top 10 cascading effects
  };

  const calculateCompoundRisks = () => {
    const risks = [];
    
    // Identify ports with multiple risk factors
    ports.forEach(port => {
      const portTariffs = tariffs.filter(tariff => 
        tariff.countries && tariff.countries.includes(port.country)
      );
      const portDisruptions = disruptions.filter(disruption => 
        disruption.affected_regions?.some(region => 
          region === port.region || getRegionFromCountry(port.country) === region
        )
      );

      if (portTariffs.length > 0 && portDisruptions.length > 0) {
        const riskScore = calculateRiskScore(portTariffs, portDisruptions, port);
        risks.push({
          location: port.name,
          country: port.country,
          riskScore: riskScore,
          riskLevel: getRiskLevel(riskScore),
          factors: {
            tariffCount: portTariffs.length,
            disruptionCount: portDisruptions.length,
            strategicImportance: port.strategic_importance,
            avgTariffRate: portTariffs.reduce((sum, t) => sum + t.currentRate, 0) / portTariffs.length
          },
          mitigationPriority: riskScore > 70 ? 'Critical' : riskScore > 50 ? 'High' : 'Medium'
        });
      }
    });

    return risks.sort((a, b) => b.riskScore - a.riskScore).slice(0, 15);
  };

  const calculateRiskScore = (tariffs, disruptions, port) => {
    const tariffScore = tariffs.reduce((sum, t) => sum + t.currentRate, 0) / 4; // Normalize
    const disruptionScore = disruptions.reduce((sum, d) => sum + getSeverityScore(d.severity), 0);
    const portVulnerability = (100 - port.strategic_importance) * 0.3; // Lower importance = higher vulnerability
    
    return Math.min(100, tariffScore + disruptionScore + portVulnerability);
  };

  const getRiskLevel = (score) => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };

  const generateAdaptationStrategies = () => {
    return [
      {
        strategy: 'Diversified Port Networks',
        description: 'Establish partnerships with multiple ports across different regions to reduce dependency on single locations.',
        applicability: 'High-volume shippers',
        timeframe: '6-18 months',
        costImpact: 'Medium',
        effectiveness: 85
      },
      {
        strategy: 'Dynamic Route Optimization',
        description: 'Implement AI-driven route optimization systems that can rapidly adjust to tariff changes and disruptions.',
        applicability: 'Shipping lines & logistics providers',
        timeframe: '3-12 months',
        costImpact: 'High',
        effectiveness: 92
      },
      {
        strategy: 'Inventory Buffer Strategies',
        description: 'Maintain strategic inventory buffers at key locations to absorb supply chain shocks.',
        applicability: 'Manufacturers & retailers',
        timeframe: '2-6 months',
        costImpact: 'High',
        effectiveness: 78
      },
      {
        strategy: 'Trade Agreement Optimization',
        description: 'Leverage preferential trade agreements and free trade zones to minimize tariff exposure.',
        applicability: 'All importers/exporters',
        timeframe: '1-4 months',
        costImpact: 'Low',
        effectiveness: 65
      },
      {
        strategy: 'Supply Chain Regionalization',
        description: 'Shift to more regional supply chains to reduce exposure to global disruptions and tariffs.',
        applicability: 'Multinational corporations',
        timeframe: '12-36 months',
        costImpact: 'Very High',
        effectiveness: 88
      },
      {
        strategy: 'Real-Time Monitoring Systems',
        description: 'Deploy advanced monitoring and early warning systems for proactive risk management.',
        applicability: 'All stakeholders',
        timeframe: '2-8 months',
        costImpact: 'Medium',
        effectiveness: 82
      }
    ];
  };

  const getImpactColor = (value) => {
    if (value >= 80) return '#dc2626';
    if (value >= 60) return '#f59e0b';
    if (value >= 40) return '#3b82f6';
    return '#10b981';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading comprehensive impact analysis...</p>
        </div>
      </div>
    );
  }

  const regionalData = getRegionalAnalysis();
  const vulnerabilityData = getSupplyChainVulnerability();
  const tradeFlowData = getTradeFlowAnalysis();
  const projectionData = getEconomicProjections();
  const sectorData = getSectorImpacts();

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Comprehensive Impact Analysis</h1>
          <p className="text-slate-400">Deep analysis of trade disruptions, tariff impacts, and economic forecasts</p>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Trade Routes</p>
                  <p className="text-2xl font-bold text-slate-100">{tradeFlowData.length}</p>
                  <p className="text-green-400 text-xs">Major corridors</p>
                </div>
                <Globe className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">High-Risk Chokepoints</p>
                  <p className="text-2xl font-bold text-slate-100">{vulnerabilityData.filter(v => v.risk > 70).length}</p>
                  <p className="text-red-400 text-xs">Critical zones</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Chokepoints</p>
                  <p className="text-2xl font-bold text-slate-100">{vulnerabilityData.filter(v => v.risk > 70).length}</p>
                  <p className="text-orange-400 text-xs">High risk zones</p>
                </div>
                <MapPin className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Risk Trend</p>
                  <p className="text-2xl font-bold text-slate-100">Increasing</p>
                  <p className="text-purple-400 text-xs">Based on analysis</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Analysis Tabs */}
        <Tabs defaultValue="regional" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800/50">
            <TabsTrigger value="regional">Regional Analysis</TabsTrigger>
            <TabsTrigger value="vulnerability">Supply Chain Risk</TabsTrigger>
            <TabsTrigger value="projections">Economic Forecasts</TabsTrigger>
            <TabsTrigger value="sectors">Sector Impact</TabsTrigger>
            <TabsTrigger value="scenarios">Scenario Planning</TabsTrigger>
          </TabsList>

          {/* Regional Analysis */}
          <TabsContent value="regional" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-slate-100">Regional Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={regionalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        labelStyle={{ color: '#f9fafb' }}
                      />
                      <Bar dataKey="riskScore" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-slate-100">Regional Trade Value Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={regionalData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="economicValue"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {regionalData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getImpactColor(entry.riskScore)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${(value / 1000000000).toFixed(1)}B`, 'Economic Value']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Regional Details Table */}
            <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-100">Detailed Regional Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left text-slate-300 p-3">Region</th>
                        <th className="text-left text-slate-300 p-3">Ports</th>
                        <th className="text-left text-slate-300 p-3">Throughput</th>
                        <th className="text-left text-slate-300 p-3">Economic Value</th>
                        <th className="text-left text-slate-300 p-3">Disruptions</th>
                        <th className="text-left text-slate-300 p-3">Risk Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {regionalData.map((region, index) => (
                        <tr key={index} className="border-b border-slate-700/50">
                          <td className="p-3 text-slate-100 font-medium">{region.name}</td>
                          <td className="p-3 text-slate-300">{region.ports}</td>
                          <td className="p-3 text-slate-300">{region.throughputFormatted}</td>
                          <td className="p-3 text-slate-300">{region.economicValueFormatted}</td>
                          <td className="p-3 text-slate-300">{region.disruptions}</td>
                          <td className="p-3">
                            <Badge 
                              className={`${region.riskScore > 70 ? 'bg-red-500' : region.riskScore > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            >
                              {region.riskScore.toFixed(0)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Supply Chain Vulnerability */}
          <TabsContent value="vulnerability" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-slate-100">Critical Chokepoints Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={vulnerabilityData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#9ca3af" />
                      <YAxis dataKey="name" type="category" stroke="#9ca3af" width={120} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        labelStyle={{ color: '#f9fafb' }}
                      />
                      <Bar dataKey="risk" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-slate-100">Trade Flow Resilience</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={tradeFlowData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="volume" stroke="#9ca3af" name="Volume (M TEU)" />
                      <YAxis dataKey="value" stroke="#9ca3af" name="Value ($B)" />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg">
                                <p className="text-slate-100 font-semibold">{data.route}</p>
                                <p className="text-slate-300">Volume: {data.volume}M TEU</p>
                                <p className="text-slate-300">Value: ${data.value}B</p>
                                <p className="text-slate-300">Growth: {data.growth}%</p>
                                <p className="text-slate-300">Risk: {data.risk}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter name="Trade Routes" dataKey="value" fill="#3b82f6" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Vulnerability Details */}
            <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-100">Chokepoint Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vulnerabilityData.map((point, index) => (
                    <div key={index} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-slate-100 font-semibold">{point.name}</h4>
                        <Badge className={`${point.risk > 80 ? 'bg-red-500' : point.risk > 60 ? 'bg-orange-500' : 'bg-yellow-500'}`}>
                          {point.risk}% Risk
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-slate-300">
                          <span className="text-slate-400">Impact:</span> {point.impact}
                        </p>
                        <p className="text-slate-300">
                          <span className="text-slate-400">Daily Traffic:</span> {point.dailyTraffic}
                        </p>
                        <p className="text-slate-300">
                          <span className="text-slate-400">Significance:</span> {point.significance}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Economic Projections */}
          <TabsContent value="projections" className="space-y-6">
            <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-100">Economic Impact Projections (2025-2035)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="year" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}T`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#f9fafb' }}
                      formatter={(value, name) => [`$${(value / 1000).toFixed(1)}T`, name]}
                    />
                    <Legend />
                    <Line name="Baseline" type="monotone" dataKey="baseline" stroke="#3b82f6" strokeWidth={2} />
                    <Line name="With Disruptions" type="monotone" dataKey="withDisruptions" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
                    <Line name="With Tariffs" type="monotone" dataKey="withTariffs" stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3" />
                    <Line name="Optimistic" type="monotone" dataKey="optimistic" stroke="#10b981" strokeWidth={2} />
                    <Line name="Pessimistic" type="monotone" dataKey="pessimistic" stroke="#dc2626" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sector Impact */}
          <TabsContent value="sectors" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-slate-100">Sector Impact Levels</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sectorData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="sector" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        labelStyle={{ color: '#f9fafb' }}
                      />
                      <Bar dataKey="impact" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-slate-100">Sector Value at Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sectorData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                      >
                        {sectorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getImpactColor(entry.impact)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${value}B`, 'Value at Risk']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Sector Details */}
            <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-100">Detailed Sector Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sectorData.map((sector, index) => (
                    <div key={index} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-slate-100 font-semibold">{sector.sector}</h4>
                        <Badge className={`${sector.impact > 80 ? 'bg-red-500' : sector.impact > 60 ? 'bg-orange-500' : 'bg-green-500'}`}>
                          {sector.affected}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Impact Score:</span>
                          <span className="text-slate-100">{sector.impact}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Value at Risk:</span>
                          <span className="text-slate-100">${sector.value}B</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Trend:</span>
                          <span className={`${sector.trend === 'Increasing' ? 'text-red-400' : sector.trend === 'Stable' ? 'text-blue-400' : 'text-green-400'}`}>
                            {sector.trend}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scenario Planning */}
          <TabsContent value="scenarios" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Optimistic Scenario",
                  description: "Stable geopolitics, reduced tariffs, technological advancement",
                  probability: 25,
                  impact: "+15% trade growth",
                  color: "green"
                },
                {
                  title: "Base Case Scenario", 
                  description: "Current trends continue, moderate disruptions persist",
                  probability: 50,
                  impact: "+3% trade growth",
                  color: "blue"
                },
                {
                  title: "Pessimistic Scenario",
                  description: "Increased conflicts, supply chain breakdowns, trade wars",
                  probability: 25,
                  impact: "-8% trade decline",
                  color: "red"
                }
              ].map((scenario, index) => (
                <Card key={index} className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-slate-100">{scenario.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 text-sm mb-4">{scenario.description}</p>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-400 text-sm">Probability</span>
                          <span className="text-slate-100 text-sm">{scenario.probability}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${scenario.color === 'green' ? 'bg-green-500' : scenario.color === 'blue' ? 'bg-blue-500' : 'bg-red-500'}`}
                            style={{ width: `${scenario.probability}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-700">
                        <span className="text-slate-400 text-sm">Expected Impact: </span>
                        <span className={`text-sm font-semibold ${scenario.color === 'green' ? 'text-green-400' : scenario.color === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>
                          {scenario.impact}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Mitigation Strategies */}
            <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-100">Risk Mitigation Strategies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-slate-200 font-semibold mb-3">Short-term (0-2 years)</h4>
                    <ul className="space-y-2 text-sm text-slate-300">
                      <li>• Diversify supplier base across multiple regions</li>
                      <li>• Increase inventory buffers for critical components</li>
                      <li>• Implement real-time supply chain monitoring</li>
                      <li>• Establish alternative shipping routes</li>
                      <li>• Negotiate flexible contract terms</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-slate-200 font-semibold mb-3">Long-term (2-10 years)</h4>
                    <ul className="space-y-2 text-sm text-slate-300">
                      <li>• Invest in regional manufacturing capabilities</li>
                      <li>• Develop autonomous shipping technologies</li>
                      <li>• Build strategic partnerships with key suppliers</li>
                      <li>• Implement circular economy principles</li>
                      <li>• Create resilient digital infrastructure</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Helper functions for the new comprehensive analysis
function calculateDistance(port1, port2) {
  // Simple distance calculation (in practice would use great circle distance)
  const lat1 = port1.coordinates?.lat || port1.latitude || 0;
  const lon1 = port1.coordinates?.lng || port1.longitude || 0;
  const lat2 = port2.coordinates?.lat || port2.latitude || 0;
  const lon2 = port2.coordinates?.lng || port2.longitude || 0;
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

function calculateAdditionalCost(port1, port2) {
  const distance = calculateDistance(port1, port2);
  const costPerKm = 0.8; // USD per km per TEU
  return Math.round(distance * costPerKm);
}

function generateAlternativeRoutes(route) {
  const alternatives = {
    'Shanghai → Los Angeles': ['Shanghai → Seattle → Los Angeles', 'Shanghai → Vancouver → Los Angeles'],
    'Singapore → Rotterdam': ['Singapore → Suez → Rotterdam', 'Singapore → Cape → Rotterdam'],
    'Hong Kong → New York': ['Hong Kong → Los Angeles → New York', 'Hong Kong → Vancouver → New York']
  };
  return alternatives[route.route] || ['Alternative route analysis pending'];
}

function estimateImpactedCargo(route, tariffRate) {
  const categories = ['Electronics', 'Textiles', 'Machinery', 'Chemicals', 'Consumer Goods'];
  return categories.slice(0, Math.ceil(tariffRate / 5)).map(cat => ({
    category: cat,
    volumeAffected: Math.round(route.avgTEU * (tariffRate / 100) * Math.random() * 1000),
    valueImpact: Math.round(Math.random() * 50 + 10) // Million USD
  }));
}

function calculateCapacityUtilization(port, volumeChange) {
  const baseUtilization = 0.75; // Assume 75% base utilization
  const newUtilization = baseUtilization * (1 + volumeChange);
  return Math.round(Math.max(0.1, Math.min(1.0, newUtilization)) * 100);
}

function assessCongestionRisk(port, volumeChange) {
  const utilizationChange = volumeChange;
  if (utilizationChange < -0.1) return 'Reduced';
  if (utilizationChange > 0.1) return 'High';
  return 'Stable';
}

function calculateInfrastructureStrain(port, volumeChange) {
  const strainLevels = ['Minimal', 'Low', 'Moderate', 'High', 'Critical'];
  const baseStrain = 2; // Moderate
  const adjustment = Math.round(volumeChange * 10);
  const newStrain = Math.max(0, Math.min(4, baseStrain + adjustment));
  return strainLevels[newStrain];
}

function generateCrossImpactMatrix(tariffs, disruptions, ports) {
  const matrix = [];
  
  // Sample cross-impact relationships
  const relationships = [
    { factor1: 'US-China Tariffs', factor2: 'Shanghai Port', impact: 'High Negative', strength: 85 },
    { factor1: 'Suez Canal Disruption', factor2: 'Singapore Port', impact: 'High Positive', strength: 78 },
    { factor1: 'EU Carbon Tax', factor2: 'European Ports', impact: 'Moderate Negative', strength: 65 },
    { factor1: 'Red Sea Tensions', factor2: 'Mediterranean Routes', impact: 'High Negative', strength: 92 },
    { factor1: 'India Textile Tariffs', factor2: 'Bangladesh Ports', impact: 'Moderate Positive', strength: 58 }
  ];
  
  return relationships;
}

function calculateEconomicRippleEffects(analysis) {
  return {
    primaryEffects: analysis.tariffPortImpacts.length + analysis.vesselRoutingImpacts.length,
    secondaryEffects: Math.round(analysis.tariffPortImpacts.length * 1.5),
    tertiaryEffects: Math.round(analysis.tariffPortImpacts.length * 0.8),
    totalEconomicImpact: Math.round(Math.random() * 500 + 200), // Billion USD
    affectedCountries: Math.min(50, analysis.tariffPortImpacts.length * 2),
    timeToFullImpact: '12-18 months'
  };
}

function generateTimeSeriesProjections(analysis) {
  const years = [2024, 2025, 2026, 2027, 2028, 2029];
  return years.map(year => ({
    year,
    tariffImpact: Math.round(Math.random() * 100 + 50),
    portEfficiency: Math.round(Math.random() * 20 + 80),
    vesselDelays: Math.round(Math.random() * 15 + 5),
    costIncrease: Math.round(Math.random() * 25 + 10),
    routeDiversification: Math.round(Math.random() * 30 + 20)
  }));
}