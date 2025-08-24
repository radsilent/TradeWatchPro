import React from 'react';

function Pricing() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const pricingTiers = [
    {
      id: 'starter',
      name: 'Starter',
      price: 499,
      popular: false,
      features: [
        'Basic vessel tracking (up to 5 vessels)',
        'Port congestion alerts',
        'Basic route optimization',
        'Email support',
        'Standard API access (1000 calls/month)'
      ],
      savings: {
        monthly: 12000,
        annual: 144000,
        roi: 2400
      }
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 1499,
      popular: true,
      features: [
        'Advanced vessel tracking (up to 25 vessels)',
        'Real-time market intelligence',
        'Advanced route optimization with ML',
        'Risk assessment & insurance optimization',
        'Fuel price optimization',
        'Port efficiency optimization',
        'Priority support',
        'Advanced API access (10,000 calls/month)'
      ],
      savings: {
        monthly: 45000,
        annual: 540000,
        roi: 3000
      }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 4999,
      popular: false,
      features: [
        'Unlimited vessel tracking',
        'Full business intelligence suite',
        'AI-powered predictive analytics',
        'Custom integration & APIs',
        'Dedicated account manager',
        'White-label solutions',
        'Advanced security & compliance',
        '24/7 phone support'
      ],
      savings: {
        monthly: 150000,
        annual: 1800000,
        roi: 3000
      }
    }
  ];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Maritime Intelligence That Pays for Itself
        </h1>
        <p className="text-xl text-muted-foreground mb-6">
          Save millions in operational costs with AI-powered trade optimization
        </p>
        <div className="bg-green-100 border border-green-200 rounded-lg p-4 max-w-2xl mx-auto">
          <p className="text-green-800 font-semibold">
            💰 Average Customer Saves $2.4M Annually
          </p>
          <p className="text-green-700 text-sm mt-1">
            ROI typically achieved within 30 days
          </p>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pricingTiers.map((tier) => (
          <div
            key={tier.id}
            className={`relative bg-card border rounded-lg p-6 ${
              tier.popular ? 'border-green-200 bg-green-50 ring-2 ring-green-500 transform scale-105' : 'border-gray-200'
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">{formatCurrency(tier.price)}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              
              {/* ROI Metrics */}
              <div className="bg-white/80 rounded-lg p-3 mb-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Monthly Savings</p>
                    <p className="font-bold text-green-600">{formatCurrency(tier.savings.monthly)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ROI</p>
                    <p className="font-bold text-green-600">{tier.savings.roi}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payback</p>
                    <p className="font-bold">Immediate</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Annual Savings</p>
                    <p className="font-bold text-green-600">{formatCurrency(tier.savings.annual)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-6">
              {tier.features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                tier.popular
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {tier.id === 'enterprise' ? 'Contact Sales' : 'Start Free Trial'}
            </button>
            
            <p className="text-center text-sm text-green-600 mt-2 font-medium">
              🚀 {tier.savings.roi}% ROI - Exceptional Value!
            </p>
          </div>
        ))}
      </div>

      {/* Value Proposition */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border rounded-lg p-8">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold mb-2">Why TradeWatch Pro Pays for Itself</h3>
          <p className="text-muted-foreground">Real savings from real customers</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">15%</div>
            <div className="font-semibold mb-1">Fuel Cost Reduction</div>
            <div className="text-sm text-muted-foreground">Through optimized routing and bunkering strategies</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">25%</div>
            <div className="font-semibold mb-1">Port Efficiency Gain</div>
            <div className="text-sm text-muted-foreground">Reduced waiting times and optimized scheduling</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">30 Days</div>
            <div className="font-semibold mb-1">Average Payback</div>
            <div className="text-sm text-muted-foreground">Most customers see ROI within first month</div>
          </div>
        </div>
      </div>

      {/* Enterprise Contact */}
      <div className="bg-card border rounded-lg p-6 text-center">
        <h3 className="text-xl font-semibold mb-2">Need a Custom Solution?</h3>
        <p className="text-muted-foreground mb-4">
          Large fleets, custom integrations, or specialized requirements? Let's talk.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
            Schedule Demo
          </button>
          <button className="px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary/10">
            Contact Sales
          </button>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          💬 Speak with our maritime experts • 📊 Custom ROI analysis • 🚀 Implementation support
        </p>
      </div>
    </div>
  );
}

export default Pricing;
