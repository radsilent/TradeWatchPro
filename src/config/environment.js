// Environment configuration for TradeWatch - Cloudflare Pages optimized
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
     
  // Determine if we're on Cloudflare Pages
  IS_CLOUDFLARE: typeof window !== 'undefined' && 
    (window.location.hostname.includes('.pages.dev') || 
     window.location.hostname === 'tradewatch-frontend.pages.dev'),
};

// API URL configuration - Use Cloudflare Worker for production, local for development
if (config.IS_PRODUCTION && config.IS_CLOUDFLARE) {
  config.API_BASE_URL = 'https://tradewatch-backend.collaromatt.workers.dev';
  console.log('🌐 PRODUCTION: Using Cloudflare Worker backend with REAL AIS Stream data:', config.API_BASE_URL);
} else {
  config.API_BASE_URL = 'http://localhost:8001';
  config.FALLBACK_API_URL = 'https://tradewatch-backend.collaromatt.workers.dev';
  console.log('🌐 DEVELOPMENT: Using LOCAL backend with REAL AIS Stream data:', config.API_BASE_URL);
  console.log('🌐 FALLBACK: Cloudflare Worker available at:', config.FALLBACK_API_URL);
}

export default config;
