import React from "react";
import { Link, useLocation } from "react-router-dom";

const navigationItems = [
  { title: "Global Overview", url: "/Dashboard", icon: "GLOBE" },
  { title: "Active Disruptions", url: "/Disruptions", icon: "WARN" },
  { title: "Analytics", url: "/Analytics", icon: "CHART" },
  { title: "Live AIS", url: "/LiveAIS", icon: "TRACK" },
  { title: "Impacted Ports", url: "/ImpactedPorts", icon: "PORT" },
];

export default function SimpleLayout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      backgroundColor: '#0f172a',
      color: 'white'
    }}>
      {/* Sidebar */}
      <div style={{ 
        width: '250px', 
        backgroundColor: '#1e293b', 
        padding: '20px',
        borderRight: '1px solid #334155'
      }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#60a5fa',
            margin: '0 0 5px 0'
          }}>
            TradeWatch
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: '#94a3b8',
            margin: 0
          }}>
            Global Trade Intelligence
          </p>
        </div>

        <nav>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.url || 
                              (location.pathname === '/' && item.url === '/Dashboard');
              
              return (
                <li key={item.title} style={{ marginBottom: '8px' }}>
                  <Link
                    to={item.url}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: isActive ? '#1e293b' : '#e2e8f0',
                      backgroundColor: isActive ? '#60a5fa' : 'transparent',
                      transition: 'all 0.2s',
                      fontSize: '14px',
                      fontWeight: isActive ? '600' : '400'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.target.style.backgroundColor = '#334155';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ marginRight: '12px', fontSize: '16px' }}>
                      {item.icon}
                    </span>
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Status indicator */}
        <div style={{ 
          marginTop: '40px', 
          padding: '16px', 
          backgroundColor: '#0f766e', 
          borderRadius: '8px',
          fontSize: '12px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '8px' 
          }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              backgroundColor: '#10b981', 
              borderRadius: '50%', 
              marginRight: '8px' 
            }}></div>
            System Operational
          </div>
          <div style={{ color: '#94a3b8' }}>
            All maritime data feeds active
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        backgroundColor: '#0f172a'
      }}>
        {/* Header */}
        <header style={{ 
          padding: '20px 30px', 
          borderBottom: '1px solid #334155',
          backgroundColor: '#1e293b'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: '28px', 
              fontWeight: '700',
              color: '#f1f5f9'
            }}>
              {currentPageName || 'Dashboard'}
            </h2>
            <div style={{ 
              fontSize: '14px', 
              color: '#94a3b8' 
            }}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ padding: '30px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
