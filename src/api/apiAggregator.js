// API Aggregation and Caching System for TradeWatch
// Centralizes all real-time data fetching with intelligent caching and fallbacks

import { getRealTimePortData, getRealTimeDisruptions } from './realTimeIntegration.js';
import { fetchRealTimeMaritimeNews } from './newsIntegration.js';
import { fetchRealTimeTariffData } from './tariffIntegration.js';

// Advanced caching system with different TTLs for different data types
class DataCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
    this.ttlConfig = {
      ports: 30 * 60 * 1000,        // 30 minutes for ports (slow changing)
      disruptions: 5 * 60 * 1000,   // 5 minutes for disruptions (fast changing)
      news: 10 * 60 * 1000,         // 10 minutes for news
      tariffs: 60 * 60 * 1000,      // 1 hour for tariffs (very slow changing)
      vessels: 2 * 60 * 1000,       // 2 minutes for vessels (real-time)
      weather: 15 * 60 * 1000       // 15 minutes for weather
    };
  }

  set(key, data, dataType = 'default') {
    const ttl = this.ttlConfig[dataType] || this.defaultTTL;
    const expiry = Date.now() + ttl;
    
    this.cache.set(key, {
      data,
      expiry,
      lastUpdated: Date.now(),
      hits: 0
    });
    
    console.log(`Cached ${key} with TTL ${ttl}ms`);
  }

  get(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      console.log(`Cache expired for ${key}`);
      return null;
    }
    
    cached.hits++;
    console.log(`Cache hit for ${key} (${cached.hits} hits)`);
    return cached.data;
  }

  invalidate(key) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      console.log(`Cache invalidated for ${key}`);
    }
  }

  getStats() {
    const stats = {
      totalKeys: this.cache.size,
      hitRates: {},
      totalMemory: 0
    };
    
    for (const [key, value] of this.cache) {
      stats.hitRates[key] = value.hits;
      stats.totalMemory += JSON.stringify(value.data).length;
    }
    
    return stats;
  }

  clear() {
    this.cache.clear();
    console.log('Cache cleared');
  }
}

// Global cache instance
const globalCache = new DataCache();

// Data aggregation strategies
const AGGREGATION_STRATEGIES = {
  ports: {
    sources: ['realtime', 'static'],
    fallback: 'static',
    mergingStrategy: 'replace' // Replace with freshest data
  },
  disruptions: {
    sources: ['news', 'known', 'generated'],
    fallback: 'known',
    mergingStrategy: 'merge' // Merge all sources
  },
  tariffs: {
    sources: ['government', 'industry'],
    fallback: 'cached',
    mergingStrategy: 'replace'
  }
};

// Main aggregation class
export class APIAggregator {
  constructor() {
    this.cache = globalCache;
    this.retryConfig = {
      maxRetries: 3,
      backoffMs: 1000,
      exponentialBackoff: true
    };
  }

