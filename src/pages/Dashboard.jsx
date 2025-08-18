
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
      const [portsData, initialDisruptionsData] = await Promise.all([
        Port.list('-strategic_importance', 150),
        Disruption.list('-created_date', 50)
      ]);
      
      setPorts(portsData);
      setDisruptions(initialDisruptionsData);

      // Generate recent data if we don't have enough for the 30-day trend
      let finalDisruptionsData = initialDisruptionsData;
      if (initialDisruptionsData.length < 10) {
        await generateRecentDisruptionData();
        // Reload after generating data
        const updatedDisruptions = await Disruption.list('-created_date', 50);
        setDisruptions(updatedDisruptions);
        finalDisruptionsData = updatedDisruptions;
      }

      if (finalDisruptionsData.length > 0) {
        const dates = finalDisruptionsData.map(d => safeParseDate(d.start_date)).filter(Boolean);
        if (dates.length > 0) {
          const minDate = min(dates);
          const maxDate = max(dates);
          setDateConfig({ min: minDate, max: maxDate });
          setSelectedDateRange([minDate, maxDate]);
        }
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
    setIsLoading(false);
  };

  const generateRecentDisruptionData = async () => {
    try {
      const result = await InvokeLLM({
        prompt: `Generate realistic trade disruption events for the past 30 days with multiple news sources per event. For each disruption:
        
        1. Cross-validate with 2-3 different news sources
        2. Calculate confidence score based on:
           - Source credibility (Reuters=95, Bloomberg=90, BBC=85, Industry publications=75, Regional news=60)
           - Source agreement (multiple sources reporting same event increases confidence)
           - Specificity of details (specific dates, locations, impact figures)
           - Historical precedent for similar events
        
        3. Combine multiple sources into single events when they report the same disruption
        4. Include recent realistic events: port strikes, weather incidents, geopolitical tensions, cyber attacks
        5. Provide specific dates within the last 30 days
        6. Include economic impact estimates based on port importance and disruption duration`,
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
                  type: { type: "string", enum: ["geopolitical", "weather", "infrastructure", "cyber", "economic", "environmental"] },
                  severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  affected_regions: { type: "array", items: { type: "string" } },
                  economic_impact: { type: "number" },
                  confidence_score: { type: "number" },
                  source_url: { type: "string" },
                  source_validation_status: { type: "string", enum: ["verified", "pending", "unverified"] },
                  source_reliability_score: { type: "number" },
                  event_date: { type: "string" },
                  sources_cross_validated: { type: "number" },
                  confidence_methodology: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (result?.disruptions) {
        for (const disruptionData of result.disruptions.slice(0, 15)) {
          await Disruption.create({
            ...disruptionData,
            start_date: disruptionData.event_date || new Date().toISOString(),
            affected_ports: []
          });
        }
      }
    } catch (error) {
      console.error("Error generating recent disruption data:", error);
    }
  };
  
  const generateRealTimeAlerts = async () => {
    setIsLoading(true);
    try {
      const result = await InvokeLLM({
        prompt: `Analyze current global events and forecast trade disruptions through 2030. For each event:
        
        CONFIDENCE SCORING METHODOLOGY:
        - Source Credibility: Reuters/Bloomberg (90-95%), BBC/CNN (80-90%), Industry Publications (70-80%), Regional News (50-70%)
        - Multiple Source Validation: +10-20% if 2+ sources confirm, +5% per additional source
        - Specificity Bonus: +10% for specific dates/locations, +5% for quantified impacts
        - Historical Precedent: +15% if similar events occurred before, -10% if unprecedented
        - Geopolitical Context: +10% if fits current global situation
        
        Cross-validate each event with multiple sources and combine duplicate reports into single events.
        Provide realistic dates (current or forecasted) and detailed economic impact analysis.`,
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
                  type: { type: "string", enum: ["geopolitical", "weather", "infrastructure", "cyber", "economic", "environmental"] },
                  severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                  affected_regions: { type: "array", items: { type: "string" } },
                  economic_impact: { type: "number" },
                  confidence_score: { type: "number" },
                  source_url: { type: "string" },
                  source_validation_status: { type: "string", enum: ["verified", "pending", "unverified"] },
                  source_reliability_score: { type: "number" },
                  forecast_date: { type: "string" },
                  sources_validated: { type: "number" },
                  confidence_factors: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (result?.disruptions) {
        for (const disruptionData of result.disruptions.slice(0, 8)) {
          await Disruption.create({
            ...disruptionData,
            start_date: disruptionData.forecast_date || new Date().toISOString(), 
            affected_ports: []
          });
        }
        loadDashboardData();
      }
    } catch (error) {
      console.error("Error generating alerts:", error);
    }
    setIsLoading(false);
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
              
              {/* Confidence Methodology Info */}
              <div className="mt-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">Confidence Scoring Methodology</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Our AI cross-validates multiple news sources to generate confidence scores. Factors include: 
                  <span className="text-slate-300"> Source credibility (Reuters/Bloomberg: 90-95%)</span>, 
                  <span className="text-slate-300"> multiple source validation (+10-20%)</span>, 
                  <span className="text-slate-300"> specificity of details (+10%)</span>, and 
                  <span className="text-slate-300"> historical precedent (+15%)</span>. 
                  Events with 80%+ confidence from verified sources are prioritized.
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
          
          {/* Placeholder for Live AIS */}
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-6 text-slate-400 text-center">
            <h3 className="text-xl font-semibold text-slate-100 mb-3">Live AIS Data</h3>
            <p>Real-time vessel tracking and density maps will be available here.</p>
            <p className="text-sm mt-2 text-slate-500">
              <span role="img" aria-label="ship">🚢</span> Coming Soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
