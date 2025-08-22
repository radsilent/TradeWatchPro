import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Port, Disruption, Tariff } from "@/api/entities";
import { cacheDashboardData, getLastKnownDashboardData, cacheDisruptions, getLastKnownDisruptions } from '@/utils/dataCache';
// InvokeLLM function removed since integrations.js was deleted
import GlobalMap from "../components/dashboard/GlobalMap";
import MetricsPanel from "../components/dashboard/MetricsPanel";
import ActiveAlerts from "../components/dashboard/ActiveAlerts";
import DisruptionTimeline from "../components/dashboard/DisruptionTimeline";
import DateSlicer from "../components/dashboard/DateSlicer";
import AIProjectionsWidget from "../components/dashboard/AIProjectionsWidget";
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [mapZoom, setMapZoom] = useState(2);
  const [dateConfig, setDateConfig] = useState({ min: null, max: null });
  const [selectedDateRange, setSelectedDateRange] = useState([null, null]);
  const [isMobile, setIsMobile] = useState(false);
  
  // Layer visibility controls for performance optimization
  const [layerVisibility, setLayerVisibility] = useState({
    ports: true,
    disruptions: true, 
    tariffs: false, // Start with tariffs disabled for performance
    routes: true
  });

  useEffect(() => {
    loadDashboardDataWithCache();
  }, [layerVisibility]); // Reload data when layer visibility changes

  // Load last known data immediately, then refresh with new data
  const loadDashboardDataWithCache = useCallback(async () => {
    // First, try to load last known data immediately
    const lastKnownData = getLastKnownDashboardData();
    if (lastKnownData) {
      console.log('📦 Loading last known dashboard data immediately');
      setPorts(lastKnownData.ports || []);
      setDisruptions(lastKnownData.disruptions || []);
      setTariffs(lastKnownData.tariffs || []);
      setIsLoading(false); // Show data immediately
      setIsRefreshing(true); // Indicate we're refreshing in background
    }

    // Then load fresh data in background
    await loadDashboardData();
    setIsRefreshing(false);
  }, [layerVisibility]);
  
  useEffect(() => {
    // Mobile detection
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredDisruptions = useMemo(() => {
    console.log('🔍 FILTER DEBUG: selectedDateRange:', selectedDateRange);
    console.log('🔍 FILTER DEBUG: raw disruptions count:', disruptions.length);
    
    // TEMPORARY: Force all disruptions to show for debugging
    console.log('🔍 FILTER DEBUG: TEMPORARILY FORCING ALL DISRUPTIONS TO SHOW');
    return disruptions;
    
    if (!selectedDateRange[0] || !selectedDateRange[1]) {
      console.log('🔍 FILTER DEBUG: No date range selected, returning all disruptions');
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
    console.log('🔍 FILTER DEBUG: Final filtered disruptions count:', result.length);
    return result;
  }, [disruptions, selectedDateRange]);

  const loadDashboardData = useCallback(async () => {
    // Only set loading to true if we don't have any data yet
    if (ports.length === 0 && disruptions.length === 0 && tariffs.length === 0) {
      setIsLoading(true);
    }
    
    try {
      console.log('Loading fresh dashboard data...');
      
      // Reduce data on mobile for better performance
      const dataLimits = isMobile ? { ports: 50, disruptions: 20, tariffs: 100 } : { ports: 200, disruptions: 100, tariffs: 500 };
      
      // Only load data for visible layers to improve performance
      const loadPromises = [];
      
      if (layerVisibility.ports) {
        loadPromises.push(Port.list('-strategic_importance', dataLimits.ports));
      } else {
        loadPromises.push(Promise.resolve([]));
      }
      
      if (layerVisibility.disruptions) {
        // Use environment-aware API endpoint
        const { default: config } = await import('../config/environment.js');
        loadPromises.push(fetch(`${config.API_BASE_URL}/api/maritime-disruptions`).then(res => res.json()).then(data => data.disruptions || []));
      } else {
        loadPromises.push(Promise.resolve([]));
      }
      
      if (layerVisibility.tariffs) {
        loadPromises.push(Tariff.list('-trade_value', dataLimits.tariffs));
      } else {
        loadPromises.push(Promise.resolve([]));
      }
      
      const [portsData, disruptionsData, tariffsData] = await Promise.all(loadPromises);
      
      console.log('Fresh data loaded - Ports:', portsData.length, 'Disruptions:', disruptionsData.length, 'Tariffs:', tariffsData.length);
      
      // Cache the new data
      const dashboardData = { ports: portsData, disruptions: disruptionsData, tariffs: tariffsData };
      cacheDashboardData(dashboardData);
      
      setPorts(portsData);
      setDisruptions(disruptionsData);
      setTariffs(tariffsData);
      // Vessels not loaded on dashboard for performance

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
  }, [isMobile]); // Include isMobile to reload data when device type changes

  // Removed InvokeLLM call - now using real data sources only
  const generateRecentDisruptionData = async () => {
    // This function is no longer needed since we fetch real disruption data
    // from authoritative sources in the loadData function
    console.log("Disruption data now comes from real maritime news sources");
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

      {/* Refresh notification */}
      {isRefreshing && !isLoading && (
        <div className="bg-green-900/20 border-b border-green-800/30 px-6 py-3">
          <div className="flex items-center justify-center text-sm text-green-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400 mr-2"></div>
            Refreshing data in background...
          </div>
        </div>
      )}
      
      <div className={`flex-1 grid grid-cols-1 ${isMobile ? '' : 'xl:grid-cols-4'} gap-4 ${isMobile ? 'p-3' : 'p-6'}`}>
        {/* Main content area */}
        <div className={`${isMobile ? '' : 'xl:col-span-3'} space-y-4`}>
          {/* Metrics Panel */}
          <MetricsPanel 
            ports={ports} 
            disruptions={filteredDisruptions} 
            isLoading={isLoading}
          />

          {/* Global Map - Hidden on mobile, replaced with summary */}
          {!isMobile ? (
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
                layerVisibility={layerVisibility}
                onLayerVisibilityChange={setLayerVisibility}
              />
            </div>
          ) : (
            <div className="bg-slate-800/50 rounded-lg p-6 text-center">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900/20 rounded-full mb-4">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Global Maritime Overview</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Interactive map disabled for mobile performance. View detailed data below.
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-400">{ports.length}</div>
                  <div className="text-xs text-slate-400">Active Ports</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="text-2xl font-bold text-orange-400">{filteredDisruptions.length}</div>
                  <div className="text-xs text-slate-400">Disruptions</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-400">{tariffs.length}</div>
                  <div className="text-xs text-slate-400">Active Tariffs</div>
                </div>
              </div>
              
              <div className="mt-4 text-xs text-slate-500">
                💡 Switch to desktop for full interactive map experience
              </div>
            </div>
          )}

          {/* Simple Date Range Slicer - Just the slider */}
          <div className="mt-4 mb-4">
            <DateSlicer
              minDate={dateConfig.min}
              maxDate={dateConfig.max}
              value={selectedDateRange}
              onValueChange={handleDateRangeChange}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className={`space-y-4 ${isMobile ? 'order-first' : ''}`}>
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
          
          {/* Vessel Tracking - Link to dedicated page */}
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-100">Vessel Tracking</h3>
              <a 
                href="/VesselTracking" 
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                View All →
              </a>
            </div>
            
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900/20 rounded-full mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-slate-100 mb-2">Live Vessel Tracking</h4>
              <p className="text-slate-400 text-sm mb-4">
                Real-time monitoring of thousands of maritime vessels worldwide
              </p>
              <a 
                href="/VesselTracking"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Track Vessels
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}