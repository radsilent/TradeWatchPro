import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'

// Import pages
import Analytics from './pages/Analytics'
import FleetManagement from './pages/FleetManagement'
import Alerts from './pages/Alerts'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Pricing from './pages/Pricing'

// Basic layout component
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-primary">🌊 TradeWatch Pro</h1>
              <nav className="hidden md:flex space-x-6">
                <a href="/analytics" className="text-sm font-medium hover:text-primary">Analytics</a>
                <a href="/fleet" className="text-sm font-medium hover:text-primary">Fleet</a>
                <a href="/alerts" className="text-sm font-medium hover:text-primary">Alerts</a>
                <a href="/reports" className="text-sm font-medium hover:text-primary">Reports</a>
                <a href="/settings" className="text-sm font-medium hover:text-primary">Settings</a>
                <a href="/pricing" className="text-sm font-medium hover:text-primary">Pricing</a>
              </nav>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm text-muted-foreground">Live Data</span>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/analytics" replace />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/fleet" element={<FleetManagement />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/pricing" element={<Pricing />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App