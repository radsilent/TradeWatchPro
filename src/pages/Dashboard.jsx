
import React, { useState, useEffect, useMemo } from "react";
import { Port, Disruption } from "@/api/entities";
import { fetchRealTimeDisruptions, getTop200Ports } from "@/api/integrations";
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
      // Load top 200 ports
      const top200Ports = getTop200Ports();
      setPorts(top200Ports);

      // Fetch real-time disruptions from news
      const realTimeDisruptions = await fetchRealTimeDisruptions();
      setDisruptions(realTimeDisruptions);

      // Set date range for disruptions (past 30 days to 2030)
      if (realTimeDisruptions.length > 0) {
        const dates = realTimeDisruptions.map(d => safeParseDate(d.start_date)).filter(Boolean);
        if (dates.length > 0) {
          const minDate = min(dates);
          const maxDate = max(dates);
          setDateConfig({ min: minDate, max: maxDate });
          setSelectedDateRange([minDate, maxDate]);
        }
      } else {
        // Default date range if no disruptions
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        setDateConfig({ min: thirtyDaysAgo, max: now });
        setSelectedDateRange([thirtyDaysAgo, now]);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
    setIsLoading(false);
  };

  const generateRealTimeAlerts = async () => {
    try {
      // Fetch latest real-time disruptions
      const latestDisruptions = await fetchRealTimeDisruptions();
      setDisruptions(latestDisruptions);
    } catch (error) {
      console.error("Error generating real-time alerts:", error);
    }
  };

  const getPortsByStatus = () => {
    const statusCounts = {
      normal: ports.filter(p => p.status === 'normal').length,
      minor_disruption: ports.filter(p => p.status === 'minor_disruption').length,
      major_disruption: ports.filter(p => p.status === 'major_disruption').length,
      closed: ports.filter(p => p.status === 'closed').length
    };
    return statusCounts;
  };

  const getCriticalDisruptions = () => {
    return filteredDisruptions.filter(d => d.severity === 'critical' || d.severity === 'high');
  };

  const handlePortClick = (port) => {
    setSelectedPort(port);
    setMapCenter([port.coordinates.lat, port.coordinates.lng]);
    setMapZoom(8);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-6 p-6">
        {/* Main Map Area */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Global Trade Monitor</h1>
                  <p className="text-slate-400 mt-1">Real-time port status and disruption tracking</p>
                </div>
                <MetricsPanel 
                  totalPorts={ports.length}
                  statusCounts={getPortsByStatus()}
                  activeDisruptions={getCriticalDisruptions().length}
                />
              </div>
              
              {/* Real-time Data Info */}
              <div className="mt-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">Real-time News Integration</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Data sourced from real-time news APIs covering <span className="text-slate-300">200+ major ports worldwide</span> and 
                  <span className="text-slate-300"> trade disruption events until 2030</span>. 
                  News sources include Reuters, Bloomberg, BBC, and maritime industry publications.
                </p>
              </div>
            </div>
            
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
              
              <DateSlicer
                minDate={dateConfig.min}
                maxDate={dateConfig.max}
                value={selectedDateRange}
                onValueChange={setSelectedDateRange}
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
          
          {/* Real-time News Feed */}
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-6">
            <h3 className="text-xl font-semibold text-slate-100 mb-3">Live News Feed</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {disruptions.slice(0, 5).map((disruption, index) => (
                <div key={index} className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                  <h4 className="text-sm font-medium text-slate-200 mb-1">{disruption.title}</h4>
                  <p className="text-xs text-slate-400 mb-2">{disruption.description}</p>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs px-2 py-1 rounded ${
                      disruption.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                      disruption.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                      disruption.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-green-500/20 text-green-300'
                    }`}>
                      {disruption.severity}
                    </span>
                    <span className="text-xs text-slate-500">
                      {disruption.sources?.[0] || 'News Source'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
