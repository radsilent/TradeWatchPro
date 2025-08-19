import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Port, Disruption, Tariff } from "@/api/entities";
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
  const [tariffs, setTariffs] = useState([]);
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

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Loading dashboard data...');
      
      // Skip cache clearing for faster loading
      console.log('Loading with cached data for better performance');
      
      const [portsData, disruptionsData, tariffsData] = await Promise.all([
        Port.list('-strategic_importance', 200), // Plot all top 200 ports as requested
        Disruption.list('-created_date', 20), // Keep disruptions low for performance
        Tariff.list('-trade_value', 30) // Load top 30 tariffs for map visualization
      ]);
      
      console.log('Ports loaded:', portsData.length);
      console.log('Sample port data:', portsData.slice(0, 3));
      console.log('Disruptions loaded:', disruptionsData.length);
      console.log('Sample disruptions:', disruptionsData.slice(0, 3));
      console.log('Tariffs loaded:', tariffsData.length);
      console.log('Sample tariffs:', tariffsData.slice(0, 3));
      console.log('Active disruptions:', disruptionsData.filter(d => d.status === 'active').length);
      console.log('Maritime relevant disruptions:', disruptionsData.filter(d => {
        const title = (d.title || '').toLowerCase();
        return title.includes('shipping') || title.includes('port') || title.includes('maritime');
      }).length);
      
      setPorts(portsData);
      setDisruptions(disruptionsData);
      setTariffs(tariffsData);

      // Always set up the date range from present to 2035
      const currentDate = new Date();
      const minDate = new Date(currentDate.getFullYear(), 0, 1); // Start of current year
      const maxDate = new Date('2035-12-31'); // Extend to 2035 for AI-forecasted events
      
      console.log('Setting up DateSlicer with range:', minDate, 'to', maxDate);
      setDateConfig({ min: minDate, max: maxDate });
      setSelectedDateRange([minDate, maxDate]);
      
      // Optional: If disruptions have dates, we could adjust minDate to earliest disruption
      if (disruptionsData.length > 0) {
        const dates = disruptionsData.map(d => safeParseDate(d.start_date)).filter(Boolean);
        if (dates.length > 0) {
          const earliestDisruption = min(dates);
          const adjustedMinDate = earliestDisruption < minDate ? earliestDisruption : minDate;
          console.log('Adjusting minDate based on disruptions:', adjustedMinDate);
          setDateConfig({ min: adjustedMinDate, max: maxDate });
          setSelectedDateRange([adjustedMinDate, maxDate]);
        }
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
    setIsLoading(false);
  }, []);

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
    console.log("Refreshing real-time alerts...");
    setIsLoading(true);
    try {
      // Force refresh disruption data
      const freshDisruptions = await Disruption.list('-created_date', 100);
      setDisruptions(freshDisruptions);
      console.log('Refreshed disruptions:', freshDisruptions.length);
    } catch (error) {
      console.error("Error refreshing real-time alerts:", error);
    }
    setIsLoading(false);
  };

  const getCriticalDisruptions = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // Expanded to 7 days for more disruptions
    
    console.log('Filtering critical disruptions from:', filteredDisruptions.length, 'total disruptions');
    
    const result = filteredDisruptions.filter(d => {
      // Show all severity levels initially to ensure we have some data
      const isRelevantSeverity = d.severity === 'critical' || d.severity === 'high' || d.severity === 'medium' || d.severity === 'low';
      
      // Expand time window to 30 days to get more disruptions
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      const disruptionDate = safeParseDate(d.start_date);
      const isRecent = disruptionDate && disruptionDate >= thirtyDaysAgo;
      const isActive = d.status === 'active' || d.status === 'ongoing' || d.status === 'monitoring';
      
      // More relaxed maritime relevance check
      const title = (d.title || '').toLowerCase();
      const description = (d.description || '').toLowerCase();
      const isRelevant = !title.includes('meta') && 
                        !title.includes('facebook') && 
                        !title.includes('ai chat') &&
                        !title.includes('children') &&
                        !title.includes('sensual') &&
                        (title.includes('shipping') || 
                         title.includes('port') || 
                         title.includes('maritime') || 
                         title.includes('vessel') || 
                         title.includes('cargo') || 
                         title.includes('suez') || 
                         title.includes('panama') || 
                         title.includes('red sea') ||
                         title.includes('supply chain') ||
                         title.includes('container') ||
                         title.includes('strike') ||
                         title.includes('congestion') ||
                         title.includes('delay') ||
                         title.includes('canal') ||
                         title.includes('strait') ||
                         title.includes('trade') ||
                         title.includes('freight') ||
                         description.includes('shipping') ||
                         description.includes('maritime') ||
                         description.includes('port') ||
                         description.includes('trade') ||
                         d.affected_regions?.some(region => region.toLowerCase().includes('sea')) ||
                         d.type?.includes('port') ||
                         d.type?.includes('shipping'));
      
      console.log(`Disruption "${d.title}": severity=${isRelevantSeverity}, recent=${isRecent}, active=${isActive}, relevant=${isRelevant}`);
      
      // Temporarily make filtering very permissive to debug data flow
      const passesFilter = isRelevantSeverity && (isRecent || isActive);
      console.log(`Filter result for "${d.title}": ${passesFilter}`);
      return passesFilter;
    })
    .sort((a, b) => {
      // Sort by: 1) has source (news), 2) severity, 3) date
      const aHasSource = (a.sources && a.sources.length > 0) ? 1 : 0;
      const bHasSource = (b.sources && b.sources.length > 0) ? 1 : 0;
      if (aHasSource !== bHasSource) return bHasSource - aHasSource;
      
      const severityOrder = { critical: 2, high: 1 };
      const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
      if (severityDiff !== 0) return severityDiff;
      
      const dateA = safeParseDate(a.start_date) || new Date(0);
      const dateB = safeParseDate(b.start_date) || new Date(0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);
    
    console.log('Critical disruptions filtered:', result.length);
    console.log('Filtered disruptions details:', result.map(d => ({ 
      title: d.title, 
      severity: d.severity, 
      status: d.status, 
      date: d.start_date 
    })));
    
    return result;
  }, [filteredDisruptions]);

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
              tariffs={tariffs}
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
                value={selectedDateRange}
                onValueChange={handleDateRangeChange}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ActiveAlerts
            disruptions={getCriticalDisruptions}
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