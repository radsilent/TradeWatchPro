// Vercel serverless function for vessels - proxies to real backend or uses real data sources
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// CORS configuration
function setCORSHeaders(req, res) {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://your-vercel-domain.vercel.app',
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
      'https://your-backend-url.herokuapp.com',  // Replace with your actual backend URL
      'https://your-railway-app.railway.app',    // Replace with your actual backend URL
      'https://your-backend.onrender.com'        // Replace with your actual backend URL
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

    // If all backends failed, use client-side impact calculation fallback
    console.log('All backends failed, using client-side fallback');
    res.status(200).json({
      vessels: [],
      total: 0,
      limit: vesselLimit,
      data_source: "Client-side fallback (backend unavailable)",
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
