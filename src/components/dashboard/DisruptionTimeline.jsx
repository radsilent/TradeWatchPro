
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, DollarSign, ExternalLink, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import { format, subDays, isAfter, isFuture, isValid, parseISO } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Safe date parsing function
const safeParseDate = (dateString) => {
  if (!dateString) return new Date();
  
  try {
    // Try parsing as ISO string first
    const parsed = parseISO(dateString);
    if (isValid(parsed)) return parsed;
    
    // Try parsing as regular Date
    const date = new Date(dateString);
    if (isValid(date)) return date;
    
    // Return current date as fallback
    return new Date();
  } catch (error) {
    console.warn('Invalid date:', dateString);
    return new Date();
  }
};

// Safe date formatting function
const safeFormatDate = (dateString, formatStr = "MMM d, yyyy") => {
  const date = safeParseDate(dateString);
  try {
    return format(date, formatStr);
  } catch (error) {
    console.warn('Date formatting error:', dateString);
    return 'Invalid Date';
  }
};

export default function DisruptionTimeline({ disruptions, selectedPort }) {
  const [showForecasts, setShowForecasts] = useState(true);

  const filteredDisruptions = useMemo(() => {
    let filtered = [...disruptions]; // Changed to initialize with a copy of disruptions

    // Show/hide forecasts
    if (!showForecasts) {
      filtered = filtered.filter(d => {
        const date = safeParseDate(d.start_date);
        return !isFuture(date);
      });
    }

    // Selected Port filter (by region)
    if (selectedPort && selectedPort.region) {
      filtered = filtered.filter(d => 
        d.affected_regions?.includes(selectedPort.region)
      );
    }
    
    return filtered
      .sort((a, b) => {
        const dateA = safeParseDate(a.start_date);
        const dateB = safeParseDate(b.start_date);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 15);
  }, [disruptions, selectedPort, showForecasts]);

  const getTypeColor = (type) => {
    const colors = {
      geopolitical: 'bg-red-100 text-red-800 border-red-200',
      weather: 'bg-blue-100 text-blue-800 border-blue-200',
      infrastructure: 'bg-gray-100 text-gray-800 border-gray-200',
      cyber: 'bg-purple-100 text-purple-800 border-purple-200',
      economic: 'bg-green-100 text-green-800 border-green-200',
      environmental: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    };
    return colors[type] || colors.infrastructure;
  };

  const isForecastEvent = (dateString) => {
    const date = safeParseDate(dateString);
    return isFuture(date);
  };

  return (
    <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50 shadow-xl">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            Timeline
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForecasts(!showForecasts)}
              className={`border-slate-600 text-xs ${showForecasts ? 'bg-slate-700 text-slate-200' : 'text-slate-400'}`}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Forecasts
            </Button>
          </div>
        </div>
        {selectedPort && (
          <p className="text-sm text-slate-400 mt-2">
            Showing events affecting the <span className="font-semibold text-slate-300">{selectedPort.region}</span> region
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredDisruptions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-400 text-sm">No disruptions found for the selected filters.</p>
            </div>
          ) : (
            filteredDisruptions.map((disruption, index) => {
              const isForecasted = isForecastEvent(disruption.start_date);
              
              return (
                <div key={disruption.id} className="relative">
                  {index !== filteredDisruptions.length - 1 && (
                    <div className={`absolute left-4 top-8 w-px h-full ${
                      isForecasted ? 'bg-amber-500/30' : 'bg-slate-600/50'
                    }`}></div>
                  )}
                  
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                      isForecasted ? 'bg-amber-600/20 border-2 border-amber-500/50' : 'bg-slate-700'
                    }`}>
                      <div className={`w-3 h-3 rounded-full ${
                        isForecasted ? 'bg-amber-400' : 'bg-slate-400'
                      }`}></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium text-sm leading-tight ${
                            isForecasted ? 'text-amber-200' : 'text-slate-200'
                          }`}>
                            {disruption.title}
                          </h4>
                          {isForecasted && (
                            <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400 bg-amber-500/10">
                              Forecast
                            </Badge>
                          )}
                        </div>
                        <Badge className={`${getTypeColor(disruption.type)} border text-xs flex-shrink-0 ml-2`}>
                          {disruption.type}
                        </Badge>
                      </div>
                      
                      <p className={`text-xs mb-3 leading-relaxed ${
                        isForecasted ? 'text-slate-300' : 'text-slate-400'
                      }`}>
                        {disruption.description?.length > 80 
                          ? `${disruption.description.substring(0, 80)}...` 
                          : disruption.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span className={`font-medium ${isForecasted ? 'text-amber-400' : ''}`}>
                            {safeFormatDate(disruption.start_date)}
                          </span>
                        </div>
                        
                        {disruption.economic_impact && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span>${disruption.economic_impact}M impact</span>
                          </div>
                        )}

                        {isForecasted && disruption.confidence_score && (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{disruption.confidence_score}% confidence</span>
                          </div>
                        )}
                      </div>

                      {disruption.source_url && !isForecasted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-700/50"
                          onClick={() => window.open(disruption.source_url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Source
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
