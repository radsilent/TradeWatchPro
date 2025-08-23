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
     window.location.hostname === 'trade-watch-omega.vercel.app'),
};

// API URL configuration - Use Cloudflare Worker for REAL data
// Always use Cloudflare Worker which has your real AIS Stream integration
config.API_BASE_URL = 'https://tradewatch-backend.collaromatt.workers.dev';
console.log('🌐 Using Cloudflare Worker with REAL AIS Stream data:', config.API_BASE_URL);

export default config;
