// Vercel serverless function for tariffs
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
    const { limit = 500 } = req.query;

    // Proxy to existing backend if available
    const BACKEND_URL = process.env.BACKEND_URL;
    
    if (BACKEND_URL) {
      console.log('Proxying tariffs to existing backend:', BACKEND_URL);
      const response = await fetch(`${BACKEND_URL}/api/tariffs?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Backend responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      res.status(200).json(data);
      return;
    }

    // If no backend URL, indicate configuration needed
    res.status(503).json({
      error: 'Service configuration required',
      message: 'Please set BACKEND_URL environment variable to proxy to your existing backend',
      endpoint: 'tariffs',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Tariffs API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
