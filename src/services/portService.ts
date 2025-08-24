// Port Data Service
// Integrates with port authorities and shipping data providers

class PortService {
  constructor() {
    this.baseURL = 'https://api.portcall.com/v1';
    this.apiKey = process.env.REACT_APP_PORT_API_KEY || 'demo_key';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get port information and statistics
  async getPortInfo(portCode) {
    const cacheKey = `port_${portCode}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseURL}/ports/${portCode}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error(`Error fetching port info for ${portCode}:`, error);
      return this.getMockPortInfo(portCode);
    }
  }

  // Get vessel arrivals and departures for a port
  async getPortSchedule(portCode, days = 7) {
    const cacheKey = `schedule_${portCode}_${days}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseURL}/ports/${portCode}/schedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          days: days,
          includeArrivals: true,
          includeDepartures: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error(`Error fetching port schedule for ${portCode}:`, error);
      return this.getMockPortSchedule(portCode);
    }
  }

  // Get port congestion and wait times
  async getPortCongestion(portCode) {
    try {
      const response = await fetch(`${this.baseURL}/ports/${portCode}/congestion`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching port congestion for ${portCode}:`, error);
      return this.getMockPortCongestion(portCode);
    }
  }

  // Get global port performance data
  async getGlobalPortData() {
    const cacheKey = 'global_ports';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseURL}/ports/global/performance`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error fetching global port data:', error);
      return this.getMockGlobalPortData();
    }
  }

  // Get port efficiency metrics
  async getPortEfficiency(portCode, timeframe = '30d') {
    try {
      const response = await fetch(`${this.baseURL}/ports/${portCode}/efficiency`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timeframe })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching port efficiency for ${portCode}:`, error);
      return this.getMockPortEfficiency(portCode);
    }
  }

  // Mock data for development/fallback
  getMockPortInfo(portCode) {
    const ports = {
      'NLRTM': {
        code: 'NLRTM',
        name: 'Rotterdam',
        country: 'Netherlands',
        coordinates: { lat: 51.9225, lng: 4.47917 },
        throughput: 14800000,
        efficiency: 94.2,
        waitTime: 2.3,
        berths: 45,
        maxDraught: 24.0
      },
      'SGSIN': {
        code: 'SGSIN',
        name: 'Singapore',
        country: 'Singapore',
        coordinates: { lat: 1.2966, lng: 103.7764 },
        throughput: 37200000,
        efficiency: 97.1,
        waitTime: 1.8,
        berths: 67,
        maxDraught: 25.0
      },
      'CNSHA': {
        code: 'CNSHA',
        name: 'Shanghai',
        country: 'China',
        coordinates: { lat: 31.2304, lng: 121.4737 },
        throughput: 47030000,
        efficiency: 92.8,
        waitTime: 3.2,
        berths: 89,
        maxDraught: 22.0
      }
    };

    return ports[portCode] || {
      code: portCode,
      name: `Port ${portCode}`,
      country: 'Unknown',
      coordinates: { lat: 0, lng: 0 },
      throughput: Math.floor(Math.random() * 10000000),
      efficiency: 85 + Math.random() * 15,
      waitTime: Math.random() * 5,
      berths: Math.floor(Math.random() * 50) + 10,
      maxDraught: 15 + Math.random() * 10
    };
  }

  getMockPortSchedule(portCode) {
    const schedule = [];
    const now = new Date();
    
    for (let i = 0; i < 20; i++) {
      const arrivalTime = new Date(now.getTime() + i * 6 * 60 * 60 * 1000);
      const departureTime = new Date(arrivalTime.getTime() + (12 + Math.random() * 24) * 60 * 60 * 1000);
      
      schedule.push({
        vesselName: `Container Ship ${i + 1}`,
        mmsi: 200000000 + i,
        arrival: arrivalTime.toISOString(),
        departure: departureTime.toISOString(),
        berth: `B${Math.floor(Math.random() * 20) + 1}`,
        cargo: Math.floor(Math.random() * 20000) + 5000,
        status: ['Scheduled', 'Arrived', 'Loading', 'Departed'][Math.floor(Math.random() * 4)]
      });
    }
    
    return schedule;
  }

  getMockPortCongestion(portCode) {
    return {
      portCode,
      congestionLevel: Math.random() * 100,
      averageWaitTime: Math.random() * 8,
      vesselsWaiting: Math.floor(Math.random() * 15),
      berthUtilization: 70 + Math.random() * 25,
      lastUpdated: new Date().toISOString()
    };
  }

  getMockGlobalPortData() {
    const ports = [
      { code: 'CNSHA', name: 'Shanghai', throughput: 47030000, efficiency: 94.2 },
      { code: 'SGSIN', name: 'Singapore', throughput: 37200000, efficiency: 97.1 },
      { code: 'CNNBO', name: 'Ningbo-Zhoushan', throughput: 31080000, efficiency: 92.8 },
      { code: 'CNSZX', name: 'Shenzhen', throughput: 28770000, efficiency: 91.5 },
      { code: 'CNGZH', name: 'Guangzhou', throughput: 25230000, efficiency: 89.9 },
      { code: 'KRPUS', name: 'Busan', throughput: 22990000, efficiency: 93.4 },
      { code: 'HKHKG', name: 'Hong Kong', throughput: 18100000, efficiency: 95.7 },
      { code: 'NLRTM', name: 'Rotterdam', throughput: 14800000, efficiency: 94.2 },
      { code: 'USAXB', name: 'Los Angeles', throughput: 10677000, efficiency: 87.3 },
      { code: 'BELAX', name: 'Antwerp', throughput: 12000000, efficiency: 95.1 }
    ];

    return ports.map(port => ({
      ...port,
      growth: (Math.random() - 0.3) * 15,
      congestion: Math.random() * 100,
      coordinates: this.getMockPortInfo(port.code).coordinates
    }));
  }

  getMockPortEfficiency(portCode) {
    const data = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      data.push({
        date: date.toISOString().split('T')[0],
        efficiency: 85 + Math.random() * 15,
        throughput: Math.floor(Math.random() * 5000) + 2000,
        waitTime: Math.random() * 6,
        berthUtilization: 60 + Math.random() * 35
      });
    }
    
    return data;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

export default new PortService();
