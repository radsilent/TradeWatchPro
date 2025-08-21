

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Globe, 
  AlertTriangle, 
  BarChart3, 
  Map, 
  Activity, 
  Satellite, 
  Target, 
  Ship, 
  DollarSign, 
  MapPin, 
  Monitor, 
  Brain 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import VectorStreamLogo from "@/components/VectorStreamLogo";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Global Overview",
    url: createPageUrl("Dashboard"),
    icon: Globe,
  },
  {
    title: "Active Disruptions",
    url: createPageUrl("Disruptions"),
    icon: AlertTriangle,
  },
  {
    title: "Vessel Tracking",
    url: createPageUrl("VesselTracking"),
    icon: Ship,
  },
  {
    title: "Tariff Tracking",
    url: createPageUrl("TariffTracking"),
    icon: DollarSign,
  },
  {
    title: "Trade Routes",
    url: createPageUrl("TradeRoutes"),
    icon: MapPin,
  },

  {
    title: "Live AIS Feed",
    url: createPageUrl("LiveAIS"),
    icon: Satellite,
  },
  {
    title: "Live Port View",
    url: createPageUrl("LivePortView"),
    icon: Monitor,
  },
  {
    title: "Analytics", 
    url: createPageUrl("Analytics"),
    icon: BarChart3,
  },
  {
    title: "AI Projections",
    url: createPageUrl("AIProjections"),
    icon: Brain,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  
  // Mobile detection and responsive state
  const [isMobile, setIsMobile] = React.useState(false);
  const [isTablet, setIsTablet] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const isMobileDevice = width < 768;
      const isTabletDevice = width >= 768 && width < 1024;
      
      setIsMobile(isMobileDevice);
      setIsTablet(isTabletDevice);
      
      // Auto-close sidebar on mobile
      if (isMobileDevice) {
        setSidebarOpen(false);
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <SidebarProvider>
      <style>
        {`
          :root {
            --maritime-dark: #0a1628;
            --maritime-blue: #1e3a8a;
            --ocean-blue: #0369a1;
            --alert-red: #dc2626;
            --warning-amber: #d97706;
            --success-emerald: #059669;
            --slate-100: #f1f5f9;
            --slate-200: #e2e8f0;
            --slate-300: #cbd5e1;
            --slate-400: #94a3b8;
            --slate-500: #64748b;
            --slate-600: #475569;
            --slate-700: #334155;
            --slate-800: #1e293b;
            --slate-900: #0f172a;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, var(--maritime-dark) 0%, var(--slate-900) 100%);
            color: var(--slate-100);
          }
          
          /* Responsive Typography */
          @media (max-width: 768px) {
            h1 { font-size: 1.5rem; line-height: 1.4; }
            h2 { font-size: 1.25rem; line-height: 1.4; }
            h3 { font-size: 1.125rem; line-height: 1.4; }
            h4 { font-size: 1rem; line-height: 1.4; }
            p { font-size: 0.875rem; line-height: 1.5; }
            .text-sm { font-size: 0.75rem; }
            .text-xs { font-size: 0.6875rem; }
            
            /* Touch targets */
            button, .clickable { min-height: 44px; min-width: 44px; }
            input, select, textarea { min-height: 44px; font-size: 16px; } /* Prevent zoom on iOS */
          }
          
          /* Better touch scrolling */
          * {
            -webkit-overflow-scrolling: touch;
          }
          
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          .maritime-gradient {
            background: linear-gradient(135deg, var(--maritime-blue) 0%, var(--ocean-blue) 100%);
          }
        `}
      </style>
      
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-[9998] bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={toggleSidebar}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <VectorStreamLogo className="h-5 w-5" textClassName="text-xs font-bold" />
              <span className="text-white font-semibold text-sm">TradeWatch</span>
            </div>
            <div className="w-10" /> {/* Spacer for balance */}
          </div>
        </div>
      )}
      
      <div className={`min-h-screen flex w-full bg-slate-900 ${isMobile ? 'pt-16' : ''}`}>
        {/* Mobile Sidebar Overlay */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-[9997]" 
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <Sidebar className={`border-r border-slate-700/50 bg-slate-900/95 backdrop-blur-sm transition-transform duration-300 ${
          isMobile 
            ? `fixed left-0 top-16 bottom-0 z-[9999] w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : 'fixed left-0 top-0 bottom-0 w-64 z-[1000]'
        }`}>
          <SidebarHeader className="border-b border-slate-700/50 p-6">
            <div className="flex flex-col gap-4">
              <VectorStreamLogo 
                className="h-6 w-6" 
                textClassName="text-sm font-bold"
              />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 maritime-gradient rounded-xl flex items-center justify-center shadow-lg">
                  <Map className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-100 text-lg tracking-tight">TradeWatch</h2>
                  <p className="text-xs text-slate-400 tracking-wide">Global Trade Intelligence Platform</p>
                </div>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-3">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-slate-800/60 hover:text-slate-100 transition-all duration-200 rounded-lg mb-2 group ${
                          location.pathname === item.url ? 'bg-slate-800/80 text-slate-100 shadow-sm' : 'text-slate-300'
                        } ${item.title === 'Live AIS Feed' ? 'opacity-60' : ''}`}
                      >
                        <Link 
                          to={item.url} 
                          className="flex items-center gap-3 px-4 py-3"
                          onClick={() => {
                            if (isMobile) {
                              setSidebarOpen(false);
                            }
                          }}
                        >
                          <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                          <span className="font-medium tracking-tight">{item.title}</span>
                          {item.title === 'Live AIS Feed' && <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300">Soon</Badge>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-8">
              <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-3">
                System Status
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-4 py-3 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-slate-300">Data Feed</span>
                    </div>
                    <span className="text-xs text-emerald-400 font-medium">Live</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-300">Monitoring</span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">142 ports</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-sm text-slate-300">Active Alerts</span>
                    </div>
                    <span className="text-xs text-amber-400 font-medium">7</span>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
            
            {/* Copyright Notice */}
            <div className="mt-auto p-4 border-t border-slate-700/30">
              <div className="text-center space-y-1">
                <p className="text-xs text-slate-500">© 2025 VectorStream Systems</p>
                <p className="text-xs text-slate-600">Patent Pending</p>
                <p className="text-xs text-slate-600">All Rights Reserved</p>
              </div>
            </div>
          </SidebarContent>
        </Sidebar>

        <main className={`flex-1 flex flex-col min-h-screen ${isMobile ? '' : 'ml-64'}`}>
          <div className={`flex-1 bg-slate-900 ${isMobile ? 'px-3 py-2 pb-20' : 'px-6 py-4'}`}>
            {children}
          </div>
          
          {/* Main Footer with Copyright */}
          {!isMobile && (
            <footer className="bg-slate-900/80 border-t border-slate-700/30 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <VectorStreamLogo className="h-4 w-4" />
                <span className={`text-slate-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {isMobile ? 'TradeWatch' : 'TradeWatch - Global Trade Intelligence Platform'}
                </span>
              </div>
              <div className="flex items-center gap-6 text-xs text-slate-500">
                <span>© 2025 VectorStream Systems</span>
                <span className="text-slate-600">Patent Pending</span>
                <span className="text-slate-600">All Rights Reserved</span>
              </div>
            </div>
          </footer>
          )}
        </main>
        
        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50 z-[9998]">
            {/* Mobile App Download Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 text-center">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-medium">Get the TradeWatch mobile app</span>
                </div>
                <button 
                  onClick={() => window.open('/mobile-app-download', '_blank')}
                  className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs font-medium transition-colors"
                >
                  Download
                </button>
              </div>
            </div>
            
            <div className="flex justify-around items-center py-2">
              {navigationItems.slice(0, 5).map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                    location.pathname === item.url 
                      ? 'text-blue-400 bg-slate-800/60' 
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.title.split(' ')[0]}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </SidebarProvider>
  );
}

