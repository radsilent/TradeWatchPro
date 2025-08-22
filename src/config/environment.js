// Environment configuration for TradeWatch
export const config = {
  // API Base URL - defaults to localhost for development
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001',
  
  // Environment detection
  ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT || 'development',
  
  // Feature flags
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  
  // Determine if we're in production by checking if we're running on a deployed domain
  IS_PRODUCTION: typeof window !== 'undefined' && 
    (window.location.hostname !== 'localhost' && 
     window.location.hostname !== '127.0.0.1' &&
     !window.location.hostname.includes('192.168')),
};

// Production API URL detection
if (config.IS_PRODUCTION) {
  // In production, try to use the same domain but with /api prefix
  config.API_BASE_URL = `${window.location.origin}/api`;
  console.log('🌐 Production mode detected, using API URL:', config.API_BASE_URL);
} else {
  console.log('🛠️ Development mode, using API URL:', config.API_BASE_URL);
}

export default config;
