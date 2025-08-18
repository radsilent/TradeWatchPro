import React from "react";
import { Satellite, Map, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LiveAISPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
      <div className="max-w-3xl mx-auto">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-3xl opacity-20"></div>
          <div className="relative w-24 h-24 mx-auto bg-slate-800/50 border border-slate-700 rounded-full flex items-center justify-center">
            <Satellite className="w-12 h-12 text-blue-400" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-slate-100 mb-4 tracking-tight">
          Live Satellite AIS Feed
        </h1>
        <p className="text-2xl font-semibold text-blue-400 mb-6">
          Coming Soon
        </p>

        <p className="text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          This interface will provide a real-time stream of global vessel movements, powered by satellite AIS data. We are finalizing the integration with our satellite data partners to bring you unparalleled maritime intelligence.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <FeatureCard
            icon={Map}
            title="Global Vessel Tracking"
            description="Monitor real-time positions, speeds, and routes of vessels worldwide."
          />
          <FeatureCard
            icon={ShieldCheck}
            title="Dark Shipping Detection"
            description="Identify vessels attempting to hide their location or spoof their identity."
          />
          <FeatureCard
            icon={Zap}
            title="Anomaly Alerts"
            description="Receive instant alerts for unusual vessel behavior, such as route deviations or unexpected stops."
          />
        </div>

        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
          Notify Me When It's Ready
        </Button>
      </div>
    </div>
  );
}

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-slate-800/30 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 text-left">
    <Icon className="w-8 h-8 text-blue-400 mb-3" />
    <h3 className="font-semibold text-slate-200 mb-2">{title}</h3>
    <p className="text-slate-400 text-sm">{description}</p>
  </div>
);