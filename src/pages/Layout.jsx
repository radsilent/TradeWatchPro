

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Globe, AlertTriangle, BarChart3, Map, Activity, Satellite, Target, Ship, DollarSign, MapPin } from "lucide-react";
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
    title: "Impact Analysis",
    url: createPageUrl("ImpactedPorts"),
    icon: Target,
  },
  {
    title: "Live AIS Feed",
    url: createPageUrl("LiveAIS"),
    icon: Satellite,
  },
  {
    title: "Analytics",
    url: createPageUrl("Analytics"),
    icon: BarChart3,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

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
      <div className="min-h-screen flex w-full bg-slate-900">
        <Sidebar className="border-r border-slate-700/50 bg-slate-900/95 backdrop-blur-sm">
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
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
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

        <main className="flex-1 flex flex-col min-h-screen">
          <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700/50 px-6 py-4 lg:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-800 p-2 rounded-lg transition-colors duration-200" />
              <VectorStreamLogo className="h-6 w-6" textClassName="text-lg font-bold" />
            </div>
          </header>

          <div className="flex-1 bg-slate-900">
            {children}
          </div>
          
          {/* Main Footer with Copyright */}
          <footer className="bg-slate-900/80 border-t border-slate-700/30 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <VectorStreamLogo className="h-4 w-4" />
                <span className="text-sm text-slate-400">TradeWatch - Global Trade Intelligence Platform</span>
              </div>
              <div className="flex items-center gap-6 text-xs text-slate-500">
                <span>© 2025 VectorStream Systems</span>
                <span className="text-slate-600">Patent Pending</span>
                <span className="text-slate-600">All Rights Reserved</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </SidebarProvider>
  );
}

