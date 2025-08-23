// Vercel serverless function for diagnostic
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
    // Proxy to existing backend if available
    const BACKEND_URL = process.env.BACKEND_URL;
    
    if (BACKEND_URL) {
      console.log('Proxying diagnostic to existing backend:', BACKEND_URL);
      const response = await fetch(`${BACKEND_URL}/api/diagnostic`);
      
      if (!response.ok) {
        throw new Error(`Backend responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      res.status(200).json(data);
      return;
    }

    // If no backend, provide basic diagnostic info
    res.status(200).json({
      status: 'vercel_serverless',
      timestamp: new Date().toISOString(),
      environment: 'vercel',
      backend_configured: false,
      message: 'Running on Vercel serverless functions. Set BACKEND_URL environment variable to proxy to existing backend.',
      available_endpoints: [
        '/api/health',
        '/api/vessels',
        '/api/maritime-disruptions',
        '/api/tariffs',
        '/api/ports',
        '/api/diagnostic'
      ]
    });

  } catch (error) {
    console.error('Diagnostic API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
