import { getRealTimePortData, getRealTimeDisruptions, getRealTimeVesselData } from './realTimeIntegration.js';
import { fetchRealTimeMaritimeNews } from './newsIntegration.js';
import { fetchRealTimeTariffData } from './tariffIntegration.js';
import { getAggregatedPorts, getAggregatedDisruptions, getAggregatedTariffs } from './apiAggregator.js';
import { getComprehensiveMaritimeData } from './maritimeAPIs.js';

// Real-time Port entity using live data
export const Port = {
  list: async (sortBy = '-strategic_importance', limit = 150) => {
    console.log(`Port.list called with sortBy: ${sortBy}, limit: ${limit}`);
    
    try {
      // Use top 200 ports data for comprehensive coverage
      console.log('Loading top 200 world ports data...');
      const { generateTop200WorldPorts } = await import('./top200Ports.js');
      const portsData = generateTop200WorldPorts();
      
      console.log('Sample port data structure:', portsData[0]);
      
      // Sort by strategic importance (descending) 
      if (sortBy === '-strategic_importance') {
        portsData.sort((a, b) => (b.strategic_importance || 0) - (a.strategic_importance || 0));
      }
      
      const result = portsData.slice(0, limit);
      console.log(`Returning ${result.length} world ports from top 200 dataset`);
      console.log('First few ports:', result.slice(0, 3).map(p => ({ name: p.name, coords: p.coordinates })));
      return result;
    } catch (error) {
      console.error('Error loading top 200 ports:', error);
      return [];
    }
  },
  
  get: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const ports = await getRealTimePortData();
    return ports.find(port => port.id === id);
  },
  
  create: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newPort = {
      id: `port_${Date.now()}`,
      ...data,
      created_date: new Date().toISOString()
    };
    // Note: In production, this would save to database
    console.log('Port created:', newPort);
    return newPort;
  },
  
  update: async (id, data) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    // Note: In production, this would update database
    const updatedPort = { id, ...data, updated_date: new Date().toISOString() };
    console.log('Port updated:', updatedPort);
    return updatedPort;
  }
};

// Real-time Disruption entity using live data
export const Disruption = {
  list: async (sortBy = '-created_date', limit = 50) => {
    try {
      // Use aggregated disruption data with intelligent caching and deduplication
      const aggregatedDisruptions = await getAggregatedDisruptions(limit);
      
      let sortedDisruptions = [...aggregatedDisruptions];
      
      // Sort by start date (descending)
      if (sortBy === '-created_date' || sortBy === '-start_date') {
        sortedDisruptions.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
      }
      
      return sortedDisruptions.slice(0, limit);
    } catch (error) {
      console.error('Error fetching aggregated disruption data, using direct fallback:', error);
      // Fallback to direct real-time data
      try {
        const [newsDisruptions, baseDisruptions] = await Promise.allSettled([
          fetchRealTimeMaritimeNews(),
          getRealTimeDisruptions()
        ]);
        
        let realDisruptions = [];
        
        if (newsDisruptions.status === 'fulfilled') {
          realDisruptions.push(...newsDisruptions.value);
        }
        
        if (baseDisruptions.status === 'fulfilled') {
          realDisruptions.push(...baseDisruptions.value);
        }
        
        // Remove duplicates based on title
        realDisruptions = realDisruptions.filter((disruption, index, arr) => 
          arr.findIndex(d => d.title === disruption.title) === index
        );
        
        if (sortBy === '-created_date' || sortBy === '-start_date') {
          realDisruptions.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
        }
        
        return realDisruptions.slice(0, limit);
      } catch (fallbackError) {
        console.error('All disruption data sources failed:', fallbackError);
        return [];
      }
    }
  },
  
  get: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const disruptions = await getRealTimeDisruptions();
    return disruptions.find(disruption => disruption.id === id);
  },
  
  create: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const newDisruption = {
      id: `disruption_${Date.now()}`,
      ...data,
      created_date: new Date().toISOString()
    };
    // Note: In production, this would save to database
    console.log('Disruption created:', newDisruption);
    return newDisruption;
  },
  
  update: async (id, data) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    // Note: In production, this would update database
    const updatedDisruption = { id, ...data, updated_date: new Date().toISOString() };
    console.log('Disruption updated:', updatedDisruption);
    return updatedDisruption;
  }
};

