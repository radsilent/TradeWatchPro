import React, { useEffect, useRef, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, AlertTriangle, XCircle, CheckCircle, MapPin } from "lucide-react";

export default function GlobalMap({ 
  ports, 
  disruptions, 
  selectedPort, 
  onPortClick, 
  center, 
  zoom, 
  isLoading 
}) {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const initMap = async () => {
      try {
        // Import Leaflet and React-Leaflet
        const L = await import('leaflet');
        const { MapContainer, TileLayer } = await import('react-leaflet');
        
        if (!mounted || !mapRef.current) return;

        // Create a simple map first
        const mapElement = React.createElement(MapContainer, {
          center: center,
          zoom: zoom,
          style: { height: '100%', width: '100%' },
          className: "rounded-lg"
        }, [
          React.createElement(TileLayer, {
            key: "tile-layer",
            url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
          })
        ]);

        // Render the basic map first
        const ReactDOM = await import('react-dom/client');
        const root = ReactDOM.createRoot(mapRef.current);
        root.render(mapElement);
        
        // Mark as loaded immediately after rendering
        if (mounted) {
          setMapLoaded(true);
        }

      } catch (error) {
        console.error('Error loading map:', error);
        if (mounted) {
          setMapError(true);
        }
      }
    };

    // Add a timeout for the entire loading process
    const timeoutId = setTimeout(() => {
      if (mounted && !mapLoaded) {
        setMapError(true);
      }
    }, 5000);

    initMap();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [center, zoom]);

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

  if (mapError) {
    return (
      <div className="w-full h-full bg-slate-800/50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-xl font-semibold text-slate-200 mb-2">Interactive Global Map</h3>
          <p className="text-slate-400">Port locations and disruption tracking</p>
          <p className="text-sm text-red-400 mt-2">Map failed to load. Please refresh the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      {!mapLoaded && (
        <div className="absolute inset-0 bg-slate-800/50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold text-slate-200 mb-2">Interactive Global Map</h3>
            <p className="text-slate-400">Port locations and disruption tracking</p>
            <p className="text-sm text-slate-500 mt-2">Loading Leaflet map...</p>
          </div>
        </div>
      )}
      
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