  // Retry mechanism with exponential backoff
  async retry(fn, retries = this.retryConfig.maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        const delay = this.retryConfig.exponentialBackoff 
          ? this.retryConfig.backoffMs * Math.pow(2, this.retryConfig.maxRetries - retries)
          : this.retryConfig.backoffMs;
        
        console.log(`Retrying in ${delay}ms, ${retries} attempts left`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retry(fn, retries - 1);
      }
      throw error;
    }
  }

  // Aggregate port data from multiple sources
  async aggregatePorts(limit = 200) {
    const cacheKey = `aggregated_ports_${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    console.log('Aggregating port data from multiple sources...');
    
    try {
      // Primary source: real-time data
      const ports = await this.retry(() => getRealTimePortData(limit));
      
      // Validate and enhance data
      const enhancedPorts = ports.map(port => ({
        ...port,
        dataSource: 'realtime',
        lastAggregated: new Date().toISOString(),
        quality: this.assessDataQuality(port)
      }));
      
      this.cache.set(cacheKey, enhancedPorts, 'ports');
      return enhancedPorts;
      
    } catch (error) {
      console.error('Port aggregation failed:', error);
      
      // Fallback to cached data if available
      const fallbackKey = `fallback_ports_${limit}`;
      const fallback = this.cache.get(fallbackKey);
      if (fallback) {
        console.log('Using fallback port data');
        return fallback;
      }
      
      throw error;
    }
  }

  // Aggregate disruption data from multiple sources
  async aggregateDisruptions(limit = 100) {
    const cacheKey = `aggregated_disruptions_${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    console.log('Aggregating disruption data from multiple sources...');
    
    try {
      // Fetch from multiple sources in parallel
      const [newsDisruptions, realTimeDisruptions] = await Promise.allSettled([
        this.retry(() => fetchRealTimeMaritimeNews()),
        this.retry(() => getRealTimeDisruptions())
      ]);

      let allDisruptions = [];
      
      // Merge successful results
      if (newsDisruptions.status === 'fulfilled') {
        allDisruptions.push(...newsDisruptions.value);
      }
      
      if (realTimeDisruptions.status === 'fulfilled') {
        allDisruptions.push(...realTimeDisruptions.value);
      }
      
      // Remove duplicates and enhance data
      const uniqueDisruptions = this.deduplicateDisruptions(allDisruptions);
      const enhancedDisruptions = uniqueDisruptions
        .map(disruption => ({
          ...disruption,
          dataSource: disruption.sources?.[0]?.name || 'unknown',
          lastAggregated: new Date().toISOString(),
          quality: this.assessDataQuality(disruption),
          relevanceScore: this.calculateRelevanceScore(disruption)
        }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);
      
      this.cache.set(cacheKey, enhancedDisruptions, 'disruptions');
      return enhancedDisruptions;
      
    } catch (error) {
      console.error('Disruption aggregation failed:', error);
      
      // Fallback to cached data
      const fallbackKey = `fallback_disruptions_${limit}`;
      const fallback = this.cache.get(fallbackKey);
      if (fallback) {
        console.log('Using fallback disruption data');
        return fallback;
      }
      
      throw error;
    }
  }

  // Aggregate tariff data
  async aggregateTariffs(limit = 50) {
    const cacheKey = `aggregated_tariffs_${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    console.log('Aggregating tariff data...');
    
    try {
      const tariffs = await this.retry(() => fetchRealTimeTariffData());
      
      const enhancedTariffs = tariffs
        .slice(0, limit)
        .map(tariff => ({
          ...tariff,
          dataSource: 'government',
          lastAggregated: new Date().toISOString(),
          quality: this.assessDataQuality(tariff)
        }));
      
      this.cache.set(cacheKey, enhancedTariffs, 'tariffs');
      return enhancedTariffs;
      
    } catch (error) {
      console.error('Tariff aggregation failed:', error);
      throw error;
    }
  }

  // Remove duplicate disruptions based on title similarity
  deduplicateDisruptions(disruptions) {
    const seen = new Set();
    const unique = [];
    
    for (const disruption of disruptions) {
      const normalizedTitle = disruption.title?.toLowerCase().replace(/[^\w\s]/g, '').trim();
      
      if (normalizedTitle && !seen.has(normalizedTitle)) {
        seen.add(normalizedTitle);
        unique.push(disruption);
      }
    }
    
    return unique;
  }

  // Assess data quality based on completeness and freshness
  assessDataQuality(dataItem) {
    let score = 0;
    const maxScore = 100;
    
    // Check required fields
    const requiredFields = ['id', 'title', 'status'];
    const presentFields = requiredFields.filter(field => dataItem[field]);
    score += (presentFields.length / requiredFields.length) * 40;
    
    // Check freshness
    if (dataItem.lastUpdate || dataItem.start_date) {
      const dataDate = new Date(dataItem.lastUpdate || dataItem.start_date);
      const daysSinceUpdate = (Date.now() - dataDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate < 1) score += 30;
      else if (daysSinceUpdate < 7) score += 20;
      else if (daysSinceUpdate < 30) score += 10;
    }
    
    // Check sources
    if (dataItem.sources && dataItem.sources.length > 0) {
      score += 20;
    }
    
    // Check completeness
    const optionalFields = ['description', 'severity', 'coordinates', 'region'];
    const presentOptional = optionalFields.filter(field => dataItem[field]);
    score += (presentOptional.length / optionalFields.length) * 10;
    
    return Math.min(score, maxScore);
  }

  // Calculate relevance score for disruptions
  calculateRelevanceScore(disruption) {
    let score = 0;
    
    // Severity weighting
    const severityWeights = { critical: 100, high: 80, medium: 60, low: 40 };
    score += severityWeights[disruption.severity] || 40;
    
    // Status weighting
    const statusWeights = { active: 50, monitoring: 30, resolved: 10 };
    score += statusWeights[disruption.status] || 20;
    
    // Recency weighting
    if (disruption.start_date) {
      const days = (Date.now() - new Date(disruption.start_date).getTime()) / (1000 * 60 * 60 * 24);
      if (days < 1) score += 50;
      else if (days < 7) score += 30;
      else if (days < 30) score += 10;
    }
    
    // Source reliability
    if (disruption.sources && disruption.sources.length > 0) {
      const reliabilityWeights = { high: 20, medium: 15, low: 10 };
      score += reliabilityWeights[disruption.sources[0].reliability] || 10;
    }
    
    return score;
  }

  // Get aggregation statistics
  getStats() {
    return {
      cache: this.cache.getStats(),
      uptime: process.uptime?.() || 'N/A',
      memoryUsage: typeof process !== 'undefined' ? process.memoryUsage?.() : 'N/A'
    };
  }

  // Force refresh all cached data
  async refreshAll() {
    console.log('Forcing refresh of all cached data...');
    this.cache.clear();
    
    // Pre-warm cache with fresh data
    await Promise.allSettled([
      this.aggregatePorts(),
      this.aggregateDisruptions(),
      this.aggregateTariffs()
    ]);
    
    console.log('All data refreshed');
  }
}

// Global aggregator instance
export const globalAggregator = new APIAggregator();

// Convenience functions for backward compatibility
export const getAggregatedPorts = (limit) => globalAggregator.aggregatePorts(limit);
export const getAggregatedDisruptions = (limit) => globalAggregator.aggregateDisruptions(limit);
export const getAggregatedTariffs = (limit) => globalAggregator.aggregateTariffs(limit);

export default globalAggregator;
