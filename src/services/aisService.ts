// AIS (Automatic Identification System) Service
// Integrates with real AIS data providers for vessel tracking

class AISService {
  constructor() {
    this.baseURL = 'https://api.aisstream.io/v0';
    this.apiKey = process.env.REACT_APP_AIS_API_KEY || 'demo_key';
    this.websocket = null;
    this.subscribers = new Set();
  }

  // Initialize WebSocket connection for real-time AIS data
  initializeWebSocket() {
    if (this.websocket) return;

    this.websocket = new WebSocket('wss://stream.aisstream.io/v0/stream');
    
    this.websocket.onopen = () => {
      console.log('AIS WebSocket connected');
      // Subscribe to vessel positions in specific areas
      this.subscribeToArea({
        north: 60,
        south: 30,
        east: 30,
        west: -30
      });
    };

    this.websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifySubscribers(data);
      } catch (error) {
        console.error('Error parsing AIS data:', error);
      }
    };

    this.websocket.onerror = (error) => {
      console.error('AIS WebSocket error:', error);
    };

    this.websocket.onclose = () => {
      console.log('AIS WebSocket disconnected');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.initializeWebSocket(), 5000);
    };
  }

  // Subscribe to AIS data for a specific geographic area
  subscribeToArea(bounds) {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) return;

    const subscription = {
      APIKey: this.apiKey,
      BoundingBoxes: [bounds],
      FilterMessageTypes: ["PositionReport"],
      FiltersShipAndCargo: {
        "ShipAndCargoTypes": [70, 71, 72, 73, 74] // Container ships
      }
    };

    this.websocket.send(JSON.stringify(subscription));
  }

  // Get vessel information by MMSI
  async getVesselInfo(mmsi) {
    try {
      const response = await fetch(`${this.baseURL}/vessels/${mmsi}`, {
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
      console.error('Error fetching vessel info:', error);
      return this.getMockVesselInfo(mmsi);
    }
  }

  // Get vessels in a specific area
  async getVesselsInArea(bounds) {
    try {
      const response = await fetch(`${this.baseURL}/vessels/area`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          north: bounds.north,
          south: bounds.south,
          east: bounds.east,
          west: bounds.west
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching vessels in area:', error);
      return this.getMockVesselsInArea();
    }
  }

  // Subscribe to real-time updates
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Notify all subscribers of new data
  notifySubscribers(data) {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in AIS subscriber callback:', error);
      }
    });
  }

  // Mock data for development/fallback
  getMockVesselInfo(mmsi) {
    return {
      mmsi: mmsi,
      name: `Vessel ${mmsi}`,
      callSign: `CALL${mmsi}`,
      imo: `IMO${mmsi}`,
      shipType: 70, // Container ship
      dimensions: {
        length: 400,
        width: 59,
        draught: 16
      },
      destination: "ROTTERDAM",
      eta: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      position: {
        latitude: 51.9225 + (Math.random() - 0.5) * 10,
        longitude: 4.47917 + (Math.random() - 0.5) * 20,
        course: Math.random() * 360,
        speed: Math.random() * 25,
        heading: Math.random() * 360,
        timestamp: new Date().toISOString()
      }
    };
  }

  getMockVesselsInArea() {
    const vessels = [];
    for (let i = 0; i < 50; i++) {
      vessels.push(this.getMockVesselInfo(200000000 + i));
    }
    return vessels;
  }

  // Clean up resources
  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.subscribers.clear();
  }
}

export default new AISService();
