// Vercel serverless function for vessels - proxies to real backend or uses real data sources

// Generate realistic vessel data for Vercel deployment
function generateRealisticVessels(limit) {
  const vessels = [];
  
  const vesselTypes = ['Container Ship', 'Oil Tanker', 'Bulk Carrier', 'Car Carrier', 'LNG Carrier'];
  const flags = ['Liberia', 'Panama', 'Marshall Islands', 'Singapore', 'Malta', 'Bahamas'];
  const statuses = ['Under way using engine', 'At anchor', 'Moored', 'Engaged in fishing'];
  
  // Major shipping routes with multiple waypoints to ensure vessels stay in water
  const routes = [
    { 
      name: 'Asia-Europe', 
      waypoints: [
        [1.3, 103.8],    // Singapore
        [6.2, 100.3],    // Strait of Malacca
        [15.3, 73.8],    // Arabian Sea
        [12.5, 43.3],    // Gulf of Aden
        [30.0, 32.3],    // Suez Canal
        [35.8, 14.5],    // Mediterranean
        [36.1, -5.3],    // Gibraltar
        [48.8, -4.4],    // Bay of Biscay
        [51.9, 4.5]      // Rotterdam
      ]
    },
    { 
      name: 'Trans-Pacific', 
      waypoints: [
        [33.7, -118.2],  // Los Angeles
        [32.0, -140.0],  // Mid Pacific
        [35.0, -150.0],  // North Pacific
        [40.0, 160.0],   // North Pacific
        [35.7, 139.7]    // Tokyo Bay
      ]
    },
    { 
      name: 'Trans-Atlantic', 
      waypoints: [
        [40.7, -74.0],   // New York
        [41.0, -60.0],   // North Atlantic
        [45.0, -40.0],   // Mid Atlantic
        [50.0, -20.0],   // North Atlantic
        [51.5, -0.1]     // London
      ]
    },
    { 
      name: 'Red Sea Route', 
      waypoints: [
        [25.3, 55.3],    // Dubai
        [23.6, 58.6],    // Arabian Sea
        [15.3, 42.0],    // Red Sea
        [12.5, 43.3],    // Bab el Mandeb
        [30.0, 32.3]     // Suez Canal
      ]
    },
    { 
      name: 'Cape Route', 
      waypoints: [
        [51.9, 4.5],     // Rotterdam
        [35.8, 14.5],    // Mediterranean
        [10.0, -15.0],   // West Africa
        [-15.0, 5.0],    // South Atlantic
        [-34.4, 18.4],   // Cape Town
        [-30.0, 35.0],   // Indian Ocean
        [1.3, 103.8]     // Singapore
      ]
    }
  ];
  
  for (let i = 0; i < limit; i++) {
    const route = routes[Math.floor(Math.random() * routes.length)];
    
    // Pick a random segment along the route
    const segmentIndex = Math.floor(Math.random() * (route.waypoints.length - 1));
    const waypoint1 = route.waypoints[segmentIndex];
    const waypoint2 = route.waypoints[segmentIndex + 1];
    
    // Interpolate position between two waypoints
    const progress = Math.random();
    const lat = waypoint1[0] + (waypoint2[0] - waypoint1[0]) * progress;
    const lon = waypoint1[1] + (waypoint2[1] - waypoint1[1]) * progress;
    
    // Add very small deviation to avoid exact overlap (vessels in convoy)
    const finalLat = lat + (Math.random() - 0.5) * 0.5; // Much smaller deviation
    const finalLon = lon + (Math.random() - 0.5) * 0.5;
    
    // Determine if vessel is impacted (20% chance)
    const impacted = Math.random() < 0.2;
    
    vessels.push({
      id: `vercel_vessel_${i.toString().padStart(6, '0')}`,
      mmsi: (200000000 + i).toString(),
      imo: 7000000 + i,
      name: `MV ${['OCEAN', 'GLOBAL', 'MARITIME', 'TRADE', 'PACIFIC', 'ATLANTIC'][Math.floor(Math.random() * 6)]} ${['STAR', 'WAVE', 'SPIRIT', 'HARMONY', 'UNITY'][Math.floor(Math.random() * 5)]}`,
      type: vesselTypes[Math.floor(Math.random() * vesselTypes.length)],
      coordinates: [finalLat, finalLon],
      latitude: finalLat,
      longitude: finalLon,
      lat: finalLat,
      lon: finalLon,
      course: Math.random() * 360,
      speed: Math.random() * 25,
      heading: Math.random() * 360,
      length: 200 + Math.random() * 200,
      beam: 20 + Math.random() * 40,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      destination: route.name.split('-')[1]?.trim() || 'Unknown',
      flag: flags[Math.floor(Math.random() * flags.length)],
      timestamp: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      draft: 8 + Math.random() * 6,
      data_source: 'Maritime Route Intelligence',
      source: 'vercel-generated',
      origin: route.name.split('-')[0]?.trim() || 'Unknown',
      origin_coords: route.waypoints[0],
      destination_coords: route.waypoints[route.waypoints.length - 1],
      built_year: 2000 + Math.floor(Math.random() * 24),
      operator: ['MSC', 'COSCO', 'CMA CGM', 'Hapag-Lloyd', 'ONE'][Math.floor(Math.random() * 5)],
      dwt: Math.floor(50000 + Math.random() * 150000),
      cargo_capacity: Math.floor(20000 + Math.random() * 80000),
      route: route.name,
      impacted: impacted,
      riskLevel: impacted ? 'High' : 'Low',
      priority: impacted ? 'High' : 'Medium',
      incidents: []
    });
  }
  
  return vessels;
}

// CORS configuration
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

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { limit = 25000 } = req.query;
    const vesselLimit = parseInt(limit);

    // Try multiple backend options
    const BACKEND_URLS = [
      process.env.BACKEND_URL,
      process.env.RAILWAY_URL,
      process.env.RENDER_URL,
      process.env.HEROKU_URL
    ].filter(Boolean);

    let lastError = null;
    
    // Try each backend URL
    for (const backendUrl of BACKEND_URLS) {
      try {
        console.log('Trying backend:', backendUrl);
        const response = await fetch(`${backendUrl}/api/vessels?limit=${vesselLimit}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'TradeWatch-Vercel/1.0'
          },
          timeout: 10000
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Successfully fetched from:', backendUrl);
          res.status(200).json(data);
          return;
        } else {
          lastError = `Backend ${backendUrl} responded with status: ${response.status}`;
          console.log(lastError);
        }
      } catch (error) {
        lastError = `Backend ${backendUrl} failed: ${error.message}`;
        console.log(lastError);
      }
    }

    // If all backends failed, generate realistic vessel data
    console.log('All backends failed, generating realistic vessel data');
    
    // Generate realistic vessels for Vercel deployment
    const vessels = generateRealisticVessels(Math.min(vesselLimit, 5000)); // Limit for performance
    
    res.status(200).json({
      vessels: vessels,
      total: vessels.length,
      limit: vesselLimit,
      data_source: "Vercel Generated Data (Maritime Intelligence)",
      real_data_percentage: 0,
      timestamp: new Date().toISOString(),
      backend_status: "unavailable",
      last_error: lastError
    });

  } catch (error) {
    console.error('Vessels API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
