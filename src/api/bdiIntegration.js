// Baltic Dry Index real-time data integration
// Uses free APIs and web scraping to get current BDI data

const BDI_SOURCES = [
  {
    name: 'Trading Economics',
    url: 'https://tradingeconomics.com/commodity/baltic',
    type: 'scrape'
  },
  {
    name: 'MarketWatch',
    url: 'https://www.marketwatch.com/investing/index/bdi',
    type: 'scrape'
  },
  {
    name: 'Investing.com',
    url: 'https://www.investing.com/indices/baltic-dry',
    type: 'scrape'
  }
];

// Cache system for BDI data
const cache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache for BDI

function getCachedBDI() {
  const cached = cache.get('bdi_data');
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedBDI(data) {
  cache.set('bdi_data', { data, timestamp: Date.now() });
}

// Proxy function for CORS
async function fetchWithProxy(url) {
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000 // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.contents;
  } catch (error) {
    console.log(`Proxy fetch failed for ${url}:`, error.message);
    throw error;
  }
}

// Parse BDI value from Trading Economics page
function parseTradingEconomics(html) {
  try {
    // Look for BDI value in common patterns
    const patterns = [
      /Baltic Dry.*?(\d{3,4})/i,
      /BDI.*?(\d{3,4})/i,
      /"price":\s*(\d{3,4})/,
      /current.*?(\d{3,4})/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        const value = parseInt(match[1]);
        if (value > 500 && value < 5000) { // Reasonable BDI range
          return value;
        }
      }
    }
  } catch (error) {
    console.log('Error parsing Trading Economics BDI:', error);
  }
  return null;
}

// Parse BDI from MarketWatch
function parseMarketWatch(html) {
  try {
    const patterns = [
      /class="value".*?(\d{1,4}(?:,\d{3})*)/,
      /data-module="MW.StreamingChart".*?(\d{3,4})/,
      /BDI.*?(\d{3,4})/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        const value = parseInt(match[1].replace(/,/g, ''));
        if (value > 500 && value < 5000) {
          return value;
        }
      }
    }
  } catch (error) {
    console.log('Error parsing MarketWatch BDI:', error);
  }
  return null;
}

// Parse BDI from Investing.com
function parseInvesting(html) {
  try {
    const patterns = [
      /data-test="instrument-price-last".*?(\d{1,4}(?:,\d{3})*)/,
      /class="text-2xl".*?(\d{3,4})/,
      /Baltic.*?(\d{3,4})/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        const value = parseInt(match[1].replace(/,/g, ''));
        if (value > 500 && value < 5000) {
          return value;
        }
      }
    }
  } catch (error) {
    console.log('Error parsing Investing.com BDI:', error);
  }
  return null;
}

// Fetch current BDI from multiple sources
export async function fetchCurrentBDI() {
  const cached = getCachedBDI();
  if (cached) {
    console.log('Returning cached BDI data:', cached.value);
    return cached;
  }

  console.log('Fetching real-time Baltic Dry Index...');
  
  const results = [];
  
  // Try each source
  for (const source of BDI_SOURCES) {
    try {
      console.log(`Fetching BDI from ${source.name}...`);
      const html = await fetchWithProxy(source.url);
      
      let value = null;
      if (source.name === 'Trading Economics') {
        value = parseTradingEconomics(html);
      } else if (source.name === 'MarketWatch') {
        value = parseMarketWatch(html);
      } else if (source.name === 'Investing.com') {
        value = parseInvesting(html);
      }
      
      if (value) {
        results.push({ source: source.name, value });
        console.log(`✅ Got BDI ${value} from ${source.name}`);
      }
    } catch (error) {
      console.log(`❌ Failed to fetch BDI from ${source.name}:`, error.message);
    }
  }
  
  // Calculate consensus value - NO HARDCODED FALLBACKS
  if (results.length === 0) {
    console.log('❌ No BDI data available from any source');
    
    // Try to return last known cached value if available
    const lastKnown = cache.get('bdi_last_known');
    if (lastKnown && lastKnown.data) {
      console.log('🔄 Using last known BDI value from cache');
      return lastKnown.data;
    }
    
    return null;
  }
  
  // Use median of all successful results
  const values = results.map(r => r.value).sort((a, b) => a - b);
  const finalBDI = values[Math.floor(values.length / 2)];
  console.log(`✅ BDI consensus from ${results.length} sources: ${finalBDI}`);
  
  // Get previous value from cache or calculate from trend
  const cachedPrevious = cache.get('bdi_previous');
  let previousBDI = cachedPrevious ? cachedPrevious.data : finalBDI;
  
  // Store current as previous for next time
  cache.set('bdi_previous', { data: finalBDI, timestamp: Date.now() });
  const change = finalBDI - previousBDI;
  const changePercent = ((change / previousBDI) * 100);
  
  // Simple projection based on recent trend
  const projected = Math.round(finalBDI * (1 + (changePercent / 100) * 0.5)); // Conservative projection
  
  const bdiData = {
    value: finalBDI,
    previous: previousBDI,
    change: change,
    changePercent: parseFloat(changePercent.toFixed(2)),
    projected: projected,
    projectedChange: parseFloat(((projected - finalBDI) / finalBDI * 100).toFixed(2)),
    lastUpdated: new Date().toISOString(),
    sources: results.map(r => r.source),
    confidence: Math.min(0.95, 0.6 + (results.length * 0.1)) // Higher confidence with more sources
  };
  
  setCachedBDI(bdiData);
  
  // Also cache as last known good value for fallback
  cache.set('bdi_last_known', { data: bdiData, timestamp: Date.now() });
  
  return bdiData;
}

// Get BDI trend data from historical cache
export async function getBDITrend() {
  const current = await fetchCurrentBDI();
  if (!current) return [];
  
  // Try to build trend from historical cache data
  const historicalData = cache.get('bdi_historical') || [];
  
  // Add current data point to history
  const today = new Date().toISOString().split('T')[0];
  const existingToday = historicalData.find(item => item.date === today);
  
  if (!existingToday) {
    historicalData.push({
      date: today,
      value: current.value,
      timestamp: Date.now()
    });
    
    // Keep only last 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const filtered = historicalData.filter(item => item.timestamp > thirtyDaysAgo);
    
    cache.set('bdi_historical', filtered);
  }
  
  return historicalData.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Export for use in components
export default {
  fetchCurrentBDI,
  getBDITrend
};
