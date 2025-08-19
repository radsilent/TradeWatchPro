import { mockPorts, mockDisruptions } from './mockData';
import { getRealTimePortData, getRealTimeDisruptions } from './realTimeIntegration';
import { fetchRealTimeMaritimeNews } from './newsIntegration';
import { fetchRealTimeTariffData } from './tariffIntegration';

// Real-time Port entity using live data
export const Port = {
  list: async (sortBy = '-strategic_importance', limit = 150) => {
    try {
      // Get real-time port data
      const realPorts = await getRealTimePortData();
      
      let sortedPorts = [...realPorts];
      
      // Sort by strategic importance (descending)
      if (sortBy === '-strategic_importance') {
        sortedPorts.sort((a, b) => b.strategic_importance - a.strategic_importance);
      }
      
      return sortedPorts.slice(0, limit);
    } catch (error) {
      console.error('Error fetching real port data, falling back to mock:', error);
      // Fallback to mock data if real-time fails
      let sortedPorts = [...mockPorts];
      if (sortBy === '-strategic_importance') {
        sortedPorts.sort((a, b) => b.strategic_importance - a.strategic_importance);
      }
      return sortedPorts.slice(0, limit);
    }
  },
  
  get: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockPorts.find(port => port.id === id);
  },
  
  create: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newPort = {
      id: `port_${Date.now()}`,
      ...data,
      created_date: new Date().toISOString()
    };
    mockPorts.push(newPort);
    return newPort;
  },
  
  update: async (id, data) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const index = mockPorts.findIndex(port => port.id === id);
    if (index !== -1) {
      mockPorts[index] = { ...mockPorts[index], ...data };
      return mockPorts[index];
    }
    throw new Error('Port not found');
  }
};

// Real-time Disruption entity using live data
export const Disruption = {
  list: async (sortBy = '-created_date', limit = 50) => {
    try {
      // Get real-time disruption data from news and other sources
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
      
      let sortedDisruptions = [...realDisruptions];
      
      // Sort by start date (descending)
      if (sortBy === '-created_date' || sortBy === '-start_date') {
        sortedDisruptions.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
      }
      
      return sortedDisruptions.slice(0, limit);
    } catch (error) {
      console.error('Error fetching real disruption data, falling back to mock:', error);
      // Fallback to mock data if real-time fails
      let sortedDisruptions = [...mockDisruptions];
      if (sortBy === '-created_date' || sortBy === '-start_date') {
        sortedDisruptions.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
      }
      return sortedDisruptions.slice(0, limit);
    }
  },
  
  get: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockDisruptions.find(disruption => disruption.id === id);
  },
  
  create: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const newDisruption = {
      id: `disruption_${Date.now()}`,
      ...data,
      created_date: new Date().toISOString()
    };
    mockDisruptions.push(newDisruption);
    return newDisruption;
  },
  
  update: async (id, data) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const index = mockDisruptions.findIndex(disruption => disruption.id === id);
    if (index !== -1) {
      mockDisruptions[index] = { ...mockDisruptions[index], ...data };
      return mockDisruptions[index];
    }
    throw new Error('Disruption not found');
  }
};

// Real-time Tariff entity using live data
export const Tariff = {
  list: async (sortBy = '-effectiveDate', limit = 50) => {
    try {
      // Get real-time tariff data
      const realTariffs = await fetchRealTimeTariffData();
      
      let sortedTariffs = [...realTariffs];
      
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