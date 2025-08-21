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
        const realTimeDisruptions = await getRealTimeDisruptions();
        
        let sortedDisruptions = [...realTimeDisruptions];
        
        // Sort by start date (descending)
        if (sortBy === '-created_date' || sortBy === '-start_date') {
          sortedDisruptions.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
        }
        
        return sortedDisruptions.slice(0, limit);
      } catch (fallbackError) {
        console.error('Error fetching real-time disruption data:', fallbackError);
        return [];
      }
    }
  },
  
  get: async (id) => {
    try {
      const disruptions = await getRealTimeDisruptions();
      return disruptions.find(disruption => disruption.id === id);
    } catch (error) {
      console.error('Error fetching disruption by ID:', error);
      return null;
    }
  },
  
  create: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newDisruption = {
      id: `disruption_${Date.now()}`,
      ...data,
      created_date: new Date().toISOString()
    };
    // Note: In production, this would save to database
    console.log('Disruption created:', newDisruption);
    return newDisruption;
  }
};

// Real-time Tariff entity using live data
export const Tariff = {
  list: async (sortBy = '-effectiveDate', limit = 500) => {
    try {
      console.log(`💰 Tariff.list called with sortBy: ${sortBy}, limit: ${limit}`);
      // Use aggregated tariff data with caching
      const aggregatedTariffs = await getAggregatedTariffs(limit * 2); // Get more to account for filtering
      console.log(`💰 Got ${aggregatedTariffs.length} tariffs from getAggregatedTariffs`);
      
      let sortedTariffs = [...aggregatedTariffs];
      
      // Sort by effective date (descending)
      if (sortBy === '-effectiveDate' || sortBy === '-effective_date') {
        sortedTariffs.sort((a, b) => {
          const dateA = new Date(a.effective_date || a.effectiveDate);
          const dateB = new Date(b.effective_date || b.effectiveDate);
          return dateB - dateA;
        });
      } else if (sortBy === '-trade_value' || sortBy === '-tradeValue') {
        sortedTariffs.sort((a, b) => (b.trade_value || b.tradeValue || 0) - (a.trade_value || a.tradeValue || 0));
      }
      
      const result = sortedTariffs.slice(0, limit);
      console.log(`💰 Returning ${result.length} tariffs to frontend`);
      return result;
    } catch (error) {
      console.error('💰 Error fetching aggregated tariff data, using direct fallback:', error);
      // Fallback to direct real-time data
      try {
        const realTimeTariffs = await fetchRealTimeTariffData(limit);
        console.log(`💰 Fallback: Got ${realTimeTariffs.length} tariffs from fetchRealTimeTariffData`);
        return realTimeTariffs.slice(0, limit);
      } catch (fallbackError) {
        console.error('💰 Error fetching real-time tariff data:', fallbackError);
        return [];
      }
    }
  },
  
  get: async (id) => {
    try {
      const tariffs = await fetchRealTimeTariffData(100);
      return tariffs.find(tariff => tariff.id === id);
    } catch (error) {
      console.error('Error fetching tariff by ID:', error);
      return null;
    }
  },
  
  create: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newTariff = {
      id: `tariff_${Date.now()}`,
      ...data,
      created_date: new Date().toISOString()
    };
    // Note: In production, this would save to database
    console.log('Tariff created:', newTariff);
    return newTariff;
  }
};

// Real-time Vessel entity using live data
export const Vessel = {
  list: async (limit = 1000) => {
    try {
      console.log(`🚢 Vessel.list called with limit: ${limit}`);
      const vessels = await getRealTimeVesselData();
      console.log(`🚢 Got ${vessels.length} vessels from getRealTimeVesselData`);
      const result = vessels.slice(0, limit);
      console.log(`🚢 Returning ${result.length} vessels to frontend`);
      return result;
    } catch (error) {
      console.error('🚢 Error fetching vessel data:', error);
      return [];
    }
  },
  
  get: async (id) => {
    try {
      const vessels = await getRealTimeVesselData();
      return vessels.find(vessel => vessel.id === id);
    } catch (error) {
      console.error('Error fetching vessel by ID:', error);
      return null;
    }
  },
  
  create: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newVessel = {
      id: `vessel_${Date.now()}`,
      ...data,
      created_date: new Date().toISOString()
    };
    // Note: In production, this would save to database
    console.log('Vessel created:', newVessel);
    return newVessel;
  }
};

// Real-time News entity using live data
export const News = {
  list: async (limit = 10) => {
    try {
      const news = await fetchRealTimeMaritimeNews(limit);
      return news.slice(0, limit);
    } catch (error) {
      console.error('Error fetching news data:', error);
      return [];
    }
  },
  
  get: async (id) => {
    try {
      const news = await fetchRealTimeMaritimeNews(50);
      return news.find(item => item.id === id);
    } catch (error) {
      console.error('Error fetching news by ID:', error);
      return null;
    }
  }
};

// Real-time Analytics entity using comprehensive maritime data
export const Analytics = {
  getDashboardSummary: async () => {
    try {
      const comprehensiveData = await getComprehensiveMaritimeData();
      
      return {
        activeVessels: comprehensiveData.vessels?.length || 0,
        weatherWarnings: comprehensiveData.weather?.length || 0,
        portCongestion: comprehensiveData.ports?.filter(p => p.congestion_level > 70).length || 0,
        rateVolatility: Math.floor(Math.random() * 20) + 5 // Placeholder for real calculation
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
