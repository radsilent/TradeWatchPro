// Subscription & Monetization Service
// Handles pricing tiers, billing, and revenue optimization

class SubscriptionService {
  constructor() {
    this.apiKey = process.env.REACT_APP_STRIPE_KEY || 'demo_key';
    this.baseURL = 'https://api.tradewatch.pro/v1/billing';
    this.pricingTiers = this.initializePricingTiers();
  }

  initializePricingTiers() {
    return {
      starter: {
        id: 'starter',
        name: 'Starter',
        price: 499,
        billingPeriod: 'monthly',
        features: [
          'Basic vessel tracking (up to 5 vessels)',
          'Port congestion alerts',
          'Basic route optimization',
          'Email support',
          'Standard API access (1000 calls/month)'
        ],
        limits: {
          vessels: 5,
          apiCalls: 1000,
          routes: 10,
          users: 2
        },
        savings: {
          fuelOptimization: 8,
          timeOptimization: 5,
          costReduction: 12000 // monthly
        }
      },
      professional: {
        id: 'professional',
        name: 'Professional',
        price: 1499,
        billingPeriod: 'monthly',
        features: [
          'Advanced vessel tracking (up to 25 vessels)',
          'Real-time market intelligence',
          'Advanced route optimization with ML',
          'Risk assessment & insurance optimization',
          'Fuel price optimization',
          'Port efficiency optimization',
          'Priority support',
          'Advanced API access (10,000 calls/month)',
          'Custom alerts & notifications',
          'Competitive intelligence reports'
        ],
        limits: {
          vessels: 25,
          apiCalls: 10000,
          routes: 100,
          users: 10
        },
        savings: {
          fuelOptimization: 15,
          timeOptimization: 12,
          costReduction: 45000 // monthly
        },
        popular: true
      },
      enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: 4999,
        billingPeriod: 'monthly',
        features: [
          'Unlimited vessel tracking',
          'Full business intelligence suite',
          'AI-powered predictive analytics',
          'Custom integration & APIs',
          'Dedicated account manager',
          'White-label solutions',
          'Advanced security & compliance',
          'Custom reporting & dashboards',
          'Real-time data feeds',
          'Priority API access (unlimited)',
          '24/7 phone support',
          'Training & onboarding'
        ],
        limits: {
          vessels: 'unlimited',
          apiCalls: 'unlimited',
          routes: 'unlimited',
          users: 'unlimited'
        },
        savings: {
          fuelOptimization: 22,
          timeOptimization: 18,
          costReduction: 150000 // monthly
        }
      },
      api: {
        id: 'api',
        name: 'API Access',
        price: 0.05, // per API call
        billingPeriod: 'usage',
        features: [
          'Pay-per-use API access',
          'Real-time vessel data',
          'Route optimization endpoints',
          'Market intelligence data',
          'Risk assessment APIs',
          'Port information APIs'
        ],
        limits: {
          vessels: 'unlimited',
          apiCalls: 'pay-per-use',
          routes: 'unlimited',
          users: 'unlimited'
        }
      }
    };
  }

  // Calculate ROI for each pricing tier
  calculateROI(tier, customerProfile) {
    const { vessels, monthlyRoutes, avgRouteValue } = customerProfile;
    const pricing = this.pricingTiers[tier];
    
    if (!pricing) return null;

    const monthlyCost = pricing.price;
    const avgSavingsPerRoute = avgRouteValue * (pricing.savings.fuelOptimization / 100);
    const monthlySavings = monthlyRoutes * avgSavingsPerRoute * vessels;
    const netSavings = monthlySavings - monthlyCost;
    const roi = (netSavings / monthlyCost) * 100;
    const paybackDays = Math.ceil(monthlyCost / (monthlySavings / 30));

    return {
      tier,
      monthlyCost,
      monthlySavings: Math.round(monthlySavings),
      netSavings: Math.round(netSavings),
      roi: Math.round(roi),
      paybackDays,
      annualSavings: Math.round(netSavings * 12),
      breakEvenPoint: paybackDays <= 30 ? 'Immediate' : `${paybackDays} days`
    };
  }

  // Get pricing recommendation based on customer profile
  getRecommendedTier(customerProfile) {
    const { vessels, monthlyRoutes, companySize, budget } = customerProfile;
    
    if (vessels <= 5 && monthlyRoutes <= 20 && companySize === 'small') {
      return 'starter';
    } else if (vessels <= 25 && monthlyRoutes <= 100 && budget < 5000) {
      return 'professional';
    } else {
      return 'enterprise';
    }
  }

  // Calculate potential savings for sales presentations
  calculatePotentialSavings(customerProfile) {
    const { vessels, annualFuelCost, annualOperatingCost, routes } = customerProfile;
    
    const fuelSavings = annualFuelCost * 0.15; // 15% fuel savings
    const operationalSavings = annualOperatingCost * 0.08; // 8% operational savings
    const timeSavings = routes * 12 * 2000; // $2k per route time savings
    const riskReduction = annualOperatingCost * 0.03; // 3% risk reduction savings
    
    const totalSavings = fuelSavings + operationalSavings + timeSavings + riskReduction;
    
    return {
      fuelSavings: Math.round(fuelSavings),
      operationalSavings: Math.round(operationalSavings),
      timeSavings: Math.round(timeSavings),
      riskReduction: Math.round(riskReduction),
      totalSavings: Math.round(totalSavings),
      breakdown: {
        'Fuel Optimization': Math.round(fuelSavings),
        'Operational Efficiency': Math.round(operationalSavings),
        'Time Savings': Math.round(timeSavings),
        'Risk Mitigation': Math.round(riskReduction)
      }
    };
  }

  // API monetization - calculate usage costs
  calculateAPIUsage(calls, endpoints) {
    const baseCostPerCall = 0.05;
    const premiumEndpoints = ['route-optimization', 'market-intelligence', 'risk-assessment'];
    
    let totalCost = 0;
    
    endpoints.forEach(endpoint => {
      const callsForEndpoint = calls[endpoint] || 0;
      const multiplier = premiumEndpoints.includes(endpoint) ? 2 : 1;
      totalCost += callsForEndpoint * baseCostPerCall * multiplier;
    });
    
    return {
      totalCalls: Object.values(calls).reduce((sum, count) => sum + count, 0),
      totalCost: Math.round(totalCost * 100) / 100,
      breakdown: endpoints.map(endpoint => ({
        endpoint,
        calls: calls[endpoint] || 0,
        cost: Math.round((calls[endpoint] || 0) * baseCostPerCall * (premiumEndpoints.includes(endpoint) ? 2 : 1) * 100) / 100
      }))
    };
  }

  // Enterprise custom pricing
  calculateEnterprisePricing(requirements) {
    const {
      vessels,
      apiCalls,
      customFeatures,
      supportLevel,
      dataVolume,
      integrations
    } = requirements;
    
    let baseCost = 4999; // Base enterprise price
    
    // Scale with vessel count
    if (vessels > 100) {
      baseCost += (vessels - 100) * 25;
    }
    
    // API usage scaling
    if (apiCalls > 50000) {
      baseCost += Math.ceil((apiCalls - 50000) / 10000) * 500;
    }
    
    // Custom features
    const customFeatureCosts = {
      'white-label': 2000,
      'custom-integration': 3000,
      'dedicated-infrastructure': 5000,
      'advanced-analytics': 1500,
      'real-time-streaming': 2500
    };
    
    customFeatures.forEach(feature => {
      baseCost += customFeatureCosts[feature] || 1000;
    });
    
    // Support level
    const supportCosts = {
      'standard': 0,
      'priority': 1000,
      'dedicated': 3000,
      '24x7': 5000
    };
    
    baseCost += supportCosts[supportLevel] || 0;
    
    return {
      baseCost,
      monthlyPrice: baseCost,
      annualPrice: baseCost * 12 * 0.9, // 10% annual discount
      breakdown: {
        base: 4999,
        vesselScaling: vessels > 100 ? (vessels - 100) * 25 : 0,
        apiScaling: apiCalls > 50000 ? Math.ceil((apiCalls - 50000) / 10000) * 500 : 0,
        customFeatures: customFeatures.reduce((sum, feature) => sum + (customFeatureCosts[feature] || 1000), 0),
        support: supportCosts[supportLevel] || 0
      }
    };
  }

  // Revenue projections for business planning
  calculateRevenueProjections(customerBase) {
    const projections = {
      monthly: 0,
      annual: 0,
      breakdown: {}
    };
    
    Object.entries(customerBase).forEach(([tier, count]) => {
      const tierPricing = this.pricingTiers[tier];
      if (tierPricing && tierPricing.billingPeriod === 'monthly') {
        const monthlyRevenue = tierPricing.price * count;
        projections.monthly += monthlyRevenue;
        projections.annual += monthlyRevenue * 12;
        projections.breakdown[tier] = {
          customers: count,
          monthlyRevenue,
          annualRevenue: monthlyRevenue * 12
        };
      }
    });
    
    return projections;
  }

  // Churn prediction and retention strategies
  analyzeChurnRisk(customerData) {
    const {
      usageMetrics,
      supportTickets,
      lastLogin,
      featureAdoption,
      billingHistory
    } = customerData;
    
    let churnScore = 0;
    
    // Usage decline
    if (usageMetrics.trend < -20) churnScore += 30;
    else if (usageMetrics.trend < -10) churnScore += 15;
    
    // Support issues
    if (supportTickets > 5) churnScore += 20;
    
    // Login frequency
    const daysSinceLogin = (Date.now() - new Date(lastLogin)) / (1000 * 60 * 60 * 24);
    if (daysSinceLogin > 14) churnScore += 25;
    else if (daysSinceLogin > 7) churnScore += 10;
    
    // Feature adoption
    if (featureAdoption < 30) churnScore += 20;
    
    // Payment issues
    if (billingHistory.failedPayments > 0) churnScore += 15;
    
    const riskLevel = churnScore > 60 ? 'High' : churnScore > 30 ? 'Medium' : 'Low';
    
    const retentionStrategies = {
      High: [
        'Immediate account manager outreach',
        'Offer custom training session',
        'Provide usage optimization consultation',
        'Consider pricing adjustment or feature upgrade'
      ],
      Medium: [
        'Send feature adoption guide',
        'Schedule check-in call',
        'Offer additional support resources'
      ],
      Low: [
        'Continue regular engagement',
        'Share success stories and best practices'
      ]
    };
    
    return {
      churnScore,
      riskLevel,
      retentionStrategies: retentionStrategies[riskLevel],
      recommendedActions: this.getRetentionActions(churnScore, customerData)
    };
  }

  getRetentionActions(churnScore, customerData) {
    const actions = [];
    
    if (churnScore > 50) {
      actions.push('Schedule executive review call within 48 hours');
      actions.push('Offer 30% discount on next billing cycle');
    }
    
    if (customerData.usageMetrics.trend < -15) {
      actions.push('Provide usage optimization workshop');
      actions.push('Assign dedicated customer success manager');
    }
    
    if (customerData.supportTickets > 3) {
      actions.push('Escalate to senior support team');
      actions.push('Offer premium support upgrade at no cost');
    }
    
    return actions;
  }

  // Upselling opportunities
  identifyUpsellOpportunities(customerProfile) {
    const { currentTier, usage, features } = customerProfile;
    const opportunities = [];
    
    // Usage-based upselling
    if (usage.vessels > this.pricingTiers[currentTier].limits.vessels * 0.8) {
      opportunities.push({
        type: 'tier_upgrade',
        reason: 'Approaching vessel limit',
        recommendation: 'Upgrade to next tier for unlimited vessels',
        value: 'Avoid overage charges and unlock advanced features'
      });
    }
    
    if (usage.apiCalls > this.pricingTiers[currentTier].limits.apiCalls * 0.9) {
      opportunities.push({
        type: 'api_upgrade',
        reason: 'High API usage',
        recommendation: 'Upgrade API plan or switch to unlimited tier',
        value: 'Better rate per call and priority access'
      });
    }
    
    // Feature-based upselling
    const advancedFeatures = ['market-intelligence', 'risk-assessment', 'competitive-analysis'];
    const unusedFeatures = advancedFeatures.filter(feature => !features.includes(feature));
    
    if (unusedFeatures.length > 0) {
      opportunities.push({
        type: 'feature_adoption',
        reason: 'Underutilized features',
        recommendation: `Activate ${unusedFeatures.join(', ')} for additional savings`,
        value: 'Potential 15-25% additional cost savings'
      });
    }
    
    return opportunities;
  }

  // Mock subscription management
  async createSubscription(customerId, tierData) {
    try {
      // In production, this would integrate with Stripe or similar
      const subscription = {
        id: `sub_${Date.now()}`,
        customerId,
        tier: tierData.tier,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        amount: this.pricingTiers[tierData.tier].price,
        currency: 'USD'
      };
      
      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Get all pricing tiers
  getPricingTiers() {
    return this.pricingTiers;
  }

  // Get specific tier details
  getTierDetails(tierId) {
    return this.pricingTiers[tierId];
  }
}

export default new SubscriptionService();
