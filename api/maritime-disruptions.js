// Vercel serverless function for maritime disruptions

// Generate realistic maritime disruption data
function generateRealisticDisruptions(limit) {
  const disruptions = [];
  
  const disruptionTypes = ['Weather', 'Piracy', 'Port Strike', 'Geopolitical', 'Technical', 'Security'];
  const severities = ['high', 'medium', 'low', 'critical'];
  const regions = ['Red Sea', 'Suez Canal', 'South China Sea', 'Persian Gulf', 'Strait of Hormuz', 'Panama Canal', 'Gulf of Guinea', 'Mediterranean'];
  
  // High-impact maritime locations
  const locations = [
    { name: 'Suez Canal', coords: [30.0, 32.0] },
    { name: 'Strait of Hormuz', coords: [26.0, 56.0] },
    { name: 'South China Sea', coords: [15.0, 115.0] },
    { name: 'Panama Canal', coords: [9.0, -79.5] },
    { name: 'Red Sea', coords: [20.0, 38.0] },
    { name: 'Gulf of Guinea', coords: [5.0, 2.0] },
    { name: 'Strait of Malacca', coords: [3.0, 102.0] },
    { name: 'English Channel', coords: [50.5, 1.0] },
    { name: 'Gibraltar Strait', coords: [36.0, -5.5] },
    { name: 'Bosphorus', coords: [41.0, 29.0] }
  ];
  
  const eventTemplates = [
    'Severe weather conditions affecting shipping lanes',
    'Port congestion causing delays at major terminal',
    'Piracy incidents reported in shipping corridor',
    'Geopolitical tensions disrupting trade routes',
    'Labor strikes at container terminal facilities',
    'Navigation restrictions due to military exercises',
    'Cyber security incident affecting port operations',
    'Equipment failures causing terminal shutdowns',
    'Oil spill cleanup affecting vessel movements',
    'Bridge closure impacting shipping schedules'
  ];
  
  for (let i = 0; i < limit; i++) {
    const location = locations[Math.floor(Math.random() * locations.length)];
    const eventTemplate = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    
    // Add some coordinate variation
    const lat = location.coords[0] + (Math.random() - 0.5) * 4;
    const lon = location.coords[1] + (Math.random() - 0.5) * 4;
    
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - Math.random() * 72); // Started 0-72 hours ago
    
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 12 + Math.random() * 48); // Lasts 12-60 hours
    
    disruptions.push({
      id: `vercel_disruption_${i.toString().padStart(4, '0')}`,
      title: `${location.name}: ${eventTemplate}`,
      description: `Maritime disruption affecting ${location.name} shipping operations. ${eventTemplate} causing potential delays and route diversions for commercial vessels.`,
      severity: severity,
      status: 'active',
      type: disruptionTypes[Math.floor(Math.random() * disruptionTypes.length)],
      coordinates: [lat, lon],
      affected_regions: [location.name, regions[Math.floor(Math.random() * regions.length)]],
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      created_date: startDate.toISOString(),
      source_url: 'https://vercel-maritime-intelligence.com',
      confidence: 80 + Math.random() * 20,
      last_updated: new Date().toISOString(),
      category: disruptionTypes[Math.floor(Math.random() * disruptionTypes.length)],
      event_type: 'current',
      is_prediction: false,
      quality_score: Math.floor(3 + Math.random() * 2) // 3-4
    });
  }
  
  return disruptions;
}

function setCORSHeaders(req, res) {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://trade-watch-omega.vercel.app',
    'https://your-custom-domain.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175'
  ];

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export default async function handler(req, res) {
  setCORSHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { limit = 250 } = req.query;

    // Proxy to existing backend if available
    const BACKEND_URL = process.env.BACKEND_URL;
    
    if (BACKEND_URL) {
      console.log('Proxying disruptions to existing backend:', BACKEND_URL);
      const response = await fetch(`${BACKEND_URL}/api/maritime-disruptions?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Backend responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      res.status(200).json(data);
      return;
    }

    // Generate realistic disruption data
    const disruptions = generateRealisticDisruptions(parseInt(limit));
    
    res.status(200).json({
      disruptions: disruptions,
      total: disruptions.length,
      timestamp: new Date().toISOString(),
      data_source: "Vercel Generated Maritime Intelligence"
    });

  } catch (error) {
    console.error('Maritime disruptions API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
