import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import L from 'leaflet';

// Custom markers for different port statuses
const createCustomIcon = (status) => {
  const colors = {
    normal: '#10b981',
    minor_disruption: '#f59e0b', 
    major_disruption: '#ef4444',
    closed: '#dc2626'
  };
  
  return L.divIcon({
    html: `<div style="background-color: ${colors[status]}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    className: 'custom-marker'
  });
};

export default function GlobalMap({ 
  ports, 
  disruptions, 
  selectedPort, 
  onPortClick, 
  center, 
  zoom, 
  isLoading 
}) {
  if (isLoading) {
    return (
      <div className="w-full h-full bg-slate-800/50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4 bg-slate-700" />
          <p className="text-slate-400">Loading global port data...</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    const icons = {
      normal: CheckCircle,
      minor_disruption: Activity,
      major_disruption: AlertTriangle,
      closed: XCircle
    };
    return icons[status] || CheckCircle;
  };

  const getStatusColor = (status) => {
    const colors = {
      normal: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      minor_disruption: 'bg-amber-100 text-amber-800 border-amber-200',
      major_disruption: 'bg-red-100 text-red-800 border-red-200',
      closed: 'bg-red-100 text-red-900 border-red-300'
    };
    return colors[status] || colors.normal;
  };

  const getStatusText = (status) => {
    const texts = {
      normal: 'Operational',
      minor_disruption: 'Minor Disruption',
      major_disruption: 'Major Disruption',
      closed: 'Closed'
    };
    return texts[status] || 'Unknown';
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        maxZoom={18}
        minZoom={2}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        
        {ports.map((port) => {
          const StatusIcon = getStatusIcon(port.status);
          
          return (
            <Marker
              key={port.id}
              position={[port.coordinates.lat, port.coordinates.lng]}
              icon={createCustomIcon(port.status)}
              eventHandlers={{
                click: () => onPortClick(port)
              }}
            >
              <Popup className="custom-popup">
                <div className="p-3 min-w-64">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{port.name}</h3>
                      <p className="text-slate-600 text-sm">{port.country}</p>
                    </div>
                    <StatusIcon className="w-5 h-5 text-slate-500" />
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <Badge className={`${getStatusColor(port.status)} border text-xs`}>
                      {getStatusText(port.status)}
                    </Badge>
                    
                    {port.port_code && (
                      <p className="text-xs text-slate-500">Code: {port.port_code}</p>
                    )}
                    
                    {port.annual_throughput && (
                      <p className="text-xs text-slate-500">
                        Annual Throughput: {(port.annual_throughput / 1000000).toFixed(1)}M TEU
                      </p>
                    )}
                  </div>
                  
                  {port.strategic_importance && (
                    <Badge variant="outline" className="text-xs">
                      {port.strategic_importance.charAt(0).toUpperCase() + port.strategic_importance.slice(1)} Port
                    </Badge>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        {/* Disruption areas */}
        {disruptions.map((disruption) => 
          disruption.affected_regions?.map((region, index) => {
            // Sample coordinates for major shipping regions
            const regionCoordinates = {
              'South China Sea': [16, 112],
              'Persian Gulf': [26, 52],
              'Strait of Hormuz': [26, 56],
              'Suez Canal': [30, 32],
              'Panama Canal': [9, -80],
              'Strait of Malacca': [2, 102],
              'Mediterranean': [36, 15],
              'North Atlantic': [50, -30],
              'Arabian Sea': [18, 65]
            };
            
            const coords = regionCoordinates[region];
            if (!coords) return null;
            
            return (
              <CircleMarker
                key={`${disruption.id}-${region}-${index}`}
                center={coords}
                radius={disruption.severity === 'critical' ? 30 : 20}
                pathOptions={{
                  color: disruption.severity === 'critical' ? '#dc2626' : '#f59e0b',
                  fillColor: disruption.severity === 'critical' ? '#dc2626' : '#f59e0b',
                  fillOpacity: 0.2,
                  weight: 2
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="font-semibold text-slate-900">{disruption.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{disruption.description}</p>
                    <Badge className="mt-2 text-xs" variant={disruption.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {disruption.severity} impact
                    </Badge>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })
        )}
      </MapContainer>
      
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
        }
        .leaflet-popup-tip {
          background: white;
        }
        .custom-marker {
          background: none !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}