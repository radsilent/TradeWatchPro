import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Ship, MapPin, Clock, Navigation, Zap, Anchor, Filter } from "lucide-react";
import { parseAISData, getVesselStatus, getVesselManeuver, getVesselColor, getVesselSize, getVesselHeading } from "@/utils/aisDataParser";
import { format, isValid, parseISO } from "date-fns";

export default function LiveAIS() {
  const [vessels, setVessels] = useState([]);
  const [filteredVessels, setFilteredVessels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [shipTypeFilter, setShipTypeFilter] = useState("all");
  const [flagFilter, setFlagFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadAISData();
  }, []);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadAISData();
      }, 30000); // Refresh every 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadAISData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load the CSV file
      const response = await fetch('/Spire_Maritime_Ships_2024_2030.csv');
      if (!response.ok) {
        throw new Error('Failed to load AIS data');
      }
      
      const csvText = await response.text();
      const parsedVessels = await parseAISData(csvText);
      
      setVessels(parsedVessels);
      setFilteredVessels(parsedVessels);
    } catch (err) {
      console.error('Error loading AIS data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter vessels based on search and filters
  useEffect(() => {
    let filtered = [...vessels];

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(vessel =>
        vessel.name.toLowerCase().includes(lowercasedTerm) ||
        vessel.mmsi.toString().includes(lowercasedTerm) ||
        vessel.imo.toString().includes(lowercasedTerm) ||
        vessel.callSign.toLowerCase().includes(lowercasedTerm) ||
        vessel.flag.toLowerCase().includes(lowercasedTerm) ||
        vessel.destination.toLowerCase().includes(lowercasedTerm)
      );
    }

    if (shipTypeFilter !== "all") {
      filtered = filtered.filter(vessel => vessel.shipType === shipTypeFilter);
    }

    if (flagFilter !== "all") {
      filtered = filtered.filter(vessel => vessel.flag === flagFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(vessel => vessel.status.toString() === statusFilter);
    }

    setFilteredVessels(filtered);
  }, [vessels, searchTerm, shipTypeFilter, flagFilter, statusFilter]);

  // Get unique values for filters
  const shipTypes = useMemo(() => {
    const types = [...new Set(vessels.map(v => v.shipType))].sort();
    return types;
  }, [vessels]);

  const flags = useMemo(() => {
    const flagList = [...new Set(vessels.map(v => v.flag))].sort();
    return flagList;
  }, [vessels]);

  const statuses = useMemo(() => {
    const statusList = [...new Set(vessels.map(v => v.status))].sort();
    return statusList;
  }, [vessels]);

  // Statistics
  const stats = useMemo(() => {
    const totalVessels = vessels.length;
    const movingVessels = vessels.filter(v => v.speed > 1).length;
    const stationaryVessels = vessels.filter(v => v.speed <= 1).length;
    const avgSpeed = vessels.length > 0 ? 
      (vessels.reduce((sum, v) => sum + v.speed, 0) / vessels.length).toFixed(1) : 0;
    
    const typeCounts = {};
    vessels.forEach(v => {
      typeCounts[v.shipType] = (typeCounts[v.shipType] || 0) + 1;
    });

    return {
      totalVessels,
      movingVessels,
      stationaryVessels,
      avgSpeed,
      typeCounts
    };
  }, [vessels]);

  const handleVesselClick = (vessel) => {
    setSelectedVessel(vessel);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setShipTypeFilter("all");
    setFlagFilter("all");
    setStatusFilter("all");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Loading AIS vessel data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-400 mb-4">Error loading AIS data: {error}</p>
              <Button onClick={loadAISData} variant="outline">
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Live AIS Vessel Tracking</h1>
          <p className="text-slate-400">Real-time vessel positions and maritime traffic monitoring</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Total Vessels</p>
                  <p className="text-2xl font-bold text-slate-100">{stats.totalVessels}</p>
                </div>
                <Ship className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Moving Vessels</p>
                  <p className="text-2xl font-bold text-green-400">{stats.movingVessels}</p>
                </div>
                <Navigation className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Stationary Vessels</p>
                  <p className="text-2xl font-bold text-orange-400">{stats.stationaryVessels}</p>
                </div>
                <Anchor className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Avg Speed</p>
                  <p className="text-2xl font-bold text-purple-400">{stats.avgSpeed} knots</p>
                </div>
                <Zap className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-100">Vessel Filters</CardTitle>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-slate-400 border-slate-600 hover:text-slate-200"
                >
                  Clear Filters
                </Button>
                <Button
                  variant={autoRefresh ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="text-slate-400 border-slate-600 hover:text-slate-200"
                >
                  {autoRefresh ? "Auto Refresh ON" : "Auto Refresh OFF"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search vessels..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-slate-100 placeholder-slate-400"
                />
              </div>

              <Select value={shipTypeFilter} onValueChange={setShipTypeFilter}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-100">
                  <SelectValue placeholder="Ship Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {shipTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={flagFilter} onValueChange={setFlagFilter}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-100">
                  <SelectValue placeholder="Flag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Flags</SelectItem>
                  {flags.map(flag => (
                    <SelectItem key={flag} value={flag}>{flag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-100">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status.toString()}>
                      {getVesselStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Vessel List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vessel List */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-100">
                  Vessels ({filteredVessels.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredVessels.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">No vessels found matching the filters.</p>
                  ) : (
                    filteredVessels.map((vessel) => (
                      <div
                        key={vessel.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedVessel?.id === vessel.id
                            ? 'bg-slate-700/50 border-blue-500'
                            : 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/40'
                        }`}
                        onClick={() => handleVesselClick(vessel)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getVesselColor(vessel.shipType) }}
                            ></div>
                            <h3 className="font-semibold text-slate-100">{vessel.name}</h3>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {vessel.shipType}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-slate-400">
                            <span className="font-medium">MMSI:</span> {vessel.mmsi}
                          </div>
                          <div className="text-slate-400">
                            <span className="font-medium">Flag:</span> {vessel.flag}
                          </div>
                          <div className="text-slate-400">
                            <span className="font-medium">Speed:</span> {vessel.speed.toFixed(1)} knots
                          </div>
                          <div className="text-slate-400">
                            <span className="font-medium">Course:</span> {vessel.course.toFixed(0)}°
                          </div>
                        </div>
                        
                        <div className="mt-2 text-xs text-slate-500">
                          <MapPin className="inline w-3 h-3 mr-1" />
                          {vessel.coordinates.lat.toFixed(4)}, {vessel.coordinates.lng.toFixed(4)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vessel Details */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-100">Vessel Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedVessel ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div
                        className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center"
                        style={{ backgroundColor: getVesselColor(selectedVessel.shipType) }}
                      >
                        <Ship className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-100">{selectedVessel.name}</h3>
                      <p className="text-slate-400">{selectedVessel.shipType}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-slate-400">
                          <span className="font-medium">MMSI:</span>
                        </div>
                        <div className="text-slate-200">{selectedVessel.mmsi}</div>
                        
                        <div className="text-slate-400">
                          <span className="font-medium">IMO:</span>
                        </div>
                        <div className="text-slate-200">{selectedVessel.imo}</div>
                        
                        <div className="text-slate-400">
                          <span className="font-medium">Call Sign:</span>
                        </div>
                        <div className="text-slate-200">{selectedVessel.callSign}</div>
                        
                        <div className="text-slate-400">
                          <span className="font-medium">Flag:</span>
                        </div>
                        <div className="text-slate-200">{selectedVessel.flag}</div>
                        
                        <div className="text-slate-400">
                          <span className="font-medium">Speed:</span>
                        </div>
                        <div className="text-slate-200">{selectedVessel.speed.toFixed(1)} knots</div>
                        
                        <div className="text-slate-400">
                          <span className="font-medium">Course:</span>
                        </div>
                        <div className="text-slate-200">{selectedVessel.course.toFixed(0)}°</div>
                        
                        <div className="text-slate-400">
                          <span className="font-medium">Heading:</span>
                        </div>
                        <div className="text-slate-200">{selectedVessel.heading.toFixed(0)}°</div>
                        
                        <div className="text-slate-400">
                          <span className="font-medium">Length:</span>
                        </div>
                        <div className="text-slate-200">{selectedVessel.length}m</div>
                        
                        <div className="text-slate-400">
                          <span className="font-medium">Width:</span>
                        </div>
                        <div className="text-slate-200">{selectedVessel.width}m</div>
                        
                        <div className="text-slate-400">
                          <span className="font-medium">Draught:</span>
                        </div>
                        <div className="text-slate-200">{selectedVessel.draught}m</div>
                      </div>

                      <div className="pt-2 border-t border-slate-600">
                        <div className="text-sm">
                          <div className="text-slate-400 mb-1">
                            <span className="font-medium">Status:</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getVesselStatus(selectedVessel.status)}
                          </Badge>
                        </div>
                        
                        <div className="text-sm mt-2">
                          <div className="text-slate-400 mb-1">
                            <span className="font-medium">Destination:</span>
                          </div>
                          <div className="text-slate-200">{selectedVessel.destination}</div>
                        </div>
                        
                        {selectedVessel.eta && (
                          <div className="text-sm mt-2">
                            <div className="text-slate-400 mb-1">
                              <span className="font-medium">ETA:</span>
                            </div>
                            <div className="text-slate-200">
                              {format(selectedVessel.eta, 'MMM d, yyyy HH:mm')}
                            </div>
                          </div>
                        )}
                        
                        <div className="text-sm mt-2">
                          <div className="text-slate-400 mb-1">
                            <span className="font-medium">Position Updated:</span>
                          </div>
                          <div className="text-slate-200">
                            {format(selectedVessel.positionUpdatedAt, 'MMM d, HH:mm:ss')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Ship className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Select a vessel to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}