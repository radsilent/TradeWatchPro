import React from 'react';

function Pricing() {
  const plans = [
    {
      name: 'Basic',
      price: '$99',
      period: 'per month',
      description: 'Perfect for small shipping operations',
      features: [
        '1,000 vessels tracked',
        'Basic alerts and notifications',
        'Standard reporting',
        'Email support',
        '30-day data retention'
      ],
      color: 'blue',
      popular: false
    },
    {
      name: 'Professional',
      price: '$299',
      period: 'per month',
      description: 'Ideal for medium-sized maritime businesses',
      features: [
        '10,000 vessels tracked',
        'Advanced AI insights',
        'Real-time disruption alerts',
        'Custom reporting',
        'Priority support',
        '90-day data retention',
        'API access'
      ],
      color: 'green',
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$1,499',
      period: 'per month',
      description: 'For large maritime enterprises',
      features: [
        'Unlimited vessels tracked',
        'Full AI-powered analytics',
        'Custom integrations',
        'Dedicated account manager',
        '24/7 phone support',
        'Unlimited data retention',
        'White-label options',
        'SLA guarantees'
      ],
      color: 'purple',
      popular: false
    }
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Scale your maritime intelligence with plans designed for every business size
        </p>
      </div>

      {/* ROI Calculator */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-center">💰 Potential ROI</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600">5-15%</div>
            <div className="text-sm text-muted-foreground">Potential Cost Reduction</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600">10%</div>
            <div className="text-sm text-muted-foreground">Operational Efficiency Gain</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">3-6x</div>
            <div className="text-sm text-muted-foreground">Potential ROI Multiple</div>
          </div>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`relative bg-card rounded-lg border p-6 ${
              plan.popular ? 'ring-2 ring-green-500 shadow-lg' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-2">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground ml-2">{plan.period}</span>
              </div>
              <p className="text-muted-foreground">{plan.description}</p>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                plan.popular
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              Get Started
            </button>
          </div>
        ))}
      </div>

      {/* Features Comparison */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-2xl font-semibold mb-6 text-center">Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Feature</th>
                <th className="text-center p-3">Basic</th>
                <th className="text-center p-3">Professional</th>
                <th className="text-center p-3">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-3">Vessel Tracking</td>
                <td className="text-center p-3">1,000</td>
                <td className="text-center p-3">10,000</td>
                <td className="text-center p-3">Unlimited</td>
              </tr>
              <tr className="border-b">
                <td className="p-3">Real-time Alerts</td>
                <td className="text-center p-3">✓</td>
                <td className="text-center p-3">✓</td>
                <td className="text-center p-3">✓</td>
              </tr>
              <tr className="border-b">
                <td className="p-3">AI Analytics</td>
                <td className="text-center p-3">Basic</td>
                <td className="text-center p-3">Advanced</td>
                <td className="text-center p-3">Full Suite</td>
              </tr>
              <tr className="border-b">
                <td className="p-3">API Access</td>
                <td className="text-center p-3">-</td>
                <td className="text-center p-3">✓</td>
                <td className="text-center p-3">✓</td>
              </tr>
              <tr className="border-b">
                <td className="p-3">Custom Integrations</td>
                <td className="text-center p-3">-</td>
                <td className="text-center p-3">-</td>
                <td className="text-center p-3">✓</td>
              </tr>
              <tr className="border-b">
                <td className="p-3">Support</td>
                <td className="text-center p-3">Email</td>
                <td className="text-center p-3">Priority</td>
                <td className="text-center p-3">24/7 Phone</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-2xl font-semibold mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">How does the vessel tracking work?</h3>
            <p className="text-muted-foreground">
              We integrate with real-time AIS data streams to provide live vessel positions, 
              speeds, and status updates for maritime vessels worldwide.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">What kind of ROI can I expect?</h3>
            <p className="text-muted-foreground">
              Maritime companies typically see 5-15% reduction in operational costs through 
              better route planning, early disruption detection, and improved decision making.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Can I upgrade or downgrade my plan?</h3>
            <p className="text-muted-foreground">
              Yes, you can change your plan at any time. Upgrades take effect immediately, 
              and downgrades take effect at the next billing cycle.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Maritime Operations?</h2>
        <p className="text-xl mb-6">
          Join maritime companies improving their operations with TradeWatch Pro
        </p>
        <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
          Start Free Trial
        </button>
      </div>
    </div>
  );
}

export default Pricing;