
import React, { useState, useEffect } from "react";
import { Disruption, Port } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Search, ExternalLink, Calendar, DollarSign, MapPin, ShieldCheck, ShieldAlert } from "lucide-react";
import { format, isValid, parseISO, isFuture } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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

const safeFormatDate = (dateString, formatStr = "MMMM d, yyyy") => {
  const date = safeParseDate(dateString);
  try {
    return format(date, formatStr);
  } catch (error) {
    console.warn('Date formatting error:', dateString);
    return 'Invalid Date';
  }
};

export default function DisruptionsPage() {
  const [disruptions, setDisruptions] = useState([]);
  const [filteredDisruptions, setFilteredDisruptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showForecasted, setShowForecasted] = useState(true);

  useEffect(() => {
    loadDisruptions();
  }, []);

  useEffect(() => {
    filterDisruptions();
  }, [disruptions, searchTerm, typeFilter, severityFilter, showForecasted]);

  const loadDisruptions = async () => {
    setIsLoading(true);
    try {
      // Use the same real-time RSS API that the map uses
      const response = await fetch('http://localhost:8001/api/maritime-disruptions');
      const data = await response.json();
      setDisruptions(data.disruptions || []);
    } catch (error) {
      console.error("Error loading disruptions:", error);
    }
    setIsLoading(false);
  };

  const filterDisruptions = () => {
    let filtered = [...disruptions];

    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.affected_regions?.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(d => d.type === typeFilter);
    }

    if (severityFilter !== "all") {
      filtered = filtered.filter(d => d.severity === severityFilter);
    }

    if (!showForecasted) {
      filtered = filtered.filter(d => {
        const date = safeParseDate(d.start_date);
        return !isFuture(date);
      });
    }

    setFilteredDisruptions(filtered);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800 border-blue-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[severity] || colors.medium;
  };

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
  
  const getValidationIcon = (status) => {
    switch (status) {
      case 'verified':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'pending':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Global Disruptions</h1>
          <p className="text-slate-400">Monitor and analyze trade disruption events worldwide</p>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search disruptions, regions, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-slate-100 placeholder-slate-400"
                />
              </div>
              
              <div className="flex gap-3">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600 text-slate-100">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="geopolitical">Geopolitical</SelectItem>
                    <SelectItem value="weather">Weather</SelectItem>
                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                    <SelectItem value="cyber">Cyber</SelectItem>
                    <SelectItem value="economic">Economic</SelectItem>
                    <SelectItem value="environmental">Environmental</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600 text-slate-100">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-slate-700/50">
              <Switch 
                id="forecast-switch" 
                checked={showForecasted} 
                onCheckedChange={setShowForecasted}
              />
              <Label htmlFor="forecast-switch" className="text-slate-300 font-medium">
                Include Forecasted Disruptions
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Disruptions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDisruptions.map((disruption) => {
            const isForecasted = isFuture(safeParseDate(disruption.start_date));
            return (
              <Card key={disruption.id} className={`bg-slate-800/30 backdrop-blur-sm border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 ${isForecasted ? 'border-amber-500/30' : ''}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className={`font-bold text-lg leading-tight ${isForecasted ? 'text-amber-200' : 'text-slate-100'}`}>{disruption.title}</h3>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge className={`${getSeverityColor(disruption.severity)} border text-xs`}>
                        {disruption.severity}
                      </Badge>
                      <Badge className={`${getTypeColor(disruption.type)} border text-xs`}>
                        {disruption.type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {disruption.description}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300 font-medium">
                        {disruption.start_date ? safeFormatDate(disruption.start_date) : 'Date unknown'}
                      </span>
                      {isForecasted && (
                        <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400 bg-amber-500/10">
                          Forecast
                        </Badge>
                      )}
                    </div>
                    
                    {disruption.economic_impact && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <DollarSign className="w-4 h-4" />
                        <span>Economic Impact: ${disruption.economic_impact}M USD</span>
                      </div>
                    )}
                    
                    {disruption.affected_regions && disruption.affected_regions.length > 0 && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                          {disruption.affected_regions.map((region) => (
                            <Badge key={region} variant="outline" className="text-xs border-slate-600 text-slate-300">
                              {region}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between">
                    {disruption.source_url ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-600 hover:bg-slate-700 text-slate-300"
                        onClick={() => window.open(disruption.source_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Source
                      </Button>
                    ) : <div></div>}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {getValidationIcon(disruption.source_validation_status)}
                          <span>{disruption.source_reliability_score || 'N/A'}%</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-800 text-slate-200 border-slate-600">
                        <p>Source Reliability: {disruption.source_validation_status}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredDisruptions.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No disruptions found</h3>
            <p className="text-slate-400">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}
