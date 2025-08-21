import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Download, Apple, Play, Globe, Zap, Shield, Bell } from 'lucide-react';
import VectorStreamLogo from '../components/VectorStreamLogo';

export default function MobileAppDownload() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <VectorStreamLogo className="h-16 w-16" textClassName="text-2xl font-bold" />
          </div>
          <h1 className="text-4xl font-bold text-white">TradeWatch Mobile</h1>
          <p className="text-xl text-slate-300">Global Trade Intelligence in Your Pocket</p>
          <Badge className="bg-blue-600 text-white">Coming Soon</Badge>
        </div>

        {/* App Preview */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Take Maritime Intelligence Mobile</h2>
            <p className="text-slate-300 text-lg">
              Monitor global trade disruptions, track vessels, and analyze supply chain impacts 
              from anywhere in the world with the TradeWatch mobile app.
            </p>
            
            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-blue-400" />
                <span className="text-slate-300">Real-time disruption alerts</span>
              </div>
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-blue-400" />
                <span className="text-slate-300">Touch-optimized maritime maps</span>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-blue-400" />
                <span className="text-slate-300">Offline data synchronization</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-blue-400" />
                <span className="text-slate-300">Enterprise-grade security</span>
              </div>
            </div>
          </div>

          {/* Mobile Mockup */}
          <div className="flex justify-center">
            <div className="bg-slate-800 p-4 rounded-3xl border-4 border-slate-700 shadow-2xl">
              <div className="bg-slate-900 rounded-2xl p-6 w-64 h-96 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="text-white text-xs font-medium">TradeWatch</div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex-1 bg-blue-900/20 rounded-lg p-4">
                  <div className="text-blue-400 text-xs mb-2">Global Overview</div>
                  <div className="space-y-2">
                    <div className="h-2 bg-blue-500/30 rounded"></div>
                    <div className="h-2 bg-red-500/30 rounded w-3/4"></div>
                    <div className="h-2 bg-yellow-500/30 rounded w-1/2"></div>
                  </div>
                  <div className="mt-4 text-slate-400 text-xs">
                    Interactive map and real-time alerts optimized for mobile
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Download Options */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Apple className="w-6 h-6" />
                iOS App
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300">Native iOS app with full offline capabilities and Apple Watch integration.</p>
              <button 
                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                disabled
              >
                <Download className="w-5 h-5" />
                Coming to App Store
              </button>
              <p className="text-xs text-slate-500 text-center">Expected: Q2 2025</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Play className="w-6 h-6" />
                Android App
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300">Native Android app with widget support and Android Auto integration.</p>
              <button 
                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                disabled
              >
                <Download className="w-5 h-5" />
                Coming to Play Store
              </button>
              <p className="text-xs text-slate-500 text-center">Expected: Q2 2025</p>
            </CardContent>
          </Card>
        </div>

        {/* Progressive Web App */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Globe className="w-6 h-6" />
              Progressive Web App (PWA)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-300">
              Install TradeWatch as a PWA directly from your browser. Works offline and provides 
              a native app-like experience on any device.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  // This would trigger PWA installation
                  alert('PWA installation will be available when the service worker is implemented');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Install PWA
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg transition-colors"
              >
                Use Web Version
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Development Roadmap */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Mobile App Development Roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <div className="text-white font-medium">Phase 1: PWA Implementation</div>
                  <div className="text-slate-400 text-sm">Service worker, offline caching, installable web app</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <div className="text-white font-medium">Phase 2: React Native Development</div>
                  <div className="text-slate-400 text-sm">Cross-platform mobile app with native features</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div>
                  <div className="text-white font-medium">Phase 3: Platform Optimization</div>
                  <div className="text-slate-400 text-sm">iOS/Android specific features and optimizations</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <div>
                  <div className="text-white font-medium">Phase 4: Enterprise Features</div>
                  <div className="text-slate-400 text-sm">SSO integration, advanced analytics, custom dashboards</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold text-white">Stay Updated</h3>
          <p className="text-slate-300">
            Want to be notified when the mobile app launches? Contact VectorStream Systems.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="mailto:mobile@vectorstream.systems" 
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition-colors"
            >
              Get Updates
            </a>
            <a 
              href="/" 
              className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-6 rounded-lg transition-colors"
            >
              Back to TradeWatch
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
