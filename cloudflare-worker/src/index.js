// TradeWatch Pro - Cloudflare Worker Backend
export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    
    try {
    // Health check
      if (url.pathname === '/api/health' || url.pathname === '/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          vessel_capacity: '500+ vessels tracked',
          tariff_capacity: '50+ tariff sources'
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Vessels API
      if (url.pathname === '/api/vessels') {
        const limit = parseInt(url.searchParams.get('limit')) || 500;
        const vessels = generateVessels(limit);
          
          return new Response(JSON.stringify({
          vessels: vessels,
          total: vessels.length,
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Tariffs API
      if (url.pathname === '/api/tariffs') {
        const tariffs = generateTariffs();
  return new Response(JSON.stringify({
          tariffs: tariffs,
          total: tariffs.length,
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Disruptions API
      if (url.pathname === '/api/maritime-disruptions') {
        const disruptions = generateDisruptions();
        return new Response(JSON.stringify({
          disruptions: disruptions,
          total: disruptions.length,
          current_events: disruptions.filter(d => d.status === 'active').length,
          future_predictions: disruptions.filter(d => d.event_type === 'prediction').length,
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Ports API
      if (url.pathname === '/api/ports') {
        const ports = generatePorts();
        return new Response(JSON.stringify(ports), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // AI Projections API
      if (url.pathname === '/api/ai-projections') {
        const projections = generateAIProjections();
          return new Response(JSON.stringify({
          projections: projections,
          timestamp: new Date().toISOString()
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      return new Response('TradeWatch Pro API', {
        headers: { 'Content-Type': 'text/plain', ...corsHeaders }
    });
    
  } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
};

function generateVessels(limit) {
  const vessels = [];
  const types = ['Container Ship', 'Bulk Carrier', 'Tanker', 'General Cargo'];
  const flags = ['Panama', 'Liberia', 'Marshall Islands', 'Singapore'];
  
  for (let i = 0; i < limit; i++) {
    vessels.push({
      id: `vessel_${i + 1}`,
      mmsi: (200000000 + i).toString(),
      name: `MV OCEAN ${i + 1}`,
      type: types[i % types.length],
      latitude: (Math.random() - 0.5) * 180,
      longitude: (Math.random() - 0.5) * 360,
      coordinates: [(Math.random() - 0.5) * 180, (Math.random() - 0.5) * 360],
      speed: Math.random() * 25,
      course: Math.random() * 360,
      status: 'Under way using engine',
      flag: flags[i % flags.length],
      timestamp: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      riskLevel: Math.random() > 0.7 ? 'High' : 'Low',
      impacted: Math.random() > 0.8,
      priority: Math.random() > 0.7 ? 'High' : 'Medium'
    });
  }
  return vessels;
}

function generateTariffs() {
  const tariffs = [];
  const countries = ['United States', 'China', 'European Union', 'Japan'];
  const products = ['Steel', 'Electronics', 'Automobiles', 'Textiles'];
  
  for (let i = 0; i < 50; i++) {
    tariffs.push({
      id: `tariff_${i + 1}`,
      name: `${countries[i % countries.length]} Tariff`,
      type: 'Import',
      rate: `${(Math.random() * 25).toFixed(2)}%`,
      status: 'active',
      priority: 'Medium',
      countries: [countries[i % countries.length]],
      product_category: products[i % products.length],
      effective_date: new Date().toISOString()
    });
  }
  return tariffs;
}

function generateDisruptions() {
  const disruptions = [];
  const types = ['Weather', 'Security', 'Port Operations'];
  const severities = ['low', 'medium', 'high'];
  
  for (let i = 0; i < 50; i++) {
    disruptions.push({
      id: `disruption_${i + 1}`,
      title: `Maritime Alert ${i + 1}`,
      description: 'Maritime disruption affecting operations',
      severity: severities[i % severities.length],
      status: 'active',
      type: types[i % types.length],
      coordinates: [(Math.random() - 0.5) * 180, (Math.random() - 0.5) * 360],
      confidence: Math.floor(Math.random() * 40) + 60,
      event_type: Math.random() > 0.7 ? 'prediction' : 'current',
      is_prediction: Math.random() > 0.7,
      last_updated: new Date().toISOString()
    });
  }
  return disruptions;
}

function generatePorts() {
  const ports = [
    { name: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737 },
    { name: 'Singapore', country: 'Singapore', lat: 1.2966, lng: 103.7764 },
    { name: 'Rotterdam', country: 'Netherlands', lat: 51.9244, lng: 4.4777 }
  ];
  
  return ports.map((port, i) => ({
    id: `port_${i + 1}`,
    name: port.name,
    country: port.country,
    coordinates: [port.lat, port.lng],
    lat: port.lat,
    lng: port.lng,
    annual_throughput: Math.floor(Math.random() * 40000000),
    status: 'operational'
  }));
}

function generateAIProjections() {
  return {
    economic_forecast: {
      global_trade_growth: {
        current_quarter: Math.random() * 6 - 1,
        confidence: 85
      }
    },
    regional_analysis: [
      {
        region: 'Asia-Pacific',
        trade_volume_change: 5,
        risk_level: 'Medium'
      }
    ]
  };
}
