import React, { useState, useEffect, useMemo } from "react";
import { Port, Disruption } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import GlobalMap from "../components/dashboard/GlobalMap";
import MetricsPanel from "../components/dashboard/MetricsPanel";
import ActiveAlerts from "../components/dashboard/ActiveAlerts";
import DisruptionTimeline from "../components/dashboard/DisruptionTimeline";
import DateSlicer from "../components/dashboard/DateSlicer";
import { min, max, isWithinInterval, parseISO, isValid } from "date-fns";

const safeParseDate = (dateString) => {
  if (!dateString) return null;
  const date = parseISO(dateString);
  return isValid(date) ? date : null;
};

export default function Dashboard() {
  const [ports, setPorts] = useState([]);
  const [disruptions, setDisruptions] = useState([]);
  const [selectedPort, setSelectedPort] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [mapZoom, setMapZoom] = useState(2);
  const [dateConfig, setDateConfig] = useState({ min: null, max: null });
  const [selectedDateRange, setSelectedDateRange] = useState([null, null]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const filteredDisruptions = useMemo(() => {
    if (!selectedDateRange[0] || !selectedDateRange[1]) {
      return disruptions;
    }
    const [start, end] = selectedDateRange;
    return disruptions.filter(d => {
      const disruptionDate = safeParseDate(d.start_date);
      return disruptionDate && isWithinInterval(disruptionDate, { start, end });
    });
  }, [disruptions, selectedDateRange]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading dashboard data...');
      const [portsData, disruptionsData] = await Promise.all([
        Port.list('-strategic_importance', 200), // Get more ports (top 200)
        Disruption.list('-created_date', 50)
      ]);
      
      console.log('Ports loaded:', portsData.length);
      console.log('Disruptions loaded:', disruptionsData.length);
      
      setPorts(portsData);
      setDisruptions(disruptionsData);

      if (disruptionsData.length > 0) {
        const dates = disruptionsData.map(d => safeParseDate(d.start_date)).filter(Boolean);
        if (dates.length > 0) {
          const minDate = min(dates);
          // Extend to 2035 for AI-forecasted events
          const maxDate = new Date('2035-12-31');
          setDateConfig({ min: minDate, max: maxDate });
          setSelectedDateRange([minDate, maxDate]);
        }
      } else {
        // Default range extending to 2035
        const minDate = new Date('2024-01-01');
        const maxDate = new Date('2035-12-31');
        setDateConfig({ min: minDate, max: maxDate });
        setSelectedDateRange([minDate, maxDate]);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
    setIsLoading(false);
  };

  const generateRecentDisruptionData = async () => {
    try {
      const result = await InvokeLLM({
        prompt: `Generate realistic trade disruption events for the past 30 days. Include current real-world issues like:
        - Geopolitical tensions (South China Sea, Red Sea attacks, Ukraine conflict impacts)
        - Weather events (storms, droughts affecting Panama Canal, typhoons)
        - Port strikes and labor disputes
        - Cyber attacks on maritime infrastructure
        - Supply chain bottlenecks
        - Container ship accidents or groundings
        
        For each event, provide:
        - Descriptive title and detailed description
        - Start date within last 30 days
        - Severity level (low, medium, high, critical)
        - Affected regions from major shipping routes
        - Economic impact estimate
        - Current status (active, resolved, monitoring)
        - Confidence score (70-95%)
        - Type (weather, geopolitical, cyber, infrastructure, labor, security)`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            disruptions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  event_date: { type: "string" },
                  severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  affected_regions: { type: "array", items: { type: "string" } },
                  economic_impact: { type: "string" },
                  status: { type: "string", enum: ["active", "resolved", "monitoring"] },
                  confidence_score: { type: "number", minimum: 70, maximum: 95 },
                  type: { type: "string", enum: ["weather", "geopolitical", "cyber", "infrastructure", "labor", "security"] }
                },
                required: ["title", "description", "event_date", "severity", "affected_regions"]
              }
            }
          }
        }
      });

      if (result?.disruptions) {
        // Create disruption records from generated data
        for (const disruptionData of result.disruptions.slice(0, 15)) {
          await Disruption.create({
            ...disruptionData,
            start_date: disruptionData.event_date || new Date().toISOString(),
            affected_ports: [] // Will be populated based on affected_regions
          });
        }
      }
    } catch (error) {
      console.error("Error generating recent disruption data:", error);
    }
  };

  const generateRealTimeAlerts = async () => {
    // Implementation for generating real-time alerts
    console.log("Generating real-time alerts...");
  };

  const getCriticalDisruptions = () => {
    return filteredDisruptions.filter(d => d.severity === 'critical' || d.severity === 'high').slice(0, 5);
  };

  const handlePortClick = (port) => {
    setSelectedPort(port);
    if (port.coordinates) {
      setMapCenter([port.coordinates.lat, port.coordinates.lng]);
      setMapZoom(6);
    }
  };

  const handleDateRangeChange = (range) => {
    setSelectedDateRange(range);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-6 p-6">
        {/* Main content area */}
        <div className="xl:col-span-3 space-y-6">
          {/* Metrics Panel */}
          <MetricsPanel 
            ports={ports} 
            disruptions={filteredDisruptions} 
            isLoading={isLoading}
          />

          {/* Global Map */}
          <div className="relative h-96 lg:h-[600px]">
            <GlobalMap
              ports={ports}
              disruptions={filteredDisruptions}
              selectedPort={selectedPort}
              onPortClick={handlePortClick}
              center={mapCenter}
              zoom={mapZoom}
              isLoading={isLoading}
            />
            
            {/* Date Slicer */}
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <DateSlicer
                minDate={dateConfig.min}
                maxDate={dateConfig.max}
                selectedRange={selectedDateRange}
                onRangeChange={handleDateRangeChange}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ActiveAlerts
            disruptions={getCriticalDisruptions()}
            onGenerateAlerts={generateRealTimeAlerts}
            isLoading={isLoading}
          />
          
          <DisruptionTimeline
            disruptions={filteredDisruptions}
            selectedPort={selectedPort}
          />
          
          {/* Tariff Tracking Overview */}
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-100">Tariff Tracking</h3>
              <a 
                href="/TariffTracking" 
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                View All →
              </a>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="text-slate-100 font-medium text-sm">US-China Steel Tariffs</p>
                  <p className="text-slate-400 text-xs">Active • High Priority</p>
                </div>
                <div className="text-right">
                  <p className="text-red-400 font-bold">25.0%</p>
                  <p className="text-red-400 text-xs">+15.0%</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="text-slate-100 font-medium text-sm">EU Carbon Border Tax</p>
                  <p className="text-slate-400 text-xs">Active • High Priority</p>
                </div>
                <div className="text-right">
                  <p className="text-orange-400 font-bold">18.5%</p>
                  <p className="text-orange-400 text-xs">+18.5%</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="text-slate-100 font-medium text-sm">UK-India Textiles</p>
                  <p className="text-slate-400 text-xs">Active • Medium Priority</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold">5.5%</p>
                  <p className="text-green-400 text-xs">-6.5%</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between text-sm">
              <span className="text-slate-400">Total Tracked: 10 tariffs</span>
              <span className="text-blue-400">Real-time updates</span>
            </div>
          </div>
          
          {/* Vessel Tracking Overview */}
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-100">Key Vessels</h3>
              <a 
                href="/VesselTracking" 
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                Track All →
              </a>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="text-slate-100 font-medium text-sm">MSC GÜLSÜN</p>
                  <p className="text-red-400 text-xs">Delayed • Red Sea</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-300 text-xs">High value cargo</p>
                  <p className="text-red-400 text-xs">18 days delay</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="text-slate-100 font-medium text-sm">EVER GIVEN</p>
                  <p className="text-orange-400 text-xs">Rerouted • Red Sea</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-300 text-xs">High value cargo</p>
                  <p className="text-orange-400 text-xs">15 days delay</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="text-slate-100 font-medium text-sm">MAERSK LIMA</p>
                  <p className="text-red-400 text-xs">Stuck • Panama Canal</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-300 text-xs">Container cargo</p>
                  <p className="text-red-400 text-xs">21 days delay</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between text-sm">
              <span className="text-slate-400">Tracked: 10 vessels</span>
              <span className="text-red-400">4 impacted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}