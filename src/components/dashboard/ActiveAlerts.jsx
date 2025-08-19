import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RefreshCw, ExternalLink, Calendar } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";

// Safe date parsing and formatting functions
const safeParseDate = (dateString) => {
  if (!dateString) return new Date();
  
  try {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) return parsed;
    
    const date = new Date(dateString);
    if (isValid(date)) return date;
    
    return new Date();
  } catch (error) {
    console.warn('Invalid date:', dateString);
    return new Date();
  }
};

const safeFormatDate = (dateString, formatStr = "MMM d, yyyy") => {
  const date = safeParseDate(dateString);
  try {
    return format(date, formatStr);
  } catch (error) {
    console.warn('Date formatting error:', dateString);
    return 'Invalid Date';
  }
};

export default function ActiveAlerts({ disruptions = [], onGenerateAlerts, isLoading }) {
  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800 border-blue-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[severity] || colors.medium;
  };

  const getTypeIcon = (type) => {
    return AlertTriangle;
  };

  return (
    <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Critical Alerts
          </CardTitle>
          <Button
            onClick={onGenerateAlerts}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="border-slate-600 hover:bg-slate-700 text-slate-300"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {disruptions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-400 text-sm">No critical alerts at this time</p>
            <Button 
              onClick={onGenerateAlerts}
              variant="outline"
              size="sm"
              className="mt-3 border-slate-600 hover:bg-slate-700 text-slate-300"
            >
              Generate Real-time Alerts
            </Button>
          </div>
        ) : (
          disruptions.map((disruption) => {
            const TypeIcon = getTypeIcon(disruption.type);
            return (
              <div key={disruption.id} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TypeIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <h3 className="font-semibold text-slate-100 text-sm leading-tight">{disruption.title}</h3>
                  </div>
                  <Badge className={`${getSeverityColor(disruption.severity)} border text-xs flex-shrink-0`}>
                    {disruption.severity}
                  </Badge>
                </div>
                
                <p className="text-slate-300 text-xs mb-3 leading-relaxed">
                  {disruption.description}
                </p>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-400 text-xs font-medium">
                      {disruption.start_date ? safeFormatDate(disruption.start_date) : 'Date unknown'}
                    </span>
                  </div>
                  
                  {disruption.confidence_score && (
                    <div className="text-xs text-slate-400">
                      {disruption.confidence_score}% confidence
                    </div>
                  )}
                </div>
                
                {disruption.affected_regions && disruption.affected_regions.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {disruption.affected_regions.slice(0, 2).map((region) => (
                      <Badge key={region} variant="outline" className="text-xs border-slate-600 text-slate-300">
                        {region}
                      </Badge>
                    ))}
                    {disruption.affected_regions.length > 2 && (
                      <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                        +{disruption.affected_regions.length - 2} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Display source links from sources array or direct source_url */}
                {((disruption.sources && disruption.sources.length > 0) || disruption.source_url) && (
                  <div className="pt-2 border-t border-slate-600/30">
                    <div className="flex flex-wrap gap-2">
                      {disruption.sources && disruption.sources.length > 0 ? (
                        disruption.sources.slice(0, 2).map((source, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                            onClick={() => window.open(source.url, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            {source.name || 'News Source'}
                          </Button>
                        ))
                      ) : disruption.source_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                          onClick={() => window.open(disruption.source_url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View Source
                        </Button>
                      )}
                      {disruption.sources && disruption.sources.length > 2 && (
                        <span className="text-xs text-slate-500 py-2">
                          +{disruption.sources.length - 2} more sources
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}