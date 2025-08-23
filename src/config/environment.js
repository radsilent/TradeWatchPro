// Environment configuration for TradeWatch - Vercel optimized
const config = {
  // Environment detection
  ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT || 'development',
  
  // Feature flags
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  
  // Determine if we're in production by checking if we're running on a deployed domain
  IS_PRODUCTION: typeof window !== 'undefined' && 
    (window.location.hostname !== 'localhost' && 
     window.location.hostname !== '127.0.0.1' &&
     !window.location.hostname.includes('192.168')),
     
  // Determine if we're on Vercel
  IS_VERCEL: typeof window !== 'undefined' && 
    (window.location.hostname.includes('.vercel.app') || 
     window.location.hostname.includes('your-custom-domain.com')),
};

// API URL configuration - simple production fix
if (config.IS_PRODUCTION) {
  // In production, use relative paths to Vercel API functions
  config.API_BASE_URL = '';
  console.log('🌐 Production mode detected, using relative API paths');
} else {
  // Development mode - use localhost backend
  config.API_BASE_URL = 'http://localhost:8001';
  console.log('🛠️ Development mode, using API URL:', config.API_BASE_URL);
}

export default config;
