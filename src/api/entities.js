import { mockPorts, mockDisruptions } from './mockData';

// Mock Port entity to replace Base44 Port
export const Port = {
  list: async (sortBy = '-strategic_importance', limit = 150) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let sortedPorts = [...mockPorts];
    
    // Sort by strategic importance (descending)
    if (sortBy === '-strategic_importance') {
      sortedPorts.sort((a, b) => b.strategic_importance - a.strategic_importance);
    }
    
    return sortedPorts.slice(0, limit);
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

// Mock Disruption entity to replace Base44 Disruption
export const Disruption = {
  list: async (sortBy = '-created_date', limit = 50) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    let sortedDisruptions = [...mockDisruptions];
    
    // Sort by start date (descending)
    if (sortBy === '-created_date' || sortBy === '-start_date') {
      sortedDisruptions.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    }
    
    return sortedDisruptions.slice(0, limit);
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