import React from 'react';

const BusinessModel = () => {
  return (
    <div className="animate-fade-in space-y-6 p-4 sm:p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
          🌊 TradeWatch Pro - Maritime Intelligence Platform
        </h1>
        <p className="text-lg text-muted-foreground">
          Professional maritime intelligence for shipping companies, traders, and logistics providers
        </p>
      </div>

      {/* Revenue Streams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            💰 Revenue Streams
          </h2>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-medium">Subscription SaaS ($99-$1,499/month)</h3>
              <p className="text-sm text-muted-foreground">
                Tiered access to real-time vessel tracking, route optimization, and disruption alerts
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-medium">API Access ($0.10-$1.00 per call)</h3>
              <p className="text-sm text-muted-foreground">
                Programmatic access to vessel positions, port data, and maritime intelligence
              </p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-medium">Custom Reports ($500-$5,000)</h3>
              <p className="text-sm text-muted-foreground">
                Bespoke maritime intelligence reports for specific routes, commodities, or regions
              </p>
            </div>
            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="font-medium">White-Label Solutions ($10,000+)</h3>
              <p className="text-sm text-muted-foreground">
                Custom-branded maritime tracking platforms for large enterprises
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            🎯 Target Markets
          </h2>
          <div className="space-y-4">
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-medium">Shipping Companies</h3>
              <p className="text-sm text-muted-foreground">
                Fleet optimization, route planning, fuel efficiency, competitive intelligence
              </p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-medium">Commodity Traders</h3>
              <p className="text-sm text-muted-foreground">
                Cargo tracking, market timing, supply chain visibility, price forecasting
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-medium">Logistics Providers</h3>
              <p className="text-sm text-muted-foreground">
                Shipment tracking, ETA predictions, disruption management, customer updates
              </p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="font-medium">Financial Services</h3>
              <p className="text-sm text-muted-foreground">
                Trade finance, insurance, risk assessment, market analysis
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Competitive Advantages */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">🚀 Competitive Advantages</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-medium">Real-Time Data</h3>
            <p className="text-sm text-muted-foreground">
              Live AIS feeds with sub-minute updates
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl mb-2">🧠</div>
            <h3 className="font-medium">AI-Powered Insights</h3>
            <p className="text-sm text-muted-foreground">
              Predictive analytics and route optimization
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl mb-2">🌐</div>
            <h3 className="font-medium">Global Coverage</h3>
            <p className="text-sm text-muted-foreground">
              Worldwide vessel tracking and port data
            </p>
          </div>
        </div>
      </div>

      {/* Market Opportunity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">📊 Market Opportunity</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Global Maritime Trade</span>
              <span className="font-semibold">$14 Trillion</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Maritime Analytics Market</span>
              <span className="font-semibold">$2.8 Billion</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Annual Growth Rate</span>
              <span className="font-semibold text-green-600">12.5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Target Addressable Market</span>
              <span className="font-semibold text-blue-600">$500 Million</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">💡 Value Propositions</h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">✓</span>
              <span className="text-sm">Reduce shipping costs by 15-25% through route optimization</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">✓</span>
              <span className="text-sm">Improve on-time delivery rates by 30% with disruption alerts</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">✓</span>
              <span className="text-sm">Increase trading profits by 10-20% with market timing insights</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">✓</span>
              <span className="text-sm">Reduce insurance premiums through better risk assessment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Implementation Roadmap */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">🗺️ Implementation Roadmap</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-lg font-semibold text-blue-600 mb-2">Phase 1</div>
            <h3 className="font-medium mb-2">MVP Launch</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Real-time vessel tracking</li>
              <li>• Basic disruption alerts</li>
              <li>• Subscription model</li>
            </ul>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-lg font-semibold text-green-600 mb-2">Phase 2</div>
            <h3 className="font-medium mb-2">Enhanced Analytics</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Route optimization</li>
              <li>• Predictive analytics</li>
              <li>• API monetization</li>
            </ul>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-lg font-semibold text-purple-600 mb-2">Phase 3</div>
            <h3 className="font-medium mb-2">Enterprise Features</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Custom reports</li>
              <li>• White-label solutions</li>
              <li>• Advanced integrations</li>
            </ul>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-lg font-semibold text-orange-600 mb-2">Phase 4</div>
            <h3 className="font-medium mb-2">Global Expansion</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Regional partnerships</li>
              <li>• Localized solutions</li>
              <li>• Market leadership</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Monetize Maritime Intelligence?</h2>
        <p className="mb-6">
          Transform this platform into a profitable SaaS business serving the $14 trillion maritime industry
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Start Free Trial
          </button>
          <button className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
            Schedule Demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessModel;
