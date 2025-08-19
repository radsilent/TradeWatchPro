import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// Simple test components
function SimpleLayout({ children }) {
  return (
    <div style={{ padding: '20px', backgroundColor: '#1e293b', minHeight: '100vh', color: 'white' }}>
      <h1>TradeWatch App</h1>
      <nav style={{ marginBottom: '20px' }}>
        <a href="/" style={{ color: '#60a5fa', marginRight: '15px' }}>Dashboard</a>
        <a href="/disruptions" style={{ color: '#60a5fa', marginRight: '15px' }}>Disruptions</a>
        <a href="/analytics" style={{ color: '#60a5fa', marginRight: '15px' }}>Analytics</a>
      </nav>
      {children}
    </div>
  );
}

function SimpleDashboard() {
  return (
    <div>
      <h2>Maritime Dashboard</h2>
      <p>Global trade monitoring system</p>
      <div style={{ 
        backgroundColor: '#334155', 
        padding: '15px', 
        borderRadius: '8px',
        marginTop: '15px'
      }}>
        <h3>Key Metrics</h3>
        <ul>
          <li>Operational Ports: 150</li>
          <li>Minor Issues: 5</li>
          <li>Major Issues: 2</li>
        </ul>
      </div>
    </div>
  );
}

function SimpleDisruptions() {
  return (
    <div>
      <h2>Disruptions</h2>
      <p>Current maritime disruptions</p>
    </div>
  );
}

function SimpleAnalytics() {
  return (
    <div>
      <h2>Analytics</h2>
      <p>Trade analytics dashboard</p>
    </div>
  );
}

export default function SimplePages() {
  return (
    <Router>
      <SimpleLayout>
        <Routes>
          <Route path="/" element={<SimpleDashboard />} />
          <Route path="/disruptions" element={<SimpleDisruptions />} />
          <Route path="/analytics" element={<SimpleAnalytics />} />
        </Routes>
      </SimpleLayout>
    </Router>
  );
}
