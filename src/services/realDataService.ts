/**
 * Real Data Service - Connects to the live TradeWatch API
 * Provides real AIS vessel data, tariff data, and maritime disruptions
 */

const API_BASE_URL = 'https://tradewatch-backend.collaromatt.workers.dev';

export interface Vessel {
  id: string;
  imo?: string;
  mmsi?: string;
  name: string;
  type: string;
  coordinates: [number, number];
  latitude: number;
  longitude: number;
  course: number;
  speed: number;
  heading?: number;
  length?: number;
  beam?: number;
  status: string;
  destination?: string;
  flag?: string;
  timestamp: string;
  last_updated: string;
  draft?: number;
  dwt?: number;
  cargo_capacity?: number;
  built_year?: number;
  operator?: string;
  route?: string;
  impacted: boolean;
  riskLevel: string;
  priority: string;
  data_source?: string;
  source?: string;
}

export interface VesselResponse {
  vessels: Vessel[];
  total: number;
  limit: number;
  data_source: string;
  real_data_percentage: number;
  timestamp: string;
}

export interface Tariff {
  id: string;
  name: string;
  type: string;
  rate: string;
  status: string;
  priority: string;
  countries: string[];
  importer: string;
  exporter: string;
  products: string[];
  product_category: string;
  effective_date: string;
  economic_impact: string;
  trade_volume: string;
  sources: Array<{
    name: string;
    url: string;
    last_updated: string;
    document_type?: string;
    reliability?: string;
  }>;
}

export interface TariffResponse {
  tariffs: Tariff[];
  total: number;
  limit: number;
  data_source: string;
  timestamp: string;
  sources: string[];
}

export interface Disruption {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  status: string;
  type: string;
  coordinates: [number, number];
  affected_regions: string[];
  start_date: string;
  end_date?: string;
  created_date: string;
  source_url?: string;
  confidence: number;
  last_updated: string;
  category: string;
  event_type: 'current' | 'prediction';
  is_prediction: boolean;
  quality_score: number;
  sources?: Array<{
    name: string;
    url: string;
    reliability: string;
    published_date: string;
  }>;
}

export interface DisruptionResponse {
  disruptions: Disruption[];
  total: number;
  current_events: number;
  future_predictions: number;
  data_source: string;
  last_updated: string;
}

export interface Port {
  id: string;
  name: string;
  country: string;
  coordinates: [number, number];
  lat: number;
  lng: number;
  strategic_importance: number;
  annual_teu: number;
  port_type: string;
  status: string;
  capacity_utilization: number;
  depth_meters: number;
  berths: number;
  crane_count: number;
  storage_area_hectares: number;
  rail_connectivity: boolean;
  road_connectivity: boolean;
  customs_24_7: boolean;
  free_trade_zone: boolean;
  last_updated: string;
  timezone: string;
  region: string;
}

class RealDataService {
  private async fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async getVessels(limit: number = 1000): Promise<VesselResponse> {
    try {
      console.log(`🚢 Fetching ${limit} real vessels from TradeWatch API...`);
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/vessels?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Successfully fetched ${data.total} vessels (${data.real_data_percentage}% real data)`);
      return data;
    } catch (error) {
      console.error('❌ Error fetching vessels:', error);
      throw new Error(`Failed to fetch vessel data: ${error.message}`);
    }
  }

  async getTariffs(limit: number = 100): Promise<TariffResponse> {
    try {
      console.log(`📊 Fetching ${limit} real tariffs from government APIs...`);
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/tariffs?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Successfully fetched ${data.total} tariffs from: ${data.sources?.join(', ')}`);
      return data;
    } catch (error) {
      console.error('❌ Error fetching tariffs:', error);
      throw new Error(`Failed to fetch tariff data: ${error.message}`);
    }
  }

  async getDisruptions(): Promise<DisruptionResponse> {
    try {
      console.log('🚨 Fetching real-time maritime disruptions...');
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/maritime-disruptions`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Successfully fetched ${data.total} disruptions (${data.current_events} current, ${data.future_predictions} predictions)`);
      return data;
    } catch (error) {
      console.error('❌ Error fetching disruptions:', error);
      throw new Error(`Failed to fetch disruption data: ${error.message}`);
    }
  }

  async getPorts(limit: number = 50): Promise<Port[]> {
    try {
      console.log(`🏭 Fetching ${limit} major ports...`);
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/ports?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Successfully fetched ${data.length} ports`);
      return data;
    } catch (error) {
      console.error('❌ Error fetching ports:', error);
      throw new Error(`Failed to fetch port data: ${error.message}`);
    }
  }

  async getHealthStatus(): Promise<any> {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ Error checking API health:', error);
      throw new Error(`Failed to check API health: ${error.message}`);
    }
  }

  // Helper method to check if API is available
  async isApiAvailable(): Promise<boolean> {
    try {
      await this.getHealthStatus();
      return true;
    } catch (error) {
      console.warn('⚠️ Real data API not available, falling back to mock data');
      return false;
    }
  }

  // Get vessels with impact analysis
  async getVesselsWithImpact(limit: number = 1000): Promise<{vessels: Vessel[], impactedCount: number, totalCount: number}> {
    const data = await this.getVessels(limit);
    const impactedCount = data.vessels.filter(v => v.impacted).length;
    
    return {
      vessels: data.vessels,
      impactedCount,
      totalCount: data.total
    };
  }

  // Get high-priority disruptions
  async getCriticalDisruptions(): Promise<Disruption[]> {
    const data = await this.getDisruptions();
    return data.disruptions.filter(d => 
      d.severity === 'high' && 
      d.status === 'active' && 
      d.event_type === 'current'
    );
  }

  // Get tariffs by country
  async getTariffsByCountry(country: string): Promise<Tariff[]> {
    const data = await this.getTariffs();
    return data.tariffs.filter(t => 
      t.countries.includes(country) || 
      t.importer === country || 
      t.exporter === country
    );
  }
}

// Export singleton instance
export const realDataService = new RealDataService();
export default realDataService;
