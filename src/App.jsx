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
import BusinessModel from './pages/BusinessModel'

// Mobile responsive layout component
const Layout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg sm:text-2xl font-bold text-primary">🌊 TradeWatch Pro</h1>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-6">
                <a href="/analytics" className="text-sm font-medium hover:text-primary transition-colors">Analytics</a>
                <a href="/fleet" className="text-sm font-medium hover:text-primary transition-colors">Fleet</a>
                <a href="/alerts" className="text-sm font-medium hover:text-primary transition-colors">Alerts</a>
                <a href="/reports" className="text-sm font-medium hover:text-primary transition-colors">Reports</a>
                <a href="/business" className="text-sm font-medium hover:text-primary transition-colors">Business</a>
                <a href="/pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
              </nav>
            </div>

            <div className="flex items-center space-x-2">
              {/* Live Data Indicator */}
              <div className="hidden sm:flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm text-muted-foreground">Live Data</span>
              </div>
              
              {/* Mobile Menu Button */}
              <button 
                className="md:hidden p-2 rounded-md hover:bg-muted"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t">
              <nav className="flex flex-col space-y-3 pt-4">
                <a href="/analytics" className="text-sm font-medium hover:text-primary transition-colors py-2">📊 Analytics</a>
                <a href="/fleet" className="text-sm font-medium hover:text-primary transition-colors py-2">🚢 Fleet</a>
                <a href="/alerts" className="text-sm font-medium hover:text-primary transition-colors py-2">🚨 Alerts</a>
                <a href="/reports" className="text-sm font-medium hover:text-primary transition-colors py-2">📋 Reports</a>
                <a href="/business" className="text-sm font-medium hover:text-primary transition-colors py-2">💼 Business</a>
                <a href="/pricing" className="text-sm font-medium hover:text-primary transition-colors py-2">💰 Pricing</a>
                <div className="flex items-center space-x-2 py-2 border-t mt-2 pt-4">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-sm text-muted-foreground">Live Data Connected</span>
                </div>
              </nav>
            </div>
          )}
        </div>
      </nav>
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
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
          <Route path="/business" element={<BusinessModel />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App