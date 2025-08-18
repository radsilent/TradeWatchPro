import React, { useState, useEffect, useMemo } from "react";
import { Disruption, Port } from "@/api/entities";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, ArrowUpDown, Calendar as CalendarIcon } from "lucide-react";
import { format, isValid, parseISO, isWithinInterval, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const safeParseDate = (dateString) => {
  if (!dateString) return null;
  const date = parseISO(dateString);
  return isValid(date) ? date : null;
};

const safeFormatDate = (dateString, formatStr = "MMM d, yyyy") => {
  const date = safeParseDate(dateString);
  return date ? format(date, formatStr) : "N/A";
};

export default function ImpactedPortsPage() {
  const [impactedData, setImpactedData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: 'startDate', direction: 'descending' });
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateRange, setCustomDateRange] = useState([null, null]);

  useEffect(() => {
    loadImpactedData();
  }, []);

  const loadImpactedData = async () => {
    setIsLoading(true);
    try {
      const [disruptions, ports] = await Promise.all([
        Disruption.list('-start_date', 500),
        Port.list('', 1000)
      ]);

      const data = [];
      disruptions.forEach(disruption => {
        if (disruption.affected_regions && disruption.affected_regions.length > 0) {
          ports.forEach(port => {
            if (port.region && disruption.affected_regions.includes(port.region)) {
              data.push({
                id: `${disruption.id}-${port.id}`,
                portName: port.name,
                portCountry: port.country,
                portRegion: port.region,
                disruptionTitle: disruption.title,
                disruptionType: disruption.type,
                disruptionSeverity: disruption.severity,
                startDate: disruption.start_date,
                economicImpact: disruption.economic_impact || 0,
                sourceUrl: disruption.source_url
              });
            }
          });
        }
      });
      setImpactedData(data);
    } catch (error) {
      console.error("Error loading impacted port data:", error);
    }
    setIsLoading(false);
  };
  
  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-blue-900/50 text-blue-300 border-blue-700',
      medium: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
      high: 'bg-orange-900/50 text-orange-300 border-orange-700',
      critical: 'bg-red-900/50 text-red-300 border-red-700'
    };
    return colors[severity] || colors.medium;
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getDateFilterRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case '7d':
        return [subDays(now, 7), now];
      case '30d':
        return [subDays(now, 30), now];
      case '90d':
        return [subDays(now, 90), now];
      case '365d':
        return [subDays(now, 365), now];
      case 'custom':
        return customDateRange[0] && customDateRange[1] ? customDateRange : [null, null];
      default:
        return [null, null];
    }
  };

  const sortedAndFilteredData = useMemo(() => {
    let filtered = [...impactedData];

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.portName?.toLowerCase().includes(lowercasedTerm) ||
        item.portCountry?.toLowerCase().includes(lowercasedTerm) ||
        item.portRegion?.toLowerCase().includes(lowercasedTerm) ||
        item.disruptionTitle?.toLowerCase().includes(lowercasedTerm)
      );
    }
    
    if (severityFilter !== "all") {
      filtered = filtered.filter(item => item.disruptionSeverity === severityFilter);
    }
    
    if (typeFilter !== "all") {
      filtered = filtered.filter(item => item.disruptionType === typeFilter);
    }

    // Date filtering
    const [startDate, endDate] = getDateFilterRange();
    if (startDate && endDate) {
      filtered = filtered.filter(item => {
        const itemDate = safeParseDate(item.startDate);
        return itemDate && isWithinInterval(itemDate, { start: startDate, end: endDate });
      });
    }
    
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Handle date sorting
      if (sortConfig.key === 'startDate') {
        aValue = safeParseDate(aValue)?.getTime() || 0;
        bValue = safeParseDate(bValue)?.getTime() || 0;
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [impactedData, searchTerm, severityFilter, typeFilter, sortConfig, dateFilter, customDateRange]);

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Impact Analysis</h1>
          <p className="text-slate-400">Detailed analysis of ports impacted by disruption events with date filtering.</p>
        </div>

        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search ports, countries, regions, disruptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-slate-100 placeholder-slate-400"
                  />
                </div>
                <div className="flex gap-3">
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-full md:w-32 bg-slate-700/50 border-slate-600 text-slate-100">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full md:w-36 bg-slate-700/50 border-slate-600 text-slate-100">
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
                </div>
              </div>
              
              {/* Date Filter Row */}
              <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-slate-700/50">
                <div className="flex gap-3 flex-wrap">
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-32 bg-slate-700/50 border-slate-600 text-slate-100">
                      <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 90 Days</SelectItem>
                      <SelectItem value="365d">Last Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {dateFilter === 'custom' && (
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="bg-slate-700/50 border-slate-600 text-slate-100">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customDateRange[0] ? format(customDateRange[0], 'MMM d, yyyy') : 'Start Date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={customDateRange[0]}
                            onSelect={(date) => setCustomDateRange([date, customDateRange[1]])}
                          />
                        </PopoverContent>
                      </Popover>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="bg-slate-700/50 border-slate-600 text-slate-100">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customDateRange[1] ? format(customDateRange[1], 'MMM d, yyyy') : 'End Date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={customDateRange[1]}
                            onSelect={(date) => setCustomDateRange([customDateRange[0], date])}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-slate-400">
                  Showing {sortedAndFilteredData.length} impact{sortedAndFilteredData.length !== 1 ? 's' : ''} from {impactedData.length} total
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-slate-700/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-slate-800/60 border-b-slate-700/50">
                    <TableHead className="text-slate-300">
                      <Button variant="ghost" onClick={() => requestSort('portName')}>
                        Port <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-slate-300">
                      <Button variant="ghost" onClick={() => requestSort('disruptionTitle')}>
                        Disruption Event <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-slate-300 text-center">
                      <Button variant="ghost" onClick={() => requestSort('disruptionSeverity')}>
                        Severity <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-slate-300 text-center">
                      <Button variant="ghost" onClick={() => requestSort('disruptionType')}>
                        Type <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-slate-300 text-center">
                      <Button variant="ghost" onClick={() => requestSort('startDate')}>
                        Event Date <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-slate-300 text-right">
                      <Button variant="ghost" onClick={() => requestSort('economicImpact')}>
                        Impact ($M) <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-slate-300 text-center">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
                      </TableCell>
                    </TableRow>
                  ) : sortedAndFilteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <p className="text-slate-400">No impacted ports found for the selected filters.</p>
                      </TableCell>
                    </TableRow>
                  ) : sortedAndFilteredData.map((item) => (
                    <TableRow key={item.id} className="border-b-slate-800/80 hover:bg-slate-800/40">
                      <TableCell>
                        <div className="font-medium text-slate-100">{item.portName}</div>
                        <div className="text-sm text-slate-400">{item.portCountry} - {item.portRegion}</div>
                      </TableCell>
                      <TableCell className="text-slate-300 max-w-xs">
                        <div className="truncate">{item.disruptionTitle}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`${getSeverityColor(item.disruptionSeverity)} capitalize`}>
                          {item.disruptionSeverity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="capitalize bg-slate-700 text-slate-300 border-slate-600">
                          {item.disruptionType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <CalendarIcon className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-300 text-sm">{safeFormatDate(item.startDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-slate-200 font-mono">
                        ${item.economicImpact.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.sourceUrl ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-slate-400 hover:text-slate-200"
                            onClick={() => window.open(item.sourceUrl, '_blank')}
                          >
                            View
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-500">N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}