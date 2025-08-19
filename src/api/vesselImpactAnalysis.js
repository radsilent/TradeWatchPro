// Vessel Impact Analysis for Tariffs and Trade Policies
// Analyzes how 2025-2035 tariffs affect vessel operations, routes, and costs

import { fetchRealTimeTariffData } from './tariffIntegration';
import { getRealTimeVesselData } from './realTimeIntegration';

const CACHE_DURATION = 20 * 60 * 1000; // 20 minutes cache
const cache = new Map();

function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedData(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// Analyze vessel impact from tariffs
export async function analyzeVesselTariffImpact() {
  const cacheKey = 'vessel_tariff_impact_analysis';
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  console.log('Analyzing vessel tariff impacts...');

  try {
    const [tariffs, vessels] = await Promise.allSettled([
      fetchRealTimeTariffData(),
      getRealTimeVesselData()
    ]);

    const tariffData = tariffs.status === 'fulfilled' ? tariffs.value : [];
    const vesselData = vessels.status === 'fulfilled' ? vessels.value : [];

    // Filter tariffs that have vessel impact
    const vesselImpactTariffs = tariffData.filter(tariff => tariff.vesselImpact);

    const analysis = {
      summary: generateImpactSummary(vesselImpactTariffs, vesselData),
      vesselTypeImpacts: analyzeByVesselType(vesselImpactTariffs, vesselData),
      routeImpacts: analyzeByRoute(vesselImpactTariffs, vesselData),
      timelineProjections: generateTimelineProjections(vesselImpactTariffs),
      mitigationStrategies: compileMitigationStrategies(vesselImpactTariffs),
      costAnalysis: generateCostAnalysis(vesselImpactTariffs, vesselData),
      lastUpdate: new Date().toISOString()
    };

    setCachedData(cacheKey, analysis);
    return analysis;

  } catch (error) {
    console.error('Error analyzing vessel tariff impact:', error);
    return generateFallbackAnalysis();
  }
}

// Generate comprehensive impact summary
function generateImpactSummary(tariffs, vessels) {
  const totalVessels = vessels.length;
  const affectedVessels = vessels.filter(vessel => 
    tariffs.some(tariff => 
      tariff.vesselImpact?.affectedVesselTypes?.includes(vessel.type)
    )
  ).length;

  const totalCostImpact = tariffs.reduce((sum, tariff) => {
    const impact = parseFloat(tariff.estimatedImpact?.replace(/[$B]/g, '') || 0);
    return sum + impact;
  }, 0);

  const criticalTariffs = tariffs.filter(t => t.priority === 'Critical').length;

  return {
    totalVesselsTracked: totalVessels,
    vesselsAffectedByTariffs: affectedVessels,
    percentageAffected: Math.round((affectedVessels / totalVessels) * 100),
    totalEstimatedImpact: `$${totalCostImpact.toFixed(1)}B`,
    criticalTariffPolicies: criticalTariffs,
    mostImpactedVesselType: getMostImpactedVesselType(tariffs),
    averageCostIncrease: calculateAverageCostIncrease(tariffs),
    timeframe: '2025-2035'
  };
}

// Analyze impact by vessel type
function analyzeByVesselType(tariffs, vessels) {
  const vesselTypes = [...new Set(vessels.map(v => v.type))];
  
  return vesselTypes.map(type => {
    const relevantTariffs = tariffs.filter(tariff =>
      tariff.vesselImpact?.affectedVesselTypes?.includes(type)
    );

    const typeVessels = vessels.filter(v => v.type === type);
    
    const costRange = relevantTariffs.reduce((range, tariff) => {
      const costPer = tariff.vesselImpact?.costPerVoyage || '$0';
      const costs = extractCostRange(costPer);
      return {
        min: Math.min(range.min, costs.min),
        max: Math.max(range.max, costs.max)
      };
    }, { min: Infinity, max: 0 });

    return {
      vesselType: type,
      vesselCount: typeVessels.length,
      affectingTariffs: relevantTariffs.length,
      costImpactPerVoyage: costRange.min === Infinity ? '$0' : `$${costRange.min.toLocaleString()}-$${costRange.max.toLocaleString()}`,
      majorConcerns: relevantTariffs.map(t => t.category),
      adaptationStrategies: [...new Set(relevantTariffs.flatMap(t => t.vesselImpact?.mitigationStrategies || []))],
      severity: calculateSeverity(relevantTariffs)
    };
  });
}

// Analyze impact by route
function analyzeByRoute(tariffs, vessels) {
  const routes = [...new Set(vessels.map(v => v.route).filter(Boolean))];
  
  return routes.map(route => {
    const relevantTariffs = tariffs.filter(tariff =>
      tariff.vesselImpact?.routeImpact?.some(r => 
        route.includes(r.split('-')[0]) || route.includes(r.split('-')[1])
      )
    );

    const routeVessels = vessels.filter(v => v.route === route);

    return {
      route: route,
      vesselCount: routeVessels.length,
      affectingPolicies: relevantTariffs.length,
      policyTypes: [...new Set(relevantTariffs.map(t => t.category))],
      estimatedDelay: calculateRouteDelay(relevantTariffs),
      costIncrease: calculateRouteCostIncrease(relevantTariffs),
      alternativeRoutes: suggestAlternativeRoutes(route, relevantTariffs),
      riskLevel: calculateRouteRisk(relevantTariffs)
    };
  });
}

// Generate timeline projections
function generateTimelineProjections(tariffs) {
  const years = [2025, 2026, 2027, 2028, 2029, 2030];
  
  return years.map(year => {
    const yearTariffs = tariffs.filter(tariff => {
      const effectiveYear = new Date(tariff.effectiveDate).getFullYear();
      return effectiveYear === year;
    });

    const totalImpact = yearTariffs.reduce((sum, tariff) => {
      const impact = parseFloat(tariff.estimatedImpact?.replace(/[$B]/g, '') || 0);
      return sum + impact;
    }, 0);

    return {
      year: year,
      newPolicies: yearTariffs.length,
      majorChanges: yearTariffs.filter(t => t.priority === 'Critical').length,
      estimatedImpact: `$${totalImpact.toFixed(1)}B`,
      keyFocus: getMajorFocus(yearTariffs),
      vesselTypesAffected: [...new Set(yearTariffs.flatMap(t => t.vesselImpact?.affectedVesselTypes || []))],
      confidenceLevel: Math.round(yearTariffs.reduce((sum, t) => sum + (t.projectionConfidence || 0), 0) / yearTariffs.length) || 0
    };
  });
}

// Compile mitigation strategies
function compileMitigationStrategies(tariffs) {
  const strategies = {};
  
  tariffs.forEach(tariff => {
    const vesselTypes = tariff.vesselImpact?.affectedVesselTypes || [];
    const mitigations = tariff.vesselImpact?.mitigationStrategies || [];
    
    vesselTypes.forEach(type => {
      if (!strategies[type]) strategies[type] = new Set();
      mitigations.forEach(strategy => strategies[type].add(strategy));
    });
  });

  return Object.entries(strategies).map(([type, strategySet]) => ({
    vesselType: type,
    strategies: Array.from(strategySet),
    priority: calculateStrategyPriority(type, tariffs),
    timelineForImplementation: getImplementationTimeline(type, tariffs),
    estimatedCost: getImplementationCost(type, tariffs)
  }));
}

// Generate detailed cost analysis
function generateCostAnalysis(tariffs, vessels) {
  const vesselCostBreakdown = vessels.map(vessel => {
    const applicableTariffs = tariffs.filter(tariff =>
      tariff.vesselImpact?.affectedVesselTypes?.includes(vessel.type)
    );

    const totalCostPerVoyage = applicableTariffs.reduce((sum, tariff) => {
      const costRange = extractCostRange(tariff.vesselImpact?.costPerVoyage || '$0');
      return sum + (costRange.min + costRange.max) / 2; // Use average
    }, 0);

    return {
      vesselId: vessel.id,
      vesselName: vessel.name,
      vesselType: vessel.type,
      currentRoute: vessel.route,
      applicablePolicies: applicableTariffs.length,
      additionalCostPerVoyage: `$${totalCostPerVoyage.toLocaleString()}`,
      annualImpact: `$${(totalCostPerVoyage * 12).toLocaleString()}`, // Assuming monthly voyages
      severity: totalCostPerVoyage > 100000 ? 'High' : totalCostPerVoyage > 25000 ? 'Medium' : 'Low'
    };
  });

  return {
    totalFleetImpact: calculateTotalFleetImpact(vesselCostBreakdown),
    vesselBreakdown: vesselCostBreakdown.slice(0, 50), // Limit for performance
    averageCostIncrease: calculateAverageIncrease(vesselCostBreakdown),
    highestImpactVessels: vesselCostBreakdown
      .sort((a, b) => parseFloat(b.additionalCostPerVoyage.replace(/[$,]/g, '')) - parseFloat(a.additionalCostPerVoyage.replace(/[$,]/g, '')))
      .slice(0, 10)
  };
}

// Helper functions
function getMostImpactedVesselType(tariffs) {
  const typeCount = {};
  tariffs.forEach(tariff => {
    (tariff.vesselImpact?.affectedVesselTypes || []).forEach(type => {
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
  });
  
  return Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Container Ship';
}

function calculateAverageCostIncrease(tariffs) {
  const costs = tariffs.map(tariff => {
    const costRange = extractCostRange(tariff.vesselImpact?.costPerVoyage || '$0');
    return (costRange.min + costRange.max) / 2;
  });
  
  const average = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
  return `$${average.toLocaleString()}/voyage`;
}

function extractCostRange(costString) {
  const numbers = costString.match(/[\d,]+/g) || ['0'];
  const cleanNumbers = numbers.map(n => parseInt(n.replace(/,/g, '')));
  
  if (cleanNumbers.length === 1) {
    return { min: cleanNumbers[0], max: cleanNumbers[0] };
  }
  
  return {
    min: Math.min(...cleanNumbers),
    max: Math.max(...cleanNumbers)
  };
}

function calculateSeverity(tariffs) {
  const criticalCount = tariffs.filter(t => t.priority === 'Critical').length;
  const highCount = tariffs.filter(t => t.priority === 'High').length;
  
  if (criticalCount > 0) return 'Critical';
  if (highCount > 1) return 'High';
  return 'Medium';
}

function calculateRouteDelay(tariffs) {
  const delayFactors = tariffs.length * 0.5; // Assume 0.5 hours delay per policy
  return `${delayFactors.toFixed(1)} hours average`;
}

function calculateRouteCostIncrease(tariffs) {
  const totalIncrease = tariffs.reduce((sum, tariff) => {
    const costRange = extractCostRange(tariff.vesselImpact?.costPerVoyage || '$0');
    return sum + (costRange.min + costRange.max) / 2;
  }, 0);
  
  return `$${totalIncrease.toLocaleString()}`;
}

function suggestAlternativeRoutes(route, tariffs) {
  const routeMap = {
    'Asia-Europe': ['Northern Sea Route', 'Suez Canal Alternative'],
    'Trans-Pacific': ['Panama Canal Route', 'Direct Pacific'],
    'Trans-Atlantic': ['Northern Route', 'Southern Route']
  };
  
  return routeMap[route] || ['Alternative routing under analysis'];
}

function calculateRouteRisk(tariffs) {
  const riskScore = tariffs.reduce((score, tariff) => {
    if (tariff.priority === 'Critical') return score + 3;
    if (tariff.priority === 'High') return score + 2;
    return score + 1;
  }, 0);
  
  if (riskScore >= 6) return 'High Risk';
  if (riskScore >= 3) return 'Medium Risk';
  return 'Low Risk';
}

function getMajorFocus(tariffs) {
  const categories = tariffs.map(t => t.category);
  const categoryCount = {};
  categories.forEach(cat => {
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });
  
  return Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Trade Policy';
}

function calculateStrategyPriority(vesselType, tariffs) {
  const typeTariffs = tariffs.filter(t => 
    t.vesselImpact?.affectedVesselTypes?.includes(vesselType)
  );
  
  const criticalCount = typeTariffs.filter(t => t.priority === 'Critical').length;
  return criticalCount > 0 ? 'Urgent' : 'Standard';
}

function getImplementationTimeline(vesselType, tariffs) {
  const typeTariffs = tariffs.filter(t => 
    t.vesselImpact?.affectedVesselTypes?.includes(vesselType)
  );
  
  const earliestDate = Math.min(...typeTariffs.map(t => new Date(t.effectiveDate).getFullYear()));
  return `${earliestDate - 2024} years preparation needed`;
}

function getImplementationCost(vesselType, tariffs) {
  const baseCosts = {
    'Container Ship': 5000000,
    'Bulk Carrier': 3000000,
    'Tanker': 8000000,
    'LNG Carrier': 12000000,
    'Car Carrier': 4000000
  };
  
  return `$${(baseCosts[vesselType] || 2000000).toLocaleString()}`;
}

function calculateTotalFleetImpact(breakdown) {
  const totalCost = breakdown.reduce((sum, vessel) => {
    const cost = parseFloat(vessel.annualImpact.replace(/[$,]/g, ''));
    return sum + cost;
  }, 0);
  
  return `$${totalCost.toLocaleString()}`;
}

function calculateAverageIncrease(breakdown) {
  const totalIncrease = breakdown.reduce((sum, vessel) => {
    const cost = parseFloat(vessel.additionalCostPerVoyage.replace(/[$,]/g, ''));
    return sum + cost;
  }, 0);
  
  const average = totalIncrease / breakdown.length;
  return `$${average.toLocaleString()}/voyage`;
}

function generateFallbackAnalysis() {
  return {
    summary: {
      totalVesselsTracked: 0,
      vesselsAffectedByTariffs: 0,
      percentageAffected: 0,
      totalEstimatedImpact: '$0B',
      criticalTariffPolicies: 0,
      mostImpactedVesselType: 'Data unavailable',
      averageCostIncrease: '$0/voyage',
      timeframe: '2025-2035'
    },
    vesselTypeImpacts: [],
    routeImpacts: [],
    timelineProjections: [],
    mitigationStrategies: [],
    costAnalysis: { totalFleetImpact: '$0', vesselBreakdown: [], averageCostIncrease: '$0/voyage', highestImpactVessels: [] },
    lastUpdate: new Date().toISOString()
  };
}

export default {
  analyzeVesselTariffImpact
};
