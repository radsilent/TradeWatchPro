import React, { Suspense, useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

// Real Leaflet Map Component
function RealLeafletMap({ disruptions, vessels, ports, onDisruptionClick, selectedDisruption, getSeverityColor, getVesselStatusColor }) {
  const [map, setMap] = useState(null);
  const [markersLayer, setMarkersLayer] = useState(null);
  const mapRef = useRef(null);

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      try {
        // Import Leaflet
        const L = await import('leaflet');
        
        // Import Leaflet CSS
        await import('leaflet/dist/leaflet.css');

        // Fix default marker icons
        delete L.default.Icon.Default.prototype._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        if (mapRef.current && !map) {
          // Create map
          const leafletMap = L.default.map(mapRef.current, {
            center: [20, 0],
            zoom: 2,
            zoomControl: true,
            attributionControl: true
          });

          // Add tile layer
          L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
          }).addTo(leafletMap);

          // Create layer group for markers
          const markerGroup = L.default.layerGroup().addTo(leafletMap);

          setMap(leafletMap);
          setMarkersLayer(markerGroup);
        }
      } catch (error) {
        console.error('Failed to initialize Leaflet map:', error);
      }
    };

    initMap();

    // Cleanup
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (!map || !markersLayer) return;

    const updateMarkers = async () => {
      try {
        const L = await import('leaflet');

        // Clear existing markers
        markersLayer.clearLayers();

        // Add disruption markers (current and forecasted)
        disruptions.forEach((disruption) => {
          const isForecasted = disruption.status === 'Forecasted';
          
          const marker = L.default.circleMarker(
            [disruption.coordinates.lat, disruption.coordinates.lng],
            {
              radius: isForecasted ? 8 : 10,
              fillColor: getSeverityColor(disruption.severity),
              color: isForecasted ? '#8b5cf6' : 'white',
              weight: isForecasted ? 3 : 2,
              opacity: 1,
              fillOpacity: isForecasted ? 0.6 : 0.8,
              dashArray: isForecasted ? '5, 5' : null
            }
          );

          const popupContent = isForecasted ? `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <div style="background: linear-gradient(45deg, #8b5cf6, #a855f7); color: white; padding: 8px; margin: -8px -8px 8px -8px; border-radius: 4px;">
                <strong style="font-size: 14px;">FORECASTED</strong>
              </div>
              <strong style="color: ${getSeverityColor(disruption.severity)}; font-size: 16px;">
                ${disruption.title}
              </strong><br/>
              <div style="margin: 8px 0; font-size: 13px; color: #666;">
                ${disruption.description}
              </div>
              <div style="font-size: 12px; color: #888;">
                <strong>Probability:</strong> ${disruption.probability}%<br/>
                <strong>Expected Date:</strong> ${disruption.probabilityDate.toLocaleDateString()}<br/>
                <strong>Potential Impact:</strong> ${disruption.impact}<br/>
                <strong>Vessels at Risk:</strong> ${disruption.affectedVessels}<br/>
                <strong>Economic Impact:</strong> $${disruption.economicImpact}M
              </div>
            </div>
          ` : `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <strong style="color: ${getSeverityColor(disruption.severity)}; font-size: 16px;">
                ${disruption.title}
              </strong><br/>
              <div style="margin: 8px 0; font-size: 13px; color: #666;">
                ${disruption.description}
              </div>
              <div style="font-size: 12px; color: #888;">
                <strong>Impact:</strong> ${disruption.impact}<br/>
                <strong>Affected Vessels:</strong> ${disruption.affectedVessels}<br/>
                <strong>Status:</strong> ${disruption.status}<br/>
                <strong>Economic Impact:</strong> $${disruption.economicImpact || 0}M<br/>
                <strong>Region:</strong> ${disruption.region || 'Unknown'}<br/>
                <strong>Type:</strong> ${disruption.type || 'Unknown'}
              </div>
            </div>
          `;

          marker.bindPopup(popupContent, {
            maxWidth: 320,
            className: 'custom-popup'
          });

          marker.on('click', () => onDisruptionClick(disruption));
          
          markersLayer.addLayer(marker);
        });

        // Add vessel markers (triangular with direction)
        vessels.forEach((vessel) => {
          // Create a directional triangle marker
          const course = vessel.course || 0;
          const size = vessel.impacted ? 12 : 8;
          
          // Create a custom divIcon for triangular vessel marker
          const vesselIcon = L.default.divIcon({
            html: `
              <div style="
                width: ${size}px; 
                height: ${size}px; 
                transform: rotate(${course}deg);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="
                  width: 0; 
                  height: 0; 
                  border-left: ${size/2}px solid transparent;
                  border-right: ${size/2}px solid transparent;
                  border-bottom: ${size}px solid ${getVesselStatusColor(vessel.status)};
                  filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));
                  ${vessel.impacted ? 'filter: drop-shadow(0 0 4px ' + getVesselStatusColor(vessel.status) + ');' : ''}
                "></div>
              </div>
            `,
            className: 'vessel-marker',
            iconSize: [size, size],
            iconAnchor: [size/2, size/2]
          });

          const marker = L.default.marker(
            [vessel.coordinates.lat, vessel.coordinates.lng],
            { icon: vesselIcon }
          );

          marker.bindPopup(`
            <div style="font-family: Arial, sans-serif; color: #333;">
              <strong style="font-size: 16px;">${vessel.name}</strong><br/>
              <div style="margin: 8px 0; font-size: 13px;">
                <strong>Type:</strong> ${vessel.type}<br/>
                <strong>Status:</strong> 
                <span style="color: ${getVesselStatusColor(vessel.status)}; font-weight: bold;">
                  ${vessel.status}
                </span><br/>
                <strong>Destination:</strong> ${vessel.destination}<br/>
                <strong>Speed:</strong> ${vessel.speed || 0} knots<br/>
                <strong>Course:</strong> ${course}°<br/>
                ${vessel.mmsi ? `<strong>MMSI:</strong> ${vessel.mmsi}<br/>` : ''}
                ${vessel.imo ? `<strong>IMO:</strong> ${vessel.imo}<br/>` : ''}
                ${vessel.operator ? `<strong>Operator:</strong> ${vessel.operator}<br/>` : ''}
                ${vessel.flag ? `<strong>Flag:</strong> ${vessel.flag}` : ''}
              </div>
            </div>
          `, {
            maxWidth: 280,
            className: 'custom-popup'
          });
          
          markersLayer.addLayer(marker);
        });

        // Add port markers
        if (ports && ports.length > 0) {
          ports.forEach((port) => {
            // Create different sized markers based on port rank/importance
            let radius = 3;
            let fillColor = '#94a3b8';
            let weight = 1;
            
            if (port.rank <= 10) {
              radius = 6;
              fillColor = '#f59e0b';
              weight = 2;
            } else if (port.rank <= 50) {
              radius = 5;
              fillColor = '#3b82f6';
              weight = 1;
            } else if (port.rank <= 100) {
              radius = 4;
              fillColor = '#10b981';
              weight = 1;
            }

            const portMarker = L.default.circleMarker(
              [port.coordinates.lat, port.coordinates.lng],
              {
                radius: radius,
                fillColor: fillColor,
                color: 'white',
                weight: weight,
                opacity: 0.8,
                fillOpacity: 0.7
              }
            );

            portMarker.bindPopup(`
              <div style="font-family: Arial, sans-serif; color: #333;">
                <strong style="font-size: 16px; color: ${fillColor};">
                  ${port.name}
                </strong><br/>
                <div style="margin: 8px 0; font-size: 13px; color: #666;">
                  ${port.country} • ${port.region}
                </div>
                <div style="font-size: 12px; color: #888;">
                  <strong>Rank:</strong> #${port.rank} globally<br/>
                  <strong>Type:</strong> ${port.type}<br/>
                  ${port.teu > 0 ? `<strong>TEU Capacity:</strong> ${port.teu.toLocaleString()}<br/>` : ''}
                </div>
              </div>
            `, {
              maxWidth: 280,
              className: 'custom-popup'
            });

            markersLayer.addLayer(portMarker);
          });
        }

      } catch (error) {
        console.error('Failed to update markers:', error);
      }
    };

    updateMarkers();
  }, [map, markersLayer, disruptions, vessels, ports, getSeverityColor, getVesselStatusColor, onDisruptionClick]);

  return (
    <div style={{ position: 'relative' }}>
      <div 
        ref={mapRef} 
        style={{ 
          height: '400px', 
          borderRadius: '8px',
          border: '1px solid #475569',
          zIndex: 1
        }} 
      />
      
      {/* Custom Legend */}
      <div style={{ 
        position: 'absolute', 
        bottom: '15px', 
        left: '15px', 
        fontSize: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '12px',
        borderRadius: '6px',
        border: '1px solid #ccc',
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ color: '#333', marginBottom: '8px', fontWeight: '600' }}>Legend:</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%', border: '1px solid white' }}></div>
            <span style={{ color: '#333', fontSize: '11px' }}>Critical</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', backgroundColor: '#f59e0b', borderRadius: '50%', border: '1px solid white' }}></div>
            <span style={{ color: '#333', fontSize: '11px' }}>High/Medium</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ 
              width: '0', 
              height: '0', 
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderBottom: '8px solid #3b82f6'
            }}></div>
            <span style={{ color: '#333', fontSize: '11px' }}>Vessels</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '6px', height: '6px', backgroundColor: '#f59e0b', borderRadius: '50%', border: '1px solid white' }}></div>
            <span style={{ color: '#333', fontSize: '10px' }}>Top 10 Ports</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '5px', height: '5px', backgroundColor: '#3b82f6', borderRadius: '50%', border: '1px solid white' }}></div>
            <span style={{ color: '#333', fontSize: '10px' }}>Major Ports</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '3px', height: '3px', backgroundColor: '#94a3b8', borderRadius: '50%', border: '1px solid white' }}></div>
            <span style={{ color: '#333', fontSize: '10px' }}>Other Ports</span>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-popup .leaflet-popup-content-wrapper {
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          .custom-popup .leaflet-popup-tip {
            background: white;
          }
          .leaflet-container {
            background: #0f172a;
          }
          .leaflet-control-zoom {
            border: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .leaflet-control-zoom a {
            background-color: rgba(30, 41, 59, 0.9);
            color: white;
            border: 1px solid #475569;
          }
          .leaflet-control-zoom a:hover {
            background-color: rgba(51, 65, 85, 0.9);
            color: white;
          }
          .leaflet-control-attribution {
            background: rgba(255, 255, 255, 0.8);
            font-size: 10px;
          }
          .vessel-marker {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }
        `
      }} />
    </div>
  );
}

// Error boundary for individual components
class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`Error in ${this.props.componentName}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#fee', 
          border: '2px solid #f00',
          margin: '10px',
          borderRadius: '8px'
        }}>
          <h3 style={{ color: '#d00' }}>Component Error: {this.props.componentName}</h3>
          <p style={{ fontSize: '14px', color: '#900' }}>{this.state.error?.message}</p>
          <details style={{ marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer', color: '#666' }}>View Details</summary>
            <pre style={{ fontSize: '12px', overflow: 'auto', marginTop: '5px' }}>
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// Safe component loader
function SafeComponent({ componentName, fallback, children }) {
  return (
    <ComponentErrorBoundary componentName={componentName}>
      <Suspense fallback={fallback || <div>Loading {componentName}...</div>}>
        {children}
      </Suspense>
    </ComponentErrorBoundary>
  );
}

// Lazy load components
// Use the enhanced Dashboard with disruptions and AIS data
const Dashboard = () => <EnhancedDashboard />;

const Layout = React.lazy(() => 
  import("@/SimpleLayout.jsx").catch(err => {
    console.error('Failed to load SimpleLayout:', err);
    return { 
      default: ({ children }) => (
        <div style={{ padding: '20px', backgroundColor: '#1e293b', minHeight: '100vh', color: 'white' }}>
          <h1>Layout Error</h1>
          <p style={{ color: '#fbbf24' }}>Using emergency fallback layout: {err.message}</p>
          <div style={{ marginTop: '20px' }}>
            {children}
          </div>
        </div>
      )
    };
  })
);

// Simple working components for pages that fail to load
function SimpleDisruptions() {
  return (
    <div style={{ color: 'white' }}>
      <h2 style={{ color: '#ef4444', marginBottom: '20px' }}>Active Disruptions</h2>
      <div style={{ display: 'grid', gap: '16px' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #ef4444' }}>
          <h3 style={{ color: '#ef4444', margin: '0 0 10px 0' }}>Red Sea Shipping Delays</h3>
          <p style={{ color: '#94a3b8', margin: '0 0 10px 0' }}>Severe disruptions affecting major shipping routes</p>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Status: Active • Impact: High • Confidence: 95%</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #f59e0b' }}>
          <h3 style={{ color: '#f59e0b', margin: '0 0 10px 0' }}>Panama Canal Water Levels</h3>
          <p style={{ color: '#94a3b8', margin: '0 0 10px 0' }}>Reduced capacity due to drought conditions</p>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Status: Monitoring • Impact: Medium • Confidence: 87%</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #10b981' }}>
          <h3 style={{ color: '#10b981', margin: '0 0 10px 0' }}>Suez Canal Operations</h3>
          <p style={{ color: '#94a3b8', margin: '0 0 10px 0' }}>Normal operations resumed after brief delays</p>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Status: Resolved • Impact: Low • Confidence: 92%</div>
        </div>
      </div>
    </div>
  );
}

function SimpleAnalytics() {
  return (
    <div style={{ color: 'white' }}>
      <h2 style={{ marginBottom: '20px' }}>Trade Analytics</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ color: '#60a5fa', margin: '0 0 15px 0' }}>Global Shipping Volume</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981', marginBottom: '5px' }}>2.4M TEU</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>+12% vs last month</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ color: '#60a5fa', margin: '0 0 15px 0' }}>Active Disruptions</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '5px' }}>23</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>-3 from yesterday</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ color: '#60a5fa', margin: '0 0 15px 0' }}>Port Efficiency</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981', marginBottom: '5px' }}>94.2%</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>+2.1% improvement</div>
        </div>
      </div>
    </div>
  );
}

// Try to load complex components, fall back to simple ones
const Disruptions = React.lazy(() => 
  import("@/pages/Disruptions.jsx").catch(err => {
    console.error('Failed to load Disruptions, using simple version:', err);
    return { default: SimpleDisruptions };
  })
);

// Use the simple, reliable Analytics version directly
const Analytics = () => <SimpleAnalytics />;

function SimpleLiveAIS() {
  return (
    <div style={{ color: 'white' }}>
      <h2 style={{ marginBottom: '20px' }}>Live AIS Tracking</h2>
      <div style={{ display: 'grid', gap: '20px' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #60a5fa' }}>
          <h3 style={{ color: '#60a5fa', margin: '0 0 15px 0' }}>Vessel Tracking Overview</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>12,547</div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>Active Vessels</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>2,103</div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>Container Ships</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>847</div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>Tankers</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#06b6d4' }}>1,429</div>
              <div style={{ fontSize: '14px', color: '#94a3b8' }}>Bulk Carriers</div>
            </div>
          </div>
        </div>
        
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ color: '#60a5fa', margin: '0 0 15px 0' }}>Recent Vessel Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#0f172a', borderRadius: '6px' }}>
              <div>
                <div style={{ fontWeight: '600', color: '#f1f5f9' }}>MSC GÜLSÜN</div>
                <div style={{ fontSize: '14px', color: '#94a3b8' }}>Container Ship • IMO: 9839645</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#10b981', fontWeight: '600' }}>In Port</div>
                <div style={{ fontSize: '14px', color: '#94a3b8' }}>Shanghai, China</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#0f172a', borderRadius: '6px' }}>
              <div>
                <div style={{ fontWeight: '600', color: '#f1f5f9' }}>EVER GIVEN</div>
                <div style={{ fontSize: '14px', color: '#94a3b8' }}>Container Ship • IMO: 9811000</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#f59e0b', fontWeight: '600' }}>Underway</div>
                <div style={{ fontSize: '14px', color: '#94a3b8' }}>Suez Canal</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#0f172a', borderRadius: '6px' }}>
              <div>
                <div style={{ fontWeight: '600', color: '#f1f5f9' }}>SEAWISE GIANT</div>
                <div style={{ fontSize: '14px', color: '#94a3b8' }}>Tanker • IMO: 9876543</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#ef4444', fontWeight: '600' }}>Anchored</div>
                <div style={{ fontSize: '14px', color: '#94a3b8' }}>Singapore Strait</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SimpleImpactedPorts() {
  return (
    <div style={{ color: 'white' }}>
      <h2 style={{ marginBottom: '20px' }}>Impacted Ports</h2>
      <div style={{ display: 'grid', gap: '16px' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
            <h3 style={{ color: '#ef4444', margin: 0 }}>Port of Los Angeles</h3>
            <div style={{ fontSize: '14px', color: '#ef4444', fontWeight: '600' }}>HIGH IMPACT</div>
          </div>
          <p style={{ color: '#94a3b8', margin: '0 0 10px 0' }}>Labor strike affecting container operations</p>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Capacity: 45% • Delays: 3-5 days • Updated: 2 hours ago</div>
        </div>
        
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
            <h3 style={{ color: '#f59e0b', margin: 0 }}>Hamburg Port</h3>
            <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: '600' }}>MEDIUM IMPACT</div>
          </div>
          <p style={{ color: '#94a3b8', margin: '0 0 10px 0' }}>Weather delays due to severe storms</p>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Capacity: 70% • Delays: 1-2 days • Updated: 45 minutes ago</div>
        </div>
        
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
            <h3 style={{ color: '#10b981', margin: 0 }}>Port of Singapore</h3>
            <div style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>OPERATIONAL</div>
          </div>
          <p style={{ color: '#94a3b8', margin: '0 0 10px 0' }}>Normal operations, no significant delays</p>
          <div style={{ fontSize: '14px', color: '#64748b' }}>Capacity: 95% • Delays: None • Updated: 15 minutes ago</div>
        </div>
      </div>
    </div>
  );
}

const LiveAIS = React.lazy(() => 
  import("@/pages/LiveAIS.jsx").catch(err => {
    console.error('Failed to load LiveAIS, using simple version:', err);
    return { default: SimpleLiveAIS };
  })
);

const ImpactedPorts = React.lazy(() => 
  import("@/pages/ImpactedPorts.jsx").catch(err => {
    console.error('Failed to load ImpactedPorts, using simple version:', err);
    return { default: SimpleImpactedPorts };
  })
);

// Enhanced Dashboard with disruptions and AIS data
function EnhancedDashboard() {
  const [selectedDisruption, setSelectedDisruption] = useState(null);
  const [timeRange, setTimeRange] = useState({ start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() }); // Last 30 days
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('30d');
  const [timeSliderValue, setTimeSliderValue] = useState(30); // Days from now
  
    // Comprehensive disruption data with historical, current, and forecasted events
  const allDisruptions = [
    // CRITICAL ACTIVE DISRUPTIONS
    {
      id: 1,
      title: "Red Sea Shipping Attacks",
      severity: "critical",
      coordinates: { lat: 20.5, lng: 40.3 },
      description: "Houthi attacks forcing ships to reroute around Cape of Good Hope",
      impact: "Major delays, +15 days transit time",
      affectedVessels: 247,
      status: "Active",
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      endDate: null,
      economicImpact: "High Impact",
      confidenceScore: 95,
      region: "Middle East",
      type: "Security Incident",
      sources: [
        { outlet: "Reuters", url: "https://www.reuters.com/world/middle-east/houthis-say-they-attacked-ship-red-sea-2024-08-16/", title: "Houthis Continue Red Sea Ship Attacks Despite Naval Response", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { outlet: "BBC News", url: "https://www.bbc.com/news/world-middle-east-67978455", title: "Red Sea Crisis: Major Shipping Lines Avoid Suez Canal Route", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        { outlet: "Maritime Executive", url: "https://www.maritime-executive.com/article/container-lines-extend-red-sea-diversions", title: "Container Lines Extend Red Sea Diversions Through Q2 2024", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
      ]
    },
    {
      id: 2,
      title: "Panama Canal Drought",
      severity: "critical",
      coordinates: { lat: 9.08, lng: -79.68 },
      description: "Severe drought reducing canal capacity to 24 transits per day",
      impact: "60% capacity reduction, 3-week delays",
      affectedVessels: 189,
      status: "Active",
      startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      endDate: null,
      economicImpact: "Critical Impact",
      confidenceScore: 98,
      region: "Central America",
      type: "Environmental",
      sources: [
        { outlet: "Wall Street Journal", url: "https://wsj.com/panama-canal-drought", title: "Panama Canal Drought Restricts Global Shipping Traffic", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        { outlet: "Financial Times", url: "https://ft.com/panama-water-crisis", title: "Panama Canal Authority Extends Shipping Restrictions Due to Water Crisis", date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
        { outlet: "TradeWinds", url: "https://tradewindsnews.com/panama-canal", title: "Panama Canal Cuts Daily Transits to Historic Low", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
      ]
    },
    {
      id: 3,
      title: "Black Sea Grain Export Blockade",
      severity: "critical",
      coordinates: { lat: 44.6, lng: 33.5 },
      description: "Ongoing conflict disrupting grain shipments from Ukraine",
      impact: "Complete halt of grain exports",
      affectedVessels: 78,
      status: "Active",
      startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      endDate: null,
      economicImpact: "Critical Impact",
      confidenceScore: 99,
      region: "Black Sea",
      type: "Conflict"
    },
    
    // HIGH SEVERITY DISRUPTIONS
    {
      id: 4,
      title: "Long Beach Port Congestion",
      severity: "high",
      coordinates: { lat: 33.7701, lng: -118.1937 },
      description: "Heavy container backlog due to labor negotiations",
      impact: "5-7 day delays, reduced throughput",
      affectedVessels: 156,
      status: "Ongoing",
      startDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      endDate: null,
      economicImpact: "Medium Impact",
      confidenceScore: 87,
      region: "North America West Coast",
      type: "Port Operations"
    },
    {
      id: 5,
      title: "Strait of Hormuz Tensions",
      severity: "high",
      coordinates: { lat: 26.5665, lng: 56.2500 },
      description: "Increased military presence affecting tanker movements",
      impact: "Insurance premiums up 15%, route diversions",
      affectedVessels: 234,
      status: "Monitoring",
      startDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      endDate: null,
      economicImpact: "High Impact",
      confidenceScore: 78,
      region: "Persian Gulf",
      type: "Geopolitical"
    },
    {
      id: 6,
      title: "Hamburg Port Strike",
      severity: "high",
      coordinates: { lat: 53.5511, lng: 9.9937 },
      description: "Docker strike affecting Europe's third-largest port",
      impact: "Port operations reduced by 70%",
      affectedVessels: 92,
      status: "Active",
      startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Projected end
      economicImpact: "Medium Impact",
      confidenceScore: 92,
      region: "Northern Europe",
      type: "Labor Dispute"
    },
    
    // MEDIUM SEVERITY DISRUPTIONS
    {
      id: 7,
      title: "Singapore Strait Congestion",
      severity: "medium",
      coordinates: { lat: 1.3521, lng: 103.8198 },
      description: "Heavy traffic in world's busiest shipping lane",
      impact: "2-3 hour delays, increased fuel costs",
      affectedVessels: 145,
      status: "Active",
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endDate: null,
      economicImpact: "Low Impact",
      confidenceScore: 84,
      region: "Southeast Asia",
      type: "Traffic Congestion"
    },
    {
      id: 8,
      title: "Dover Port Brexit Delays",
      severity: "medium",
      coordinates: { lat: 51.1295, lng: 1.3089 },
      description: "Post-Brexit customs checks causing ferry delays",
      impact: "Extended border processing times",
      affectedVessels: 67,
      status: "Ongoing",
      startDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      endDate: null,
      economicImpact: "Low Impact",
      confidenceScore: 76,
      region: "English Channel",
      type: "Regulatory"
    },
    
    // RESOLVED RECENT DISRUPTIONS
    {
      id: 9,
      title: "Suez Canal Grounding Incident",
      severity: "high",
      coordinates: { lat: 30.0444, lng: 32.3844 },
      description: "Container ship blocked canal for 6 hours",
      impact: "Temporary canal closure, 23 ships delayed",
      affectedVessels: 23,
      status: "Resolved",
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      economicImpact: "Medium Impact",
      confidenceScore: 100,
      region: "Egypt",
      type: "Navigation Incident"
    },
    {
      id: 10,
      title: "Typhoon Mawar Pacific Routes",
      severity: "high",
      coordinates: { lat: 13.4443, lng: 144.7937 },
      description: "Category 4 typhoon affecting Pacific shipping lanes",
      impact: "Route diversions, 4-day delays",
      affectedVessels: 112,
      status: "Resolved",
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      economicImpact: "Medium Impact",
      confidenceScore: 95,
      region: "Pacific Ocean",
      type: "Weather"
    }
  ];

  // FORECASTED DISRUPTIONS (Predictive Intelligence)
  const forecastedDisruptions = [
    {
      id: 'F1',
      title: "Potential East Coast Port Strike",
      severity: "high",
      coordinates: { lat: 40.6782, lng: -74.0442 },
      description: "Labor contract negotiations failing, strike probability increasing",
      impact: "Projected 40% reduction in East Coast port capacity",
      affectedVessels: 280,
      status: "Forecasted",
      probabilityDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      probability: 75, // 75% chance
      economicImpact: "Critical Impact",
      region: "US East Coast",
      type: "Labor Dispute",
      forecastConfidence: 82
    },
    {
      id: 'F2',
      title: "Monsoon Season Delays",
      severity: "medium",
      coordinates: { lat: 19.0760, lng: 72.8777 },
      description: "Heavy monsoons predicted to affect Indian Ocean shipping",
      impact: "2-4 day delays, increased insurance costs",
      affectedVessels: 156,
      status: "Forecasted",
      probabilityDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      probability: 85,
      economicImpact: "Medium Impact",
      region: "Indian Ocean",
      type: "Weather",
      forecastConfidence: 78
    },
    {
      id: 'F3',
      title: "Arctic Route Ice Closure",
      severity: "low",
      coordinates: { lat: 74.0, lng: 105.0 },
      description: "Northern Sea Route expected to close due to ice formation",
      impact: "Seasonal route closure, rerouting required",
      affectedVessels: 45,
      status: "Forecasted",
      probabilityDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      probability: 95,
      economicImpact: "Low Impact",
      region: "Arctic Ocean",
      type: "Seasonal",
      forecastConfidence: 92
    }
  ];

  // Filter disruptions based on time range only (simplified)
  const activeDisruptions = allDisruptions.filter(disruption => {
    // Time filter only
    const inTimeRange = disruption.startDate >= timeRange.start && 
                       (!disruption.endDate || disruption.endDate <= timeRange.end);
    return inTimeRange;
  });

  // All forecasted disruptions (always show)
  const filteredForecastedDisruptions = forecastedDisruptions;

  // Time filter options with more granular controls
  const timeFilters = [
    { label: 'Last 24H', value: '1d', days: 1 },
    { label: '7 Days', value: '7d', days: 7 },
    { label: '30 Days', value: '30d', days: 30 },
    { label: '90 Days', value: '90d', days: 90 },
    { label: '6 Months', value: '180d', days: 180 },
    { label: 'All Time', value: 'all', days: 365 }
  ];

  const handleTimeFilterChange = (filterValue) => {
    setSelectedTimeFilter(filterValue);
    const filter = timeFilters.find(f => f.value === filterValue);
    if (filter) {
      const now = new Date();
      const start = filter.value === 'all' 
        ? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() - filter.days * 24 * 60 * 60 * 1000);
      setTimeRange({ start, end: now });
    }
  };

  // Comprehensive Live AIS vessel data (synchronized with impacted vessels)
  const aisVessels = [
    // IMPACTED VESSELS (matching disruptions)
    { 
      id: 1, name: "MSC GÜLSÜN", type: "Container Ship", 
      coordinates: { lat: 15.3694, lng: 38.9386 }, 
      status: "Delayed", destination: "Rotterdam", 
      mmsi: "636092932", imo: "9839242", 
      speed: 0.2, course: 315, dwt: 232618,
      operator: "MSC", flag: "Liberia",
      impacted: true, disruptionId: 1,
      delayDays: 18
    },
    { 
      id: 2, name: "EVER GIVEN", type: "Container Ship", 
      coordinates: { lat: 20.5, lng: 40.3 }, 
      status: "Rerouted", destination: "Hamburg", 
      mmsi: "353136000", imo: "9811000",
      speed: 12.4, course: 180, dwt: 220940,
      operator: "Evergreen", flag: "Panama",
      impacted: true, disruptionId: 1,
      delayDays: 15
    },
    { 
      id: 3, name: "MAERSK LIMA", type: "Container Ship", 
      coordinates: { lat: 9.08, lng: -79.68 }, 
      status: "Stuck", destination: "Los Angeles", 
      mmsi: "219018400", imo: "9778425",
      speed: 0.0, course: 0, dwt: 147700,
      operator: "Maersk", flag: "Denmark",
      impacted: true, disruptionId: 2,
      delayDays: 21
    },
    { 
      id: 4, name: "COSCO SHIPPING GEMINI", type: "Container Ship", 
      coordinates: { lat: 44.6, lng: 33.5 }, 
      status: "Emergency", destination: "TBD", 
      mmsi: "477995300", imo: "9795600",
      speed: 0.0, course: 0, dwt: 199000,
      operator: "COSCO", flag: "Hong Kong",
      impacted: true, disruptionId: 3,
      delayDays: 45
    },
    { 
      id: 5, name: "HAPAG-LLOYD BERLIN", type: "Container Ship", 
      coordinates: { lat: 53.5511, lng: 9.9937 }, 
      status: "Delayed", destination: "New York", 
      mmsi: "636091759", imo: "9742448",
      speed: 0.0, course: 0, dwt: 142000,
      operator: "Hapag-Lloyd", flag: "Liberia",
      impacted: true, disruptionId: 6,
      delayDays: 6
    },
    { 
      id: 6, name: "CMA CGM MARCO POLO", type: "Container Ship", 
      coordinates: { lat: 26.5665, lng: 56.2500 }, 
      status: "Rerouted", destination: "Le Havre", 
      mmsi: "228339600", imo: "9454436",
      speed: 8.2, course: 270, dwt: 187625,
      operator: "CMA CGM", flag: "France",
      impacted: true, disruptionId: 5,
      delayDays: 8
    },

    // NORMAL OPERATIONAL VESSELS (Not impacted)
    { 
      id: 101, name: "OOCL HONG KONG", type: "Container Ship", 
      coordinates: { lat: 22.3193, lng: 114.1694 }, 
      status: "Underway", destination: "Long Beach", 
      mmsi: "477553000", imo: "9839244",
      speed: 22.1, course: 85, dwt: 191317,
      operator: "OOCL", flag: "Hong Kong",
      impacted: false
    },
    { 
      id: 102, name: "EMMA MAERSK", type: "Container Ship", 
      coordinates: { lat: 55.6761, lng: 12.5683 }, 
      status: "Loading", destination: "Shanghai", 
      mmsi: "220339000", imo: "9321483",
      speed: 0.0, course: 0, dwt: 156907,
      operator: "Maersk", flag: "Denmark",
      impacted: false
    },
    { 
      id: 103, name: "MADRID MAERSK", type: "Container Ship", 
      coordinates: { lat: 51.9, lng: 4.4 }, 
      status: "In Port", destination: "Felixstowe", 
      mmsi: "220414000", imo: "9778436",
      speed: 0.0, course: 0, dwt: 214286,
      operator: "Maersk", flag: "Denmark",
      impacted: false
    },
    { 
      id: 104, name: "MSC ANNA", type: "Container Ship", 
      coordinates: { lat: 40.4406, lng: -74.0544 }, 
      status: "Departed", destination: "Valencia", 
      mmsi: "636019825", imo: "9839256",
      speed: 18.7, course: 95, dwt: 234846,
      operator: "MSC", flag: "Liberia",
      impacted: false
    },
    { 
      id: 105, name: "HMM ALGECIRAS", type: "Container Ship", 
      coordinates: { lat: 36.1408, lng: -5.3536 }, 
      status: "Anchored", destination: "Hamburg", 
      mmsi: "440102000", imo: "9863871",
      speed: 0.0, course: 0, dwt: 228283,
      operator: "HMM", flag: "South Korea",
      impacted: false
    },
    { 
      id: 106, name: "ONE INNOVATION", type: "Container Ship", 
      coordinates: { lat: 35.6762, lng: 139.6503 }, 
      status: "Loading", destination: "Los Angeles", 
      mmsi: "431050000", imo: "9839268",
      speed: 0.0, course: 0, dwt: 147622,
      operator: "ONE", flag: "Japan",
      impacted: false
    },
    { 
      id: 107, name: "SEASPAN CHIWAN", type: "Container Ship", 
      coordinates: { lat: 49.2827, lng: -123.1207 }, 
      status: "In Port", destination: "Busan", 
      mmsi: "636017825", imo: "9778448",
      speed: 0.0, course: 0, dwt: 199000,
      operator: "Seaspan", flag: "Liberia",
      impacted: false
    },
    { 
      id: 108, name: "VALE BRASIL", type: "Bulk Carrier", 
      coordinates: { lat: -23.5505, lng: -46.6333 }, 
      status: "Loading", destination: "Qingdao", 
      mmsi: "710001200", imo: "9839270",
      speed: 0.0, course: 0, dwt: 402347,
      operator: "Vale", flag: "Brazil",
      impacted: false
    },
    { 
      id: 109, name: "BW EAGLE", type: "Oil Tanker", 
      coordinates: { lat: 26.2041, lng: 50.5516 }, 
      status: "Underway", destination: "Fujairah", 
      mmsi: "636091234", imo: "9321495",
      speed: 12.8, course: 120, dwt: 307284,
      operator: "BW Tankers", flag: "Singapore",
      impacted: false
    },
    { 
      id: 110, name: "EURONAV OLYMPIA", type: "Oil Tanker", 
      coordinates: { lat: 51.2211, lng: 2.9336 }, 
      status: "Anchored", destination: "Amsterdam", 
      mmsi: "209439000", imo: "9321507",
      speed: 0.0, course: 0, dwt: 441561,
      operator: "Euronav", flag: "Belgium",
      impacted: false
    },
    { 
      id: 111, name: "FRONT ALTAIR", type: "Oil Tanker", 
      coordinates: { lat: 25.2048, lng: 55.2708 }, 
      status: "Underway", destination: "Rotterdam", 
      mmsi: "257123000", imo: "9321519",
      speed: 14.2, course: 290, dwt: 109894,
      operator: "Frontline", flag: "Norway",
      impacted: false
    },
    { 
      id: 112, name: "NORDIC HAMSTER", type: "Oil Tanker", 
      coordinates: { lat: 60.1695, lng: 24.9354 }, 
      status: "Loading", destination: "Houston", 
      mmsi: "230123456", imo: "9321521",
      speed: 0.0, course: 0, dwt: 157092,
      operator: "Nordic Tankers", flag: "Finland",
      impacted: false
    },
    { 
      id: 113, name: "IRON BARON", type: "Bulk Carrier", 
      coordinates: { lat: -33.8688, lng: 151.2093 }, 
      status: "Departed", destination: "Shanghai", 
      mmsi: "503123000", imo: "9321533",
      speed: 13.5, course: 45, dwt: 180500,
      operator: "Iron Ore Co.", flag: "Australia",
      impacted: false
    },
    { 
      id: 114, name: "PACIFIC RUBY", type: "LNG Carrier", 
      coordinates: { lat: 41.0082, lng: 28.9784 }, 
      status: "Transit", destination: "Yokohama", 
      mmsi: "372123000", imo: "9321545",
      speed: 19.8, course: 70, dwt: 78500,
      operator: "Pacific Gas", flag: "Panama",
      impacted: false
    },
    { 
      id: 115, name: "CRYSTAL SYMPHONY", type: "Passenger Ship", 
      coordinates: { lat: 25.7617, lng: -80.1918 }, 
      status: "In Port", destination: "Cozumel", 
      mmsi: "636123456", imo: "9056123",
      speed: 0.0, course: 0, dwt: 28078,
      operator: "Crystal Cruises", flag: "Bahamas",
      impacted: false
    },
    { 
      id: 116, name: "NORWEGIAN BLISS", type: "Passenger Ship", 
      coordinates: { lat: 47.6062, lng: -122.3321 }, 
      status: "Loading", destination: "Alaska", 
      mmsi: "255123000", imo: "9778123",
      speed: 0.0, course: 0, dwt: 28000,
      operator: "Norwegian Cruise Line", flag: "Bahamas",
      impacted: false
    },
    { 
      id: 117, name: "SAPURA ESPERANZA", type: "Offshore Support", 
      coordinates: { lat: 4.2105, lng: 101.9758 }, 
      status: "Working", destination: "Offshore Platform", 
      mmsi: "533123000", imo: "9778135",
      speed: 0.1, course: 0, dwt: 4200,
      operator: "Sapura Energy", flag: "Malaysia",
      impacted: false
    },
    { 
      id: 118, name: "BOURBON RHEA", type: "Offshore Support", 
      coordinates: { lat: 2.2431, lng: 6.5144 }, 
      status: "Transit", destination: "Oil Platform", 
      mmsi: "228123000", imo: "9778147",
      speed: 8.5, course: 180, dwt: 1850,
      operator: "Bourbon Offshore", flag: "France",
      impacted: false
    },
    { 
      id: 119, name: "ATLANTIC GUARDIAN", type: "Research Vessel", 
      coordinates: { lat: 41.3851, lng: -70.2962 }, 
      status: "Research", destination: "Data Collection", 
      mmsi: "367123000", imo: "9778159",
      speed: 2.1, course: 225, dwt: 3200,
      operator: "NOAA", flag: "USA",
      impacted: false
    },
    { 
      id: 120, name: "MIGHTY SERVANT 3", type: "Heavy Lift", 
      coordinates: { lat: 52.3676, lng: 4.9041 }, 
      status: "Loading", destination: "Singapore", 
      mmsi: "245123000", imo: "9778161",
      speed: 0.0, course: 0, dwt: 57500,
      operator: "Boskalis", flag: "Netherlands",
      impacted: false
    }
  ];

  // World's 200 Busiest Ports Data
  const worldPorts = [
    // TOP 20 BUSIEST CONTAINER PORTS
    { id: 1, name: "Shanghai", country: "China", coordinates: { lat: 31.2304, lng: 121.4737 }, teu: 47030000, type: "Container", rank: 1, region: "Asia-Pacific" },
    { id: 2, name: "Singapore", country: "Singapore", coordinates: { lat: 1.3521, lng: 103.8198 }, teu: 37200000, type: "Container", rank: 2, region: "Asia-Pacific" },
    { id: 3, name: "Ningbo-Zhoushan", country: "China", coordinates: { lat: 29.8683, lng: 121.544 }, teu: 33350000, type: "Container", rank: 3, region: "Asia-Pacific" },
    { id: 4, name: "Shenzhen", country: "China", coordinates: { lat: 22.5431, lng: 114.0579 }, teu: 28770000, type: "Container", rank: 4, region: "Asia-Pacific" },
    { id: 5, name: "Guangzhou", country: "China", coordinates: { lat: 23.1291, lng: 113.2644 }, teu: 25230000, type: "Container", rank: 5, region: "Asia-Pacific" },
    { id: 6, name: "Busan", country: "South Korea", coordinates: { lat: 35.1796, lng: 129.0756 }, teu: 22990000, type: "Container", rank: 6, region: "Asia-Pacific" },
    { id: 7, name: "Hong Kong", country: "Hong Kong", coordinates: { lat: 22.3193, lng: 114.1694 }, teu: 17830000, type: "Container", rank: 7, region: "Asia-Pacific" },
    { id: 8, name: "Qingdao", country: "China", coordinates: { lat: 36.0986, lng: 120.3719 }, teu: 16650000, type: "Container", rank: 8, region: "Asia-Pacific" },
    { id: 9, name: "Los Angeles", country: "USA", coordinates: { lat: 33.7701, lng: -118.1937 }, teu: 10730000, type: "Container", rank: 9, region: "North America" },
    { id: 10, name: "Tianjin", country: "China", coordinates: { lat: 39.1422, lng: 117.1767 }, teu: 18350000, type: "Container", rank: 10, region: "Asia-Pacific" },
    { id: 11, name: "Rotterdam", country: "Netherlands", coordinates: { lat: 51.9244, lng: 4.4777 }, teu: 15280000, type: "Container", rank: 11, region: "Europe" },
    { id: 12, name: "Antwerp", country: "Belgium", coordinates: { lat: 51.2194, lng: 4.4025 }, teu: 12040000, type: "Container", rank: 12, region: "Europe" },
    { id: 13, name: "Long Beach", country: "USA", coordinates: { lat: 33.7701, lng: -118.1937 }, teu: 9020000, type: "Container", rank: 13, region: "North America" },
    { id: 14, name: "Xiamen", country: "China", coordinates: { lat: 24.4798, lng: 118.0894 }, teu: 12190000, type: "Container", rank: 14, region: "Asia-Pacific" },
    { id: 15, name: "Hamburg", country: "Germany", coordinates: { lat: 53.5511, lng: 9.9937 }, teu: 8910000, type: "Container", rank: 15, region: "Europe" },
    { id: 16, name: "New York/New Jersey", country: "USA", coordinates: { lat: 40.6782, lng: -74.0442 }, teu: 8500000, type: "Container", rank: 16, region: "North America" },
    { id: 17, name: "Tanjung Pelepas", country: "Malaysia", coordinates: { lat: 1.3644, lng: 103.5486 }, teu: 9100000, type: "Container", rank: 17, region: "Asia-Pacific" },
    { id: 18, name: "Kaohsiung", country: "Taiwan", coordinates: { lat: 22.6273, lng: 120.3014 }, teu: 9640000, type: "Container", rank: 18, region: "Asia-Pacific" },
    { id: 19, name: "Dalian", country: "China", coordinates: { lat: 38.9140, lng: 121.6147 }, teu: 9770000, type: "Container", rank: 19, region: "Asia-Pacific" },
    { id: 20, name: "Laem Chabang", country: "Thailand", coordinates: { lat: 13.0827, lng: 100.8833 }, teu: 8120000, type: "Container", rank: 20, region: "Asia-Pacific" },

    // MAJOR EUROPEAN PORTS (21-50)
    { id: 21, name: "Bremen/Bremerhaven", country: "Germany", coordinates: { lat: 53.5361, lng: 8.5822 }, teu: 5510000, type: "Container", rank: 21, region: "Europe" },
    { id: 22, name: "Valencia", country: "Spain", coordinates: { lat: 39.4699, lng: -0.3763 }, teu: 5440000, type: "Container", rank: 22, region: "Europe" },
    { id: 23, name: "Le Havre", country: "France", coordinates: { lat: 49.4944, lng: 0.1079 }, teu: 2870000, type: "Container", rank: 23, region: "Europe" },
    { id: 24, name: "Felixstowe", country: "UK", coordinates: { lat: 51.9539, lng: 1.3478 }, teu: 4060000, type: "Container", rank: 24, region: "Europe" },
    { id: 25, name: "Piraeus", country: "Greece", coordinates: { lat: 37.9358, lng: 23.6647 }, teu: 5430000, type: "Container", rank: 25, region: "Europe" },
    { id: 26, name: "Algeciras", country: "Spain", coordinates: { lat: 36.1408, lng: -5.3536 }, teu: 5000000, type: "Container", rank: 26, region: "Europe" },
    { id: 27, name: "Barcelona", country: "Spain", coordinates: { lat: 41.3522, lng: 2.1748 }, teu: 3610000, type: "Container", rank: 27, region: "Europe" },
    { id: 28, name: "Genoa", country: "Italy", coordinates: { lat: 44.4056, lng: 8.9463 }, teu: 2870000, type: "Container", rank: 28, region: "Europe" },
    { id: 29, name: "Marseille", country: "France", coordinates: { lat: 43.2965, lng: 5.3698 }, teu: 1580000, type: "Container", rank: 29, region: "Europe" },
    { id: 30, name: "London Gateway", country: "UK", coordinates: { lat: 51.5074, lng: 0.4833 }, teu: 1800000, type: "Container", rank: 30, region: "Europe" },

    // NORTH AMERICAN PORTS (31-60)
    { id: 31, name: "Vancouver", country: "Canada", coordinates: { lat: 49.2827, lng: -123.1207 }, teu: 3600000, type: "Container", rank: 31, region: "North America" },
    { id: 32, name: "Savannah", country: "USA", coordinates: { lat: 32.0835, lng: -81.0998 }, teu: 4540000, type: "Container", rank: 32, region: "North America" },
    { id: 33, name: "Norfolk", country: "USA", coordinates: { lat: 36.8468, lng: -76.2852 }, teu: 3000000, type: "Container", rank: 33, region: "North America" },
    { id: 34, name: "Charleston", country: "USA", coordinates: { lat: 32.7767, lng: -79.9311 }, teu: 2610000, type: "Container", rank: 34, region: "North America" },
    { id: 35, name: "Houston", country: "USA", coordinates: { lat: 29.7604, lng: -95.3698 }, teu: 3800000, type: "Container", rank: 35, region: "North America" },
    { id: 36, name: "Seattle", country: "USA", coordinates: { lat: 47.6062, lng: -122.3321 }, teu: 3770000, type: "Container", rank: 36, region: "North America" },
    { id: 37, name: "Tacoma", country: "USA", coordinates: { lat: 47.2529, lng: -122.4443 }, teu: 3200000, type: "Container", rank: 37, region: "North America" },
    { id: 38, name: "Oakland", country: "USA", coordinates: { lat: 37.8044, lng: -122.2712 }, teu: 2500000, type: "Container", rank: 38, region: "North America" },
    { id: 39, name: "Montreal", country: "Canada", coordinates: { lat: 45.5017, lng: -73.5673 }, teu: 1740000, type: "Container", rank: 39, region: "North America" },
    { id: 40, name: "Miami", country: "USA", coordinates: { lat: 25.7617, lng: -80.1918 }, teu: 1100000, type: "Container", rank: 40, region: "North America" },

    // LATIN AMERICAN PORTS (41-70)
    { id: 41, name: "Santos", country: "Brazil", coordinates: { lat: -23.9537, lng: -46.3228 }, teu: 4300000, type: "Container", rank: 41, region: "Latin America" },
    { id: 42, name: "Balboa", country: "Panama", coordinates: { lat: 8.9824, lng: -79.5199 }, teu: 3200000, type: "Container", rank: 42, region: "Latin America" },
    { id: 43, name: "Colon", country: "Panama", coordinates: { lat: 9.3549, lng: -79.9003 }, teu: 4210000, type: "Container", rank: 43, region: "Latin America" },
    { id: 44, name: "Cartagena", country: "Colombia", coordinates: { lat: 10.3932, lng: -75.4832 }, teu: 3030000, type: "Container", rank: 44, region: "Latin America" },
    { id: 45, name: "Callao", country: "Peru", coordinates: { lat: -12.0644, lng: -77.1561 }, teu: 2320000, type: "Container", rank: 45, region: "Latin America" },
    { id: 46, name: "Veracruz", country: "Mexico", coordinates: { lat: 19.1738, lng: -96.1342 }, teu: 1170000, type: "Container", rank: 46, region: "Latin America" },
    { id: 47, name: "Manzanillo", country: "Mexico", coordinates: { lat: 19.1138, lng: -104.3188 }, teu: 3030000, type: "Container", rank: 47, region: "Latin America" },
    { id: 48, name: "Buenos Aires", country: "Argentina", coordinates: { lat: -34.6118, lng: -58.3960 }, teu: 1550000, type: "Container", rank: 48, region: "Latin America" },
    { id: 49, name: "Rio de Janeiro", country: "Brazil", coordinates: { lat: -22.9068, lng: -43.1729 }, teu: 1300000, type: "Container", rank: 49, region: "Latin America" },
    { id: 50, name: "Valparaiso", country: "Chile", coordinates: { lat: -33.0458, lng: -71.6197 }, teu: 1000000, type: "Container", rank: 50, region: "Latin America" },

    // MIDDLE EAST & AFRICA PORTS (51-80)
    { id: 51, name: "Jebel Ali", country: "UAE", coordinates: { lat: 25.0112, lng: 55.1196 }, teu: 15360000, type: "Container", rank: 51, region: "Middle East" },
    { id: 52, name: "Port Said", country: "Egypt", coordinates: { lat: 31.2653, lng: 32.3019 }, teu: 7000000, type: "Container", rank: 52, region: "Middle East" },
    { id: 53, name: "Sohar", country: "Oman", coordinates: { lat: 24.3777, lng: 56.7526 }, teu: 5490000, type: "Container", rank: 53, region: "Middle East" },
    { id: 54, name: "Salalah", country: "Oman", coordinates: { lat: 17.0151, lng: 54.0924 }, teu: 5720000, type: "Container", rank: 54, region: "Middle East" },
    { id: 55, name: "King Abdullah", country: "Saudi Arabia", coordinates: { lat: 22.3187, lng: 39.1026 }, teu: 2580000, type: "Container", rank: 55, region: "Middle East" },
    { id: 56, name: "Hamad", country: "Qatar", coordinates: { lat: 25.2867, lng: 51.5333 }, teu: 1460000, type: "Container", rank: 56, region: "Middle East" },
    { id: 57, name: "Durban", country: "South Africa", coordinates: { lat: -29.8587, lng: 31.0218 }, teu: 2840000, type: "Container", rank: 57, region: "Africa" },
    { id: 58, name: "Cape Town", country: "South Africa", coordinates: { lat: -33.9249, lng: 18.4241 }, teu: 1350000, type: "Container", rank: 58, region: "Africa" },
    { id: 59, name: "Alexandria", country: "Egypt", coordinates: { lat: 31.2001, lng: 29.9187 }, teu: 3100000, type: "Container", rank: 59, region: "Africa" },
    { id: 60, name: "Casablanca", country: "Morocco", coordinates: { lat: 33.5731, lng: -7.5898 }, teu: 1420000, type: "Container", rank: 60, region: "Africa" },

    // ADDITIONAL ASIA-PACIFIC PORTS (61-100)
    { id: 61, name: "Jakarta", country: "Indonesia", coordinates: { lat: -6.2088, lng: 106.8456 }, teu: 7600000, type: "Container", rank: 61, region: "Asia-Pacific" },
    { id: 62, name: "Manila", country: "Philippines", coordinates: { lat: 14.5995, lng: 120.9842 }, teu: 5520000, type: "Container", rank: 62, region: "Asia-Pacific" },
    { id: 63, name: "Ho Chi Minh City", country: "Vietnam", coordinates: { lat: 10.8231, lng: 106.6297 }, teu: 7940000, type: "Container", rank: 63, region: "Asia-Pacific" },
    { id: 64, name: "Haiphong", country: "Vietnam", coordinates: { lat: 20.8449, lng: 106.6881 }, teu: 2740000, type: "Container", rank: 64, region: "Asia-Pacific" },
    { id: 65, name: "Colombo", country: "Sri Lanka", coordinates: { lat: 6.9271, lng: 79.8612 }, teu: 7240000, type: "Container", rank: 65, region: "Asia-Pacific" },
    { id: 66, name: "Chittagong", country: "Bangladesh", coordinates: { lat: 22.3569, lng: 91.7832 }, teu: 3100000, type: "Container", rank: 66, region: "Asia-Pacific" },
    { id: 67, name: "Karachi", country: "Pakistan", coordinates: { lat: 24.8607, lng: 67.0011 }, teu: 2400000, type: "Container", rank: 67, region: "Asia-Pacific" },
    { id: 68, name: "Mumbai", country: "India", coordinates: { lat: 19.0760, lng: 72.8777 }, teu: 5650000, type: "Container", rank: 68, region: "Asia-Pacific" },
    { id: 69, name: "Chennai", country: "India", coordinates: { lat: 13.0827, lng: 80.2707 }, teu: 2040000, type: "Container", rank: 69, region: "Asia-Pacific" },
    { id: 70, name: "Jawaharlal Nehru", country: "India", coordinates: { lat: 18.9480, lng: 72.9970 }, teu: 5100000, type: "Container", rank: 70, region: "Asia-Pacific" },

    // SMALLER BUT STRATEGIC PORTS (71-120)
    { id: 71, name: "Yokohama", country: "Japan", coordinates: { lat: 35.4437, lng: 139.6380 }, teu: 2960000, type: "Container", rank: 71, region: "Asia-Pacific" },
    { id: 72, name: "Kobe", country: "Japan", coordinates: { lat: 34.6901, lng: 135.1956 }, teu: 2710000, type: "Container", rank: 72, region: "Asia-Pacific" },
    { id: 73, name: "Tokyo", country: "Japan", coordinates: { lat: 35.6528, lng: 139.7594 }, teu: 4970000, type: "Container", rank: 73, region: "Asia-Pacific" },
    { id: 74, name: "Nagoya", country: "Japan", coordinates: { lat: 35.1815, lng: 136.9066 }, teu: 2930000, type: "Container", rank: 74, region: "Asia-Pacific" },
    { id: 75, name: "Osaka", country: "Japan", coordinates: { lat: 34.6937, lng: 135.5023 }, teu: 2370000, type: "Container", rank: 75, region: "Asia-Pacific" },
    { id: 76, name: "Sydney", country: "Australia", coordinates: { lat: -33.8688, lng: 151.2093 }, teu: 2580000, type: "Container", rank: 76, region: "Asia-Pacific" },
    { id: 77, name: "Melbourne", country: "Australia", coordinates: { lat: -37.8136, lng: 144.9631 }, teu: 2970000, type: "Container", rank: 77, region: "Asia-Pacific" },
    { id: 78, name: "Brisbane", country: "Australia", coordinates: { lat: -27.4698, lng: 153.0251 }, teu: 1390000, type: "Container", rank: 78, region: "Asia-Pacific" },
    { id: 79, name: "Adelaide", country: "Australia", coordinates: { lat: -34.9285, lng: 138.6007 }, teu: 240000, type: "Container", rank: 79, region: "Asia-Pacific" },
    { id: 80, name: "Fremantle", country: "Australia", coordinates: { lat: -32.0569, lng: 115.7574 }, teu: 810000, type: "Container", rank: 80, region: "Asia-Pacific" },

    // EUROPEAN SECONDARY PORTS (81-120)
    { id: 81, name: "Gdansk", country: "Poland", coordinates: { lat: 54.3520, lng: 18.6466 }, teu: 2070000, type: "Container", rank: 81, region: "Europe" },
    { id: 82, name: "Stockholm", country: "Sweden", coordinates: { lat: 59.3293, lng: 18.0686 }, teu: 450000, type: "Container", rank: 82, region: "Europe" },
    { id: 83, name: "Gothenburg", country: "Sweden", coordinates: { lat: 57.7089, lng: 11.9746 }, teu: 870000, type: "Container", rank: 83, region: "Europe" },
    { id: 84, name: "Helsinki", country: "Finland", coordinates: { lat: 60.1699, lng: 24.9384 }, teu: 580000, type: "Container", rank: 84, region: "Europe" },
    { id: 85, name: "Copenhagen", country: "Denmark", coordinates: { lat: 55.6761, lng: 12.5683 }, teu: 650000, type: "Container", rank: 85, region: "Europe" },
    { id: 86, name: "Oslo", country: "Norway", coordinates: { lat: 59.9139, lng: 10.7522 }, teu: 320000, type: "Container", rank: 86, region: "Europe" },
    { id: 87, name: "Constanta", country: "Romania", coordinates: { lat: 44.1598, lng: 28.6348 }, teu: 770000, type: "Container", rank: 87, region: "Europe" },
    { id: 88, name: "Thessaloniki", country: "Greece", coordinates: { lat: 40.6401, lng: 22.9444 }, teu: 520000, type: "Container", rank: 88, region: "Europe" },
    { id: 89, name: "Rijeka", country: "Croatia", coordinates: { lat: 45.3271, lng: 14.4422 }, teu: 240000, type: "Container", rank: 89, region: "Europe" },
    { id: 90, name: "Trieste", country: "Italy", coordinates: { lat: 45.6495, lng: 13.7768 }, teu: 790000, type: "Container", rank: 90, region: "Europe" },

    // BULK & SPECIALTY PORTS (91-150)
    { id: 91, name: "Port Hedland", country: "Australia", coordinates: { lat: -20.3117, lng: 118.6065 }, teu: 0, type: "Bulk/Iron Ore", rank: 91, region: "Asia-Pacific" },
    { id: 92, name: "Dampier", country: "Australia", coordinates: { lat: -20.6617, lng: 116.7133 }, teu: 0, type: "Bulk/LNG", rank: 92, region: "Asia-Pacific" },
    { id: 93, name: "Newcastle", country: "Australia", coordinates: { lat: -32.9283, lng: 151.7817 }, teu: 0, type: "Bulk/Coal", rank: 93, region: "Asia-Pacific" },
    { id: 94, name: "Gladstone", country: "Australia", coordinates: { lat: -23.8449, lng: 151.2694 }, teu: 0, type: "Bulk/Coal", rank: 94, region: "Asia-Pacific" },
    { id: 95, name: "Tubarao", country: "Brazil", coordinates: { lat: -20.2976, lng: -40.2958 }, teu: 0, type: "Bulk/Iron Ore", rank: 95, region: "Latin America" },
    { id: 96, name: "Valdez", country: "USA", coordinates: { lat: 61.1308, lng: -146.3483 }, teu: 0, type: "Oil Terminal", rank: 96, region: "North America" },
    { id: 97, name: "Louisiana Offshore", country: "USA", coordinates: { lat: 28.9717, lng: -90.0612 }, teu: 0, type: "Oil Terminal", rank: 97, region: "North America" },
    { id: 98, name: "Ras Tanura", country: "Saudi Arabia", coordinates: { lat: 26.6469, lng: 50.1693 }, teu: 0, type: "Oil Terminal", rank: 98, region: "Middle East" },
    { id: 99, name: "Kharg Island", country: "Iran", coordinates: { lat: 29.2581, lng: 50.3244 }, teu: 0, type: "Oil Terminal", rank: 99, region: "Middle East" },
    { id: 100, name: "Mina Al Ahmadi", country: "Kuwait", coordinates: { lat: 29.0647, lng: 48.1594 }, teu: 0, type: "Oil Terminal", rank: 100, region: "Middle East" },

    // REMAINING STRATEGIC PORTS (101-200)
    { id: 101, name: "Fujairah", country: "UAE", coordinates: { lat: 25.1164, lng: 56.3500 }, teu: 0, type: "Oil/Bulk", rank: 101, region: "Middle East" },
    { id: 102, name: "Bandar Abbas", country: "Iran", coordinates: { lat: 27.1865, lng: 56.2808 }, teu: 2600000, type: "Container", rank: 102, region: "Middle East" },
    { id: 103, name: "Khor Fakkan", country: "UAE", coordinates: { lat: 25.3375, lng: 56.3422 }, teu: 3850000, type: "Container", rank: 103, region: "Middle East" },
    { id: 104, name: "Dammam", country: "Saudi Arabia", coordinates: { lat: 26.4207, lng: 50.0888 }, teu: 1890000, type: "Container", rank: 104, region: "Middle East" },
    { id: 105, name: "Kuwait", country: "Kuwait", coordinates: { lat: 29.3759, lng: 47.9774 }, teu: 1420000, type: "Container", rank: 105, region: "Middle East" },
    { id: 106, name: "Umm Qasr", country: "Iraq", coordinates: { lat: 30.0361, lng: 47.9167 }, teu: 1180000, type: "Container", rank: 106, region: "Middle East" },
    { id: 107, name: "Bushehr", country: "Iran", coordinates: { lat: 28.9684, lng: 50.8385 }, teu: 780000, type: "Container", rank: 107, region: "Middle East" },
    { id: 108, name: "Aqaba", country: "Jordan", coordinates: { lat: 29.5321, lng: 35.0061 }, teu: 890000, type: "Container", rank: 108, region: "Middle East" },
    { id: 109, name: "Eilat", country: "Israel", coordinates: { lat: 29.5581, lng: 34.9482 }, teu: 250000, type: "Container", rank: 109, region: "Middle East" },
    { id: 110, name: "Haifa", country: "Israel", coordinates: { lat: 32.7940, lng: 34.9896 }, teu: 1580000, type: "Container", rank: 110, region: "Middle East" },
    { id: 111, name: "Ashdod", country: "Israel", coordinates: { lat: 31.8040, lng: 34.6553 }, teu: 1500000, type: "Container", rank: 111, region: "Middle East" },
    { id: 112, name: "Beirut", country: "Lebanon", coordinates: { lat: 33.9013, lng: 35.5134 }, teu: 1100000, type: "Container", rank: 112, region: "Middle East" },
    { id: 113, name: "Lattakia", country: "Syria", coordinates: { lat: 35.5212, lng: 35.7850 }, teu: 650000, type: "Container", rank: 113, region: "Middle East" },
    { id: 114, name: "Mersin", country: "Turkey", coordinates: { lat: 36.8121, lng: 34.6415 }, teu: 1850000, type: "Container", rank: 114, region: "Europe" },
    { id: 115, name: "Istanbul", country: "Turkey", coordinates: { lat: 41.0082, lng: 28.9784 }, teu: 3100000, type: "Container", rank: 115, region: "Europe" },
    { id: 116, name: "Izmir", country: "Turkey", coordinates: { lat: 38.4192, lng: 27.1287 }, teu: 1340000, type: "Container", rank: 116, region: "Europe" },
    { id: 117, name: "Aliaga", country: "Turkey", coordinates: { lat: 38.7983, lng: 26.9669 }, teu: 920000, type: "Container", rank: 117, region: "Europe" },
    { id: 118, name: "Novorossiysk", country: "Russia", coordinates: { lat: 44.7272, lng: 37.7686 }, teu: 750000, type: "Container", rank: 118, region: "Europe" },
    { id: 119, name: "St. Petersburg", country: "Russia", coordinates: { lat: 59.9311, lng: 30.3609 }, teu: 2100000, type: "Container", rank: 119, region: "Europe" },
    { id: 120, name: "Kaliningrad", country: "Russia", coordinates: { lat: 54.7104, lng: 20.4522 }, teu: 720000, type: "Container", rank: 120, region: "Europe" },
    { id: 121, name: "Murmansk", country: "Russia", coordinates: { lat: 68.9792, lng: 33.0925 }, teu: 0, type: "Bulk/Arctic", rank: 121, region: "Europe" },
    { id: 122, name: "Arkhangelsk", country: "Russia", coordinates: { lat: 64.5401, lng: 40.5433 }, teu: 0, type: "Bulk/Timber", rank: 122, region: "Europe" },
    { id: 123, name: "Vladivostok", country: "Russia", coordinates: { lat: 43.1056, lng: 131.8735 }, teu: 890000, type: "Container", rank: 123, region: "Asia-Pacific" },
    { id: 124, name: "Vostochny", country: "Russia", coordinates: { lat: 42.7347, lng: 133.1744 }, teu: 0, type: "Bulk/Coal", rank: 124, region: "Asia-Pacific" },
    { id: 125, name: "Nakhodka", country: "Russia", coordinates: { lat: 42.8147, lng: 132.8747 }, teu: 180000, type: "Container", rank: 125, region: "Asia-Pacific" },

    // AFRICAN PORTS (126-150)
    { id: 126, name: "Lagos", country: "Nigeria", coordinates: { lat: 6.4474, lng: 3.3903 }, teu: 1700000, type: "Container", rank: 126, region: "Africa" },
    { id: 127, name: "Abidjan", country: "Ivory Coast", coordinates: { lat: 5.3600, lng: -4.0083 }, teu: 810000, type: "Container", rank: 127, region: "Africa" },
    { id: 128, name: "Tema", country: "Ghana", coordinates: { lat: 5.6698, lng: -0.0171 }, teu: 720000, type: "Container", rank: 128, region: "Africa" },
    { id: 129, name: "Lome", country: "Togo", coordinates: { lat: 6.1375, lng: 1.2123 }, teu: 1350000, type: "Container", rank: 129, region: "Africa" },
    { id: 130, name: "Cotonou", country: "Benin", coordinates: { lat: 6.3654, lng: 2.4183 }, teu: 1100000, type: "Container", rank: 130, region: "Africa" },
    { id: 131, name: "Douala", country: "Cameroon", coordinates: { lat: 4.0483, lng: 9.7043 }, teu: 890000, type: "Container", rank: 131, region: "Africa" },
    { id: 132, name: "Pointe-Noire", country: "Congo", coordinates: { lat: -4.7692, lng: 11.8636 }, teu: 420000, type: "Container", rank: 132, region: "Africa" },
    { id: 133, name: "Luanda", country: "Angola", coordinates: { lat: -8.8390, lng: 13.2894 }, teu: 650000, type: "Container", rank: 133, region: "Africa" },
    { id: 134, name: "Walvis Bay", country: "Namibia", coordinates: { lat: -22.9576, lng: 14.5052 }, teu: 390000, type: "Container", rank: 134, region: "Africa" },
    { id: 135, name: "Port Elizabeth", country: "South Africa", coordinates: { lat: -33.9608, lng: 25.6022 }, teu: 870000, type: "Container", rank: 135, region: "Africa" },
    { id: 136, name: "East London", country: "South Africa", coordinates: { lat: -33.0153, lng: 27.9116 }, teu: 180000, type: "Container", rank: 136, region: "Africa" },
    { id: 137, name: "Maputo", country: "Mozambique", coordinates: { lat: -25.9692, lng: 32.5732 }, teu: 720000, type: "Container", rank: 137, region: "Africa" },
    { id: 138, name: "Beira", country: "Mozambique", coordinates: { lat: -19.8436, lng: 34.8389 }, teu: 320000, type: "Container", rank: 138, region: "Africa" },
    { id: 139, name: "Dar es Salaam", country: "Tanzania", coordinates: { lat: -6.7924, lng: 39.2083 }, teu: 970000, type: "Container", rank: 139, region: "Africa" },
    { id: 140, name: "Mombasa", country: "Kenya", coordinates: { lat: -4.0435, lng: 39.6682 }, teu: 1450000, type: "Container", rank: 140, region: "Africa" },
    { id: 141, name: "Djibouti", country: "Djibouti", coordinates: { lat: 11.5720, lng: 43.1456 }, teu: 1020000, type: "Container", rank: 141, region: "Africa" },
    { id: 142, name: "Port Sudan", country: "Sudan", coordinates: { lat: 19.6158, lng: 37.2181 }, teu: 680000, type: "Container", rank: 142, region: "Africa" },
    { id: 143, name: "Safaga", country: "Egypt", coordinates: { lat: 26.7311, lng: 33.9378 }, teu: 450000, type: "Container", rank: 143, region: "Africa" },
    { id: 144, name: "Suez", country: "Egypt", coordinates: { lat: 29.9668, lng: 32.5498 }, teu: 3200000, type: "Container", rank: 144, region: "Africa" },
    { id: 145, name: "Damietta", country: "Egypt", coordinates: { lat: 31.4165, lng: 31.8133 }, teu: 3400000, type: "Container", rank: 145, region: "Africa" },
    { id: 146, name: "Benghazi", country: "Libya", coordinates: { lat: 32.1181, lng: 20.0680 }, teu: 280000, type: "Container", rank: 146, region: "Africa" },
    { id: 147, name: "Tripoli", country: "Libya", coordinates: { lat: 32.8872, lng: 13.1913 }, teu: 520000, type: "Container", rank: 147, region: "Africa" },
    { id: 148, name: "Tunis", country: "Tunisia", coordinates: { lat: 36.8485, lng: 10.2395 }, teu: 760000, type: "Container", rank: 148, region: "Africa" },
    { id: 149, name: "Algiers", country: "Algeria", coordinates: { lat: 36.7538, lng: 3.0588 }, teu: 920000, type: "Container", rank: 149, region: "Africa" },
    { id: 150, name: "Oran", country: "Algeria", coordinates: { lat: 35.6969, lng: -0.6331 }, teu: 410000, type: "Container", rank: 150, region: "Africa" },

    // PACIFIC & REMOTE PORTS (151-200)
    { id: 151, name: "Honolulu", country: "USA", coordinates: { lat: 21.3099, lng: -157.8581 }, teu: 1120000, type: "Container", rank: 151, region: "Pacific" },
    { id: 152, name: "Suva", country: "Fiji", coordinates: { lat: -18.1248, lng: 178.4501 }, teu: 89000, type: "Container", rank: 152, region: "Pacific" },
    { id: 153, name: "Port Moresby", country: "Papua New Guinea", coordinates: { lat: -9.4438, lng: 147.1803 }, teu: 250000, type: "Container", rank: 153, region: "Pacific" },
    { id: 154, name: "Noumea", country: "New Caledonia", coordinates: { lat: -22.2758, lng: 166.4581 }, teu: 180000, type: "Container", rank: 154, region: "Pacific" },
    { id: 155, name: "Papeete", country: "Tahiti", coordinates: { lat: -17.5516, lng: -149.5585 }, teu: 95000, type: "Container", rank: 155, region: "Pacific" },
    { id: 156, name: "Guam", country: "USA", coordinates: { lat: 13.4443, lng: 144.7937 }, teu: 340000, type: "Container", rank: 156, region: "Pacific" },
    { id: 157, name: "Saipan", country: "USA", coordinates: { lat: 15.1979, lng: 145.7183 }, teu: 45000, type: "Container", rank: 157, region: "Pacific" },
    { id: 158, name: "Majuro", country: "Marshall Islands", coordinates: { lat: 7.1315, lng: 171.1845 }, teu: 25000, type: "Container", rank: 158, region: "Pacific" },
    { id: 159, name: "Palau", country: "Palau", coordinates: { lat: 7.5000, lng: 134.6242 }, teu: 15000, type: "Container", rank: 159, region: "Pacific" },
    { id: 160, name: "Pohnpei", country: "Micronesia", coordinates: { lat: 6.8874, lng: 158.2150 }, teu: 18000, type: "Container", rank: 160, region: "Pacific" },

    // ARCTIC & REMOTE NORTHERN PORTS (161-180)
    { id: 161, name: "Reykjavik", country: "Iceland", coordinates: { lat: 64.1466, lng: -21.9426 }, teu: 180000, type: "Container", rank: 161, region: "Arctic" },
    { id: 162, name: "Nuuk", country: "Greenland", coordinates: { lat: 64.1836, lng: -51.7214 }, teu: 12000, type: "Container", rank: 162, region: "Arctic" },
    { id: 163, name: "Tromso", country: "Norway", coordinates: { lat: 69.6492, lng: 18.9553 }, teu: 45000, type: "Container", rank: 163, region: "Arctic" },
    { id: 164, name: "Kirkenes", country: "Norway", coordinates: { lat: 69.7267, lng: 30.0533 }, teu: 28000, type: "Container", rank: 164, region: "Arctic" },
    { id: 165, name: "Hammerfest", country: "Norway", coordinates: { lat: 70.6633, lng: 23.6821 }, teu: 35000, type: "LNG Terminal", rank: 165, region: "Arctic" },
    { id: 166, name: "Barrow", country: "USA", coordinates: { lat: 71.2906, lng: -156.7886 }, teu: 8000, type: "Supply Port", rank: 166, region: "Arctic" },
    { id: 167, name: "Prudhoe Bay", country: "USA", coordinates: { lat: 70.2553, lng: -148.3370 }, teu: 0, type: "Oil Terminal", rank: 167, region: "Arctic" },
    { id: 168, name: "Churchill", country: "Canada", coordinates: { lat: 58.7684, lng: -94.1647 }, teu: 85000, type: "Grain Terminal", rank: 168, region: "Arctic" },
    { id: 169, name: "Iqaluit", country: "Canada", coordinates: { lat: 63.7467, lng: -68.5170 }, teu: 15000, type: "Supply Port", rank: 169, region: "Arctic" },
    { id: 170, name: "Thule", country: "Greenland", coordinates: { lat: 76.5311, lng: -68.7894 }, teu: 5000, type: "Military Base", rank: 170, region: "Arctic" },

    // CARIBBEAN & ISLAND PORTS (171-190)
    { id: 171, name: "Freeport", country: "Bahamas", coordinates: { lat: 26.5328, lng: -78.6963 }, teu: 1350000, type: "Container", rank: 171, region: "Caribbean" },
    { id: 172, name: "Kingston", country: "Jamaica", coordinates: { lat: 17.9714, lng: -76.7931 }, teu: 1750000, type: "Container", rank: 172, region: "Caribbean" },
    { id: 173, name: "Port of Spain", country: "Trinidad", coordinates: { lat: 10.6549, lng: -61.5097 }, teu: 580000, type: "Container", rank: 173, region: "Caribbean" },
    { id: 174, name: "Bridgetown", country: "Barbados", coordinates: { lat: 13.0969, lng: -59.6145 }, teu: 280000, type: "Container", rank: 174, region: "Caribbean" },
    { id: 175, name: "Castries", country: "St. Lucia", coordinates: { lat: 14.0101, lng: -60.9875 }, teu: 120000, type: "Container", rank: 175, region: "Caribbean" },
    { id: 176, name: "San Juan", country: "Puerto Rico", coordinates: { lat: 18.4655, lng: -66.1057 }, teu: 1580000, type: "Container", rank: 176, region: "Caribbean" },
    { id: 177, name: "Santo Domingo", country: "Dominican Republic", coordinates: { lat: 18.4861, lng: -69.9312 }, teu: 1450000, type: "Container", rank: 177, region: "Caribbean" },
    { id: 178, name: "Port-au-Prince", country: "Haiti", coordinates: { lat: 18.5392, lng: -72.3350 }, teu: 380000, type: "Container", rank: 178, region: "Caribbean" },
    { id: 179, name: "Havana", country: "Cuba", coordinates: { lat: 23.1136, lng: -82.3666 }, teu: 720000, type: "Container", rank: 179, region: "Caribbean" },
    { id: 180, name: "Willemstad", country: "Curacao", coordinates: { lat: 12.1696, lng: -68.9900 }, teu: 450000, type: "Container", rank: 180, region: "Caribbean" },

    // REMAINING SPECIALIZED PORTS (181-200)
    { id: 181, name: "McMurdo Station", country: "Antarctica", coordinates: { lat: -77.8419, lng: 166.6863 }, teu: 0, type: "Research Base", rank: 181, region: "Antarctica" },
    { id: 182, name: "Rothera", country: "Antarctica", coordinates: { lat: -67.5681, lng: -68.1300 }, teu: 0, type: "Research Base", rank: 182, region: "Antarctica" },
    { id: 183, name: "Palmer Station", country: "Antarctica", coordinates: { lat: -64.7740, lng: -64.0530 }, teu: 0, type: "Research Base", rank: 183, region: "Antarctica" },
    { id: 184, name: "Ushuaia", country: "Argentina", coordinates: { lat: -54.8019, lng: -68.3030 }, teu: 85000, type: "Container", rank: 184, region: "Latin America" },
    { id: 185, name: "Punta Arenas", country: "Chile", coordinates: { lat: -53.1638, lng: -70.9171 }, teu: 180000, type: "Container", rank: 185, region: "Latin America" },
    { id: 186, name: "Stanley", country: "Falkland Islands", coordinates: { lat: -51.6977, lng: -57.8571 }, teu: 12000, type: "Supply Port", rank: 186, region: "South Atlantic" },
    { id: 187, name: "Ascension Island", country: "UK", coordinates: { lat: -7.9467, lng: -14.3559 }, teu: 8000, type: "Military Base", rank: 187, region: "South Atlantic" },
    { id: 188, name: "St. Helena", country: "UK", coordinates: { lat: -15.9387, lng: -5.7138 }, teu: 5000, type: "Supply Port", rank: 188, region: "South Atlantic" },
    { id: 189, name: "Tristan da Cunha", country: "UK", coordinates: { lat: -37.1184, lng: -12.2836 }, teu: 2000, type: "Supply Port", rank: 189, region: "South Atlantic" },
    { id: 190, name: "Kerguelen Islands", country: "France", coordinates: { lat: -49.2804, lng: 69.1496 }, teu: 1000, type: "Research Base", rank: 190, region: "Indian Ocean" },
    { id: 191, name: "Heard Island", country: "Australia", coordinates: { lat: -53.1028, lng: 73.5092 }, teu: 500, type: "Research Base", rank: 191, region: "Indian Ocean" },
    { id: 192, name: "Diego Garcia", country: "UK/USA", coordinates: { lat: -7.3167, lng: 72.4167 }, teu: 15000, type: "Military Base", rank: 192, region: "Indian Ocean" },
    { id: 193, name: "Male", country: "Maldives", coordinates: { lat: 4.1755, lng: 73.5093 }, teu: 180000, type: "Container", rank: 193, region: "Indian Ocean" },
    { id: 194, name: "Port Louis", country: "Mauritius", coordinates: { lat: -20.1654, lng: 57.5014 }, teu: 720000, type: "Container", rank: 194, region: "Indian Ocean" },
    { id: 195, name: "Reunion", country: "France", coordinates: { lat: -20.8789, lng: 55.4481 }, teu: 350000, type: "Container", rank: 195, region: "Indian Ocean" },
    { id: 196, name: "Seychelles", country: "Seychelles", coordinates: { lat: -4.6796, lng: 55.4920 }, teu: 180000, type: "Container", rank: 196, region: "Indian Ocean" },
    { id: 197, name: "Socotra", country: "Yemen", coordinates: { lat: 12.4634, lng: 53.8237 }, teu: 45000, type: "Supply Port", rank: 197, region: "Indian Ocean" },
    { id: 198, name: "Christmas Island", country: "Australia", coordinates: { lat: -10.4475, lng: 105.6904 }, teu: 25000, type: "Supply Port", rank: 198, region: "Indian Ocean" },
    { id: 199, name: "Cocos Islands", country: "Australia", coordinates: { lat: -12.1642, lng: 96.8710 }, teu: 8000, type: "Supply Port", rank: 199, region: "Indian Ocean" },
    { id: 200, name: "Norfolk Island", country: "Australia", coordinates: { lat: -29.0408, lng: 167.9547 }, teu: 12000, type: "Supply Port", rank: 200, region: "Pacific" }
  ];

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getVesselStatusColor = (status) => {
    switch(status) {
      case 'In Port': return '#10b981';
      case 'Underway': return '#3b82f6';
      case 'Loading': return '#f59e0b';
      case 'Anchored': return '#ef4444';
      case 'Departed': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ color: 'white' }}>
            {/* Modern Time Slicer Interface */}
      <div style={{ 
        backgroundColor: '#1e293b', 
        borderRadius: '16px', 
        padding: '24px', 
        marginBottom: '24px', 
        border: '1px solid #334155',
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ color: '#f1f5f9', margin: 0, fontSize: '24px', fontWeight: '700' }}>
              Maritime Intelligence Timeline
            </h2>
            <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '14px' }}>
              Interactive analysis of global shipping disruptions and vessel movements
            </p>
          </div>
          <div style={{ 
            backgroundColor: 'rgba(59, 130, 246, 0.1)', 
            padding: '12px 16px', 
            borderRadius: '8px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <div style={{ fontSize: '12px', color: '#93c5fd', fontWeight: '600' }}>LIVE DATA</div>
            <div style={{ fontSize: '18px', color: '#3b82f6', fontWeight: '700' }}>
              {activeDisruptions.length + filteredForecastedDisruptions.length} Events
            </div>
          </div>
        </div>

        {/* Interactive Time Slider */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <label style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: '600' }}>
              ⏱️ Time Range: {timeSliderValue} days
            </label>
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>
              {timeRange.start.toLocaleDateString()} → {timeRange.end.toLocaleDateString()}
            </div>
          </div>
          
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <input
              type="range"
              min="1"
              max="3650"
              value={timeSliderValue}
              onChange={(e) => {
                const days = parseInt(e.target.value);
                setTimeSliderValue(days);
                const now = new Date();
                let start, end;
                if (days > 365) {
                  // For future forecasts beyond 1 year
                  start = new Date();
                  end = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
                } else {
                  // For historical data
                  start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
                  end = new Date();
                }
                setTimeRange({ start, end });
                // Update button selection
                const matchingFilter = timeFilters.find(f => f.days === days);
                if (matchingFilter) {
                  setSelectedTimeFilter(matchingFilter.value);
                }
              }}
              style={{
                width: '100%',
                height: '8px',
                background: 'linear-gradient(to right, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: '4px',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none'
              }}
            />
            
            {/* Time markers */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
              <span>1 day</span>
              <span>30 days</span>
              <span>90 days</span>
              <span>1 year</span>
            </div>
          </div>

          {/* Quick Time Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {timeFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  setSelectedTimeFilter(filter.value);
                  setTimeSliderValue(filter.days);
                  const now = new Date();
                  const start = filter.value === 'all'
                    ? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
                    : new Date(Date.now() - filter.days * 24 * 60 * 60 * 1000);
                  setTimeRange({ start, end: now });
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  backgroundColor: selectedTimeFilter === filter.value 
                    ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
                    : 'rgba(71, 85, 105, 0.3)',
                  color: selectedTimeFilter === filter.value ? 'white' : '#d1d5db',
                  transition: 'all 0.3s ease',
                  transform: selectedTimeFilter === filter.value ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: selectedTimeFilter === filter.value 
                    ? '0 4px 12px rgba(59, 130, 246, 0.3)' 
                    : 'none'
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>


      </div>



      {/* Interactive Map Placeholder */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '30px', minHeight: '400px', position: 'relative', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: '#60a5fa', margin: 0, fontSize: '20px' }}>Global Maritime Intelligence Map</h3>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>
            {activeDisruptions.length} disruptions • {aisVessels.length} vessels • {worldPorts.length} ports
          </div>
        </div>
        
        {/* Real Leaflet Map Component */}
        <RealLeafletMap 
          disruptions={[...activeDisruptions, ...filteredForecastedDisruptions]}
          vessels={aisVessels}
          ports={worldPorts}
          onDisruptionClick={setSelectedDisruption}
          selectedDisruption={selectedDisruption}
          getSeverityColor={getSeverityColor}
          getVesselStatusColor={getVesselStatusColor}
        />
      </div>

            {/* Active Disruptions Detail with News Sources */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px', marginBottom: '30px' }}>
        {activeDisruptions.map((disruption) => (
          <div
            key={disruption.id}
            style={{
              backgroundColor: '#1e293b',
              padding: '24px',
              borderRadius: '16px',
              border: `1px solid ${getSeverityColor(disruption.severity)}`,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transform: selectedDisruption?.id === disruption.id ? 'scale(1.02)' : 'scale(1)',
              boxShadow: selectedDisruption?.id === disruption.id 
                ? `0 8px 32px ${getSeverityColor(disruption.severity)}40` 
                : '0 4px 16px rgba(0, 0, 0, 0.1)',
              background: `linear-gradient(135deg, #1e293b 0%, #334155 100%)`
            }}
            onClick={() => setSelectedDisruption(disruption)}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <h4 style={{ color: getSeverityColor(disruption.severity), margin: 0, fontSize: '20px', fontWeight: '700' }}>
                {disruption.title}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '8px' }}>
                <span style={{
                  fontSize: '11px',
                  color: getSeverityColor(disruption.severity),
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  backgroundColor: `${getSeverityColor(disruption.severity)}25`,
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: `1px solid ${getSeverityColor(disruption.severity)}50`
                }}>
                  {disruption.severity}
                </span>
                {disruption.economicImpact && (
                  <span style={{
                    fontSize: '12px',
                    color: '#10b981',
                    fontWeight: '600',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    padding: '4px 8px',
                    borderRadius: '12px'
                  }}>
                    ${disruption.economicImpact}M
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <p style={{ color: '#d1d5db', margin: '0 0 20px 0', lineHeight: '1.6', fontSize: '15px' }}>
              {disruption.description}
            </p>

            {/* Impact Metrics */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '12px', 
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              borderRadius: '12px'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>IMPACT</div>
                <div style={{ fontSize: '14px', color: '#f1f5f9', fontWeight: '500', marginTop: '4px' }}>{disruption.impact}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>VESSELS</div>
                <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: '700', marginTop: '4px' }}>{disruption.affectedVessels}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>STATUS</div>
                <div style={{ fontSize: '14px', color: '#3b82f6', fontWeight: '500', marginTop: '4px' }}>{disruption.status}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>REGION</div>
                <div style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: '500', marginTop: '4px' }}>{disruption.region}</div>
              </div>
            </div>

            {/* News Sources */}
            {disruption.sources && disruption.sources.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  NEWS SOURCES
                  <span style={{ 
                    backgroundColor: 'rgba(59, 130, 246, 0.2)', 
                    color: '#93c5fd', 
                    padding: '2px 6px', 
                    borderRadius: '8px', 
                    fontSize: '10px' 
                  }}>
                    {disruption.sources.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {disruption.sources.slice(0, 2).map((source, index) => (
                    <a
                      key={index}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block',
                        padding: '10px 12px',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '500', lineHeight: '1.4' }}>
                            {source.title}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                            {source.outlet} • {source.date.toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#60a5fa' }}>↗</div>
                      </div>
                    </a>
                  ))}
                  {disruption.sources.length > 2 && (
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#64748b', 
                      textAlign: 'center', 
                      fontStyle: 'italic' 
                    }}>
                      +{disruption.sources.length - 2} more sources available
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Key Vessels Table */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
        <h3 style={{ color: '#60a5fa', margin: '0 0 20px 0', fontSize: '20px' }}>Key Vessel Tracking</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #475569' }}>
                <th style={{ textAlign: 'left', padding: '12px', color: '#e2e8f0', fontWeight: '600' }}>Vessel</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#e2e8f0', fontWeight: '600' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#e2e8f0', fontWeight: '600' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#e2e8f0', fontWeight: '600' }}>Destination</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#e2e8f0', fontWeight: '600' }}>Position</th>
              </tr>
            </thead>
            <tbody>
              {aisVessels.map((vessel) => (
                <tr key={vessel.id} style={{ borderBottom: '1px solid #374151' }}>
                  <td style={{ padding: '12px', color: '#f1f5f9', fontWeight: '500' }}>{vessel.name}</td>
                  <td style={{ padding: '12px', color: '#94a3b8' }}>{vessel.type}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      color: getVesselStatusColor(vessel.status),
                      fontWeight: '600'
                    }}>
                      {vessel.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#94a3b8' }}>{vessel.destination}</td>
                  <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>
                    {vessel.coordinates.lat.toFixed(2)}°, {vessel.coordinates.lng.toFixed(2)}°
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `
      }} />
    </div>
  );
}

function getCurrentPage(url) {
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  let urlLastPart = url.split('/').pop();
  if (urlLastPart.includes('?')) {
    urlLastPart = urlLastPart.split('?')[0];
  }
  return urlLastPart || 'dashboard';
}

function PagesContent() {
  const location = useLocation();
  const currentPage = getCurrentPage(location.pathname);
  
  console.log("Current location:", location.pathname);
  console.log("Current page:", currentPage);
  
  return (
    <SafeComponent componentName="Layout">
      <Layout currentPageName={currentPage}>
        <Routes>
          <Route 
            path="/" 
            element={
              <SafeComponent componentName="Dashboard" fallback={<div style={{padding: '20px', color: 'white'}}>Loading Dashboard...</div>}>
                <Dashboard />
              </SafeComponent>
            } 
          />
          <Route 
            path="/Dashboard" 
            element={
              <SafeComponent componentName="Dashboard" fallback={<div style={{padding: '20px', color: 'white'}}>Loading Dashboard...</div>}>
                <Dashboard />
              </SafeComponent>
            } 
          />
          <Route 
            path="/Disruptions" 
            element={
              <SafeComponent componentName="Disruptions">
                <Disruptions />
              </SafeComponent>
            } 
          />
          <Route 
            path="/Analytics" 
            element={
              <SafeComponent componentName="Analytics">
                <Analytics />
              </SafeComponent>
            } 
          />
          <Route 
            path="/LiveAIS" 
            element={
              <SafeComponent componentName="LiveAIS">
                <LiveAIS />
              </SafeComponent>
            } 
          />
          <Route 
            path="/ImpactedPorts" 
            element={
              <SafeComponent componentName="ImpactedPorts">
                <ImpactedPorts />
              </SafeComponent>
            } 
          />
          <Route 
            path="*" 
            element={
              <div style={{ padding: '20px', color: 'white' }}>
                <h2>Page Not Found</h2>
                <p>Current path: {location.pathname}</p>
              </div>
            } 
          />
        </Routes>
      </Layout>
    </SafeComponent>
  );
}

export default function SafePages() {
  return (
    <Router>
      <PagesContent />
    </Router>
  );
}
