// Data cache utility for storing and retrieving last known datasets
// Provides immediate data display while loading fresh data

const CACHE_KEYS = {
  DISRUPTIONS: 'last_known_disruptions',
  VESSELS: 'last_known_vessels', 
  PORTS: 'last_known_ports',
  TARIFFS: 'last_known_tariffs',
  DASHBOARD_DATA: 'last_known_dashboard_data'
};

const CACHE_EXPIRY = {
  DISRUPTIONS: 24 * 60 * 60 * 1000, // 24 hours
  VESSELS: 2 * 60 * 60 * 1000,      // 2 hours
  PORTS: 24 * 60 * 60 * 1000,       // 24 hours
  TARIFFS: 24 * 60 * 60 * 1000,     // 24 hours
  DASHBOARD_DATA: 1 * 60 * 60 * 1000 // 1 hour
};

class DataCache {
  
  // Store data with timestamp
  set(key, data) {
    try {
      const cacheEntry = {
        data: data,
        timestamp: Date.now(),
        version: '1.0'
      };
      localStorage.setItem(key, JSON.stringify(cacheEntry));
      console.log(`📦 Cached ${key}:`, Array.isArray(data) ? `${data.length} items` : typeof data);
    } catch (error) {
      console.warn(`Failed to cache ${key}:`, error);
    }
  }

  // Get data if not expired
  get(key, maxAge = CACHE_EXPIRY.DISRUPTIONS) {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const cacheEntry = JSON.parse(cached);
      const age = Date.now() - cacheEntry.timestamp;

      if (age > maxAge) {
        console.log(`⏰ Cache expired for ${key} (${Math.round(age / 1000 / 60)} minutes old)`);
        this.remove(key);
        return null;
      }

      console.log(`📦 Retrieved cached ${key}:`, Array.isArray(cacheEntry.data) ? `${cacheEntry.data.length} items` : typeof cacheEntry.data);
      return cacheEntry.data;
    } catch (error) {
      console.warn(`Failed to retrieve cache ${key}:`, error);
      return null;
    }
  }

  // Remove specific cache entry
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove cache ${key}:`, error);
    }
  }

  // Clear all cached data
  clear() {
    try {
      Object.values(CACHE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('🧹 Cleared all cached data');
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  // Get cache info for debugging
  getInfo() {
    const info = {};
    Object.entries(CACHE_KEYS).forEach(([name, key]) => {
      const cached = this.get(key, Infinity); // Don't expire for info
      info[name] = {
        key,
        hasData: !!cached,
        itemCount: Array.isArray(cached) ? cached.length : (cached ? 1 : 0),
        age: this.getAge(key)
      };
    });
    return info;
  }

  // Get age of cached data in minutes
  getAge(key) {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const cacheEntry = JSON.parse(cached);
      return Math.round((Date.now() - cacheEntry.timestamp) / 1000 / 60);
    } catch (error) {
      return null;
    }
  }
}

// Singleton instance
const dataCache = new DataCache();

// Convenience methods for specific data types
export const cacheDisruptions = (disruptions) => dataCache.set(CACHE_KEYS.DISRUPTIONS, disruptions);
export const getLastKnownDisruptions = () => dataCache.get(CACHE_KEYS.DISRUPTIONS, CACHE_EXPIRY.DISRUPTIONS);

export const cacheVessels = (vessels) => dataCache.set(CACHE_KEYS.VESSELS, vessels);
export const getLastKnownVessels = () => dataCache.get(CACHE_KEYS.VESSELS, CACHE_EXPIRY.VESSELS);

export const cachePorts = (ports) => dataCache.set(CACHE_KEYS.PORTS, ports);
export const getLastKnownPorts = () => dataCache.get(CACHE_KEYS.PORTS, CACHE_EXPIRY.PORTS);

export const cacheTariffs = (tariffs) => dataCache.set(CACHE_KEYS.TARIFFS, tariffs);
export const getLastKnownTariffs = () => dataCache.get(CACHE_KEYS.TARIFFS, CACHE_EXPIRY.TARIFFS);

export const cacheDashboardData = (data) => dataCache.set(CACHE_KEYS.DASHBOARD_DATA, data);
export const getLastKnownDashboardData = () => dataCache.get(CACHE_KEYS.DASHBOARD_DATA, CACHE_EXPIRY.DASHBOARD_DATA);

// Debug helper
export const getCacheInfo = () => dataCache.getInfo();
export const clearAllCache = () => dataCache.clear();

export default dataCache;
