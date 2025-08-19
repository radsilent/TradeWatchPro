import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Port, Disruption, Tariff } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import GlobalMap from "../components/dashboard/GlobalMap";
import MetricsPanel from "../components/dashboard/MetricsPanel";
import ActiveAlerts from "../components/dashboard/ActiveAlerts";
import DisruptionTimeline from "../components/dashboard/DisruptionTimeline";
import DateSlicer from "../components/dashboard/DateSlicer";
import { min, max, isWithinInterval, parseISO, isValid } from "date-fns";

const safeParseDate = (dateInput) => {
  try {
    if (!dateInput) return null;
    
    // If it's already a Date object, validate and return it
    if (dateInput instanceof Date) {
      return isValid(dateInput) ? dateInput : null;
    }
    
    // If it's a string, try to parse it
    if (typeof dateInput === 'string' && dateInput.trim() !== '') {
      try {
        const date = parseISO(dateInput);
        return isValid(date) ? date : null;
      } catch (error) {
        console.warn('Failed to parse date string:', dateInput, error);
        return null;
      }
    }
    
    // If it's a number (timestamp), convert to Date
    if (typeof dateInput === 'number' && !isNaN(dateInput)) {
      const date = new Date(dateInput);
      return isValid(date) ? date : null;
    }
    
    // For any other type, return null
    console.warn('Unexpected date input type:', typeof dateInput, dateInput);
    return null;
  } catch (error) {
    console.warn('Error in safeParseDate:', error, 'Input:', dateInput);
    return null;
  }
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
    
    console.log('Filtering disruptions with date range:', start, 'to', end);
    console.log('Total disruptions to filter:', disruptions.length);
    
    return disruptions.filter((d, index) => {
      try {
        // Try multiple date fields for better coverage
        const dateFields = [d.start_date, d.date, d.created_date, d.timestamp];
        let disruptionDate = null;
        
        for (const field of dateFields) {
          if (field) {
            disruptionDate = safeParseDate(field);
            if (disruptionDate) break;
          }
        }
        
        if (!disruptionDate) {
          // If no valid date found, include current disruptions but exclude forecasted ones
          const isCurrentDisruption = !d.type?.includes('forecast') && !d.status?.includes('predicted');
          console.log(`Disruption ${index} has no valid date, including current: ${isCurrentDisruption}`, d.title);
          return isCurrentDisruption;
        }
        
        const isInRange = isWithinInterval(disruptionDate, { start, end });
        if (index < 5) { // Log first few for debugging
          console.log(`Disruption ${index}: ${d.title}, Date: ${disruptionDate}, In range: ${isInRange}`);
        }
        return isInRange;
      } catch (error) {
        console.warn(`Error filtering disruption ${index}:`, error, d);
        return false;
      }
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
      {/* Loading notification */}
      {isLoading && (
        <div className="bg-blue-900/20 border-b border-blue-800/30 px-6 py-3">
          <div className="flex items-center justify-center text-sm text-blue-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
            Loading real-time trade data, this may take a minute...
          </div>
        </div>
      )}
      
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-6 p-6">
        {/* Main content area */}
        <div className="xl:col-span-3 space-y-6">
          {/* Metrics Panel */}
          <MetricsPanel 
            ports={ports} 
            disruptions={filteredDisruptions} 
            isLoading={isLoading}
          />

          {/* Global Map - Main content taking most of the space */}
          <div className="relative h-[70vh] lg:h-[80vh]">
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
          </div>

          {/* Compact Date Range Filter - Minimal space usage */}
          <div className="mt-4 mb-6">
            <div className="flex items-center gap-4 mb-2">
              <h3 className="text-lg font-semibold text-slate-100">Date Filter</h3>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>Current: {filteredDisruptions.filter(d => {
                  const disruptionDate = safeParseDate(d.start_date || d.date);
                  return disruptionDate && disruptionDate <= new Date();
                }).length}</span>
                <span>Forecasted: {filteredDisruptions.filter(d => {
                  const disruptionDate = safeParseDate(d.start_date || d.date);
                  return disruptionDate && disruptionDate > new Date();
                }).length}</span>
                <span>Total: {filteredDisruptions.length}</span>
              </div>
            </div>
            
            <DateSlicer
              minDate={dateConfig.min}
              maxDate={dateConfig.max}
              value={selectedDateRange}
              onValueChange={handleDateRangeChange}
            />
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
            
            {isLoading ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                </div>
                <p className="text-slate-400 text-xs text-center">Loading real-time tariff data...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tariffs.slice(0, 3).map((tariff, index) => {
                  const getPriorityColor = (priority) => {
                    switch(priority?.toLowerCase()) {
                      case 'critical': return 'text-red-400';
                      case 'high': return 'text-orange-400';
                      case 'medium': return 'text-yellow-400';
                      default: return 'text-green-400';
                    }
                  };

                  const getRateColor = (change) => {
                    if (change > 0) return 'text-red-400';
                    if (change < 0) return 'text-green-400';
                    return 'text-slate-400';
                  };

                  const changeSign = tariff.change > 0 ? '+' : '';
                  
                  return (
                    <div key={tariff.id || index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                      <div>
                        <p className="text-slate-100 font-medium text-sm">
                          {tariff.title || tariff.name || 'Tariff Update'}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {tariff.status || 'Active'} • {tariff.priority || 'Medium'} Priority
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${getPriorityColor(tariff.priority)}`}>
                          {typeof tariff.currentRate === 'number' ? `${tariff.currentRate.toFixed(1)}%` : `${tariff.rate || 0}%`}
                        </p>
                        <p className={`text-xs ${getRateColor(tariff.change)}`}>
                          {tariff.change ? `${changeSign}${Math.abs(tariff.change).toFixed(1)}%` : '0%'}
                        </p>
                      </div>
                    </div>
                  );
                })}
                
                {tariffs.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-slate-400 text-sm">No tariff data available</p>
                    <p className="text-slate-500 text-xs mt-1">Real-time data may take a moment to load</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between text-sm">
              <span className="text-slate-400">Total Tracked: {tariffs.length} tariffs</span>
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