// Real-time Tariff entity using live data
export const Tariff = {
  list: async (sortBy = '-effectiveDate', limit = 50) => {
    try {
      // Use aggregated tariff data with caching
      const aggregatedTariffs = await getAggregatedTariffs(limit * 2); // Get more to account for filtering
      
      // Debug: Log first few tariffs to see their structure
      console.log('Sample tariff data before filtering:', aggregatedTariffs.slice(0, 3));
      
      // Filter out tariffs with null/missing/invalid values (relaxed filtering)
      const validTariffs = aggregatedTariffs.filter(tariff => {
        let isValid = true;
        let reasons = [];
        
        // Must have a valid current rate
        if (!tariff.currentRate || tariff.currentRate <= 0 || isNaN(tariff.currentRate)) {
          reasons.push('invalid currentRate');
          isValid = false;
        }
        
        // Must have a valid title
        if (!tariff.title || tariff.title.trim() === '' || tariff.title === 'N/A') {
          reasons.push('invalid title');
          isValid = false;
        }
        
        // Must have valid countries (relaxed - allow single country string or array)
        if (!tariff.countries && !tariff.country) {
          reasons.push('no countries');
          isValid = false;
        }
        
        // Must have a valid effective date (relaxed - allow string dates)
        if (!tariff.effectiveDate) {
          reasons.push('no effectiveDate');
          isValid = false;
        }
        
        // Relaxed: Don't require affectedTrade, status, or priority for now
        
        if (!isValid) {
          console.log(`Filtering out tariff ${tariff.id || tariff.title}: ${reasons.join(', ')}`);
        }
        
        return isValid;
      });
      
      console.log(`Filtered tariffs: ${aggregatedTariffs.length} -> ${validTariffs.length} (removed ${aggregatedTariffs.length - validTariffs.length} incomplete entries)`);
      
      let sortedTariffs = [...validTariffs];
      
      // Sort by effective date (descending) or priority
      if (sortBy === '-effectiveDate') {
        sortedTariffs.sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));
      } else if (sortBy === '-priority') {
        const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        sortedTariffs.sort((a, b) => (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1));
      }
      
      return sortedTariffs.slice(0, limit);
    } catch (error) {
      console.error('Error fetching real tariff data:', error);
      return []; // Return empty array if real-time fails
    }
  },
  
  get: async (id) => {
    try {
      const tariffs = await fetchRealTimeTariffData();
      return tariffs.find(tariff => tariff.id === id);
    } catch (error) {
      console.error('Error fetching tariff:', error);
      return null;
    }
  }
};

// Vessel entity for ship tracking
export const Vessel = {
  list: async (limit = 100) => {
    try {
      const vessels = await getRealTimeVesselData();
      return vessels.slice(0, limit);
    } catch (error) {
      console.error('Error fetching vessel data:', error);
      return [];
    }
  },
  
  get: async (id) => {
    const vessels = await getRealTimeVesselData();
    return vessels.find(vessel => vessel.id === id);
  }
};

// Maritime data aggregation entity
export const MaritimeData = {
  getComprehensive: async () => {
    try {
      return await getComprehensiveMaritimeData();
    } catch (error) {
      console.error('Error fetching comprehensive maritime data:', error);
      return {
        vessels: [],
        weather: [],
        portCapacity: [],
        freightRates: [],
        summary: { totalVessels: 0, weatherAlerts: 0, congestedPorts: 0, rateVolatility: 0 }
      };
    }
  },
  
  getDashboardSummary: async () => {
    try {
      const data = await getComprehensiveMaritimeData();
      return {
        activeVessels: data.vessels.filter(v => v.status.includes('Under way')).length,
        weatherWarnings: data.weather.filter(w => w.severity === 'high').length,
        portCongestion: data.portCapacity.filter(p => p.congestionLevel === 'high').length,
        rateVolatility: data.freightRates.filter(r => Math.abs(r.weeklyChange) > 15).length,
        lastUpdate: data.lastUpdate
      };
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      return { activeVessels: 0, weatherWarnings: 0, portCongestion: 0, rateVolatility: 0 };
    }
  }
};

// Mock User entity
export const User = {
  getCurrentUser: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      id: 'user_1',
      name: 'TradeWatch User',
      email: 'user@tradewatch.com',
      role: 'analyst'
    };
  }
};