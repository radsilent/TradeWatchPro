// Mock Base44 client - replaces the actual Base44 SDK
// This allows the app to run independently without Base44 dependencies

export const base44 = {
  entities: {
    Port: {
      list: async (sortBy = '-strategic_importance', limit = 150) => {
        // This will be handled by the mock entities
        throw new Error('Use the mock Port entity instead');
      }
    },
    Disruption: {
      list: async (sortBy = '-created_date', limit = 50) => {
        // This will be handled by the mock entities
        throw new Error('Use the mock Disruption entity instead');
      }
    }
  },
  
  integrations: {
    Core: {
      InvokeLLM: async (params) => {
        // This will be handled by the mock integrations
        throw new Error('Use the mock InvokeLLM instead');
      }
    }
  },
  
  auth: {
    getCurrentUser: async () => {
      // This will be handled by the mock User entity
      throw new Error('Use the mock User entity instead');
    }
  }
};

// Export a createClient function for compatibility
export const createClient = (config) => {
  console.log('Mock Base44 client created with config:', config);
  return base44;
};
