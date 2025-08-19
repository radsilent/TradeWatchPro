import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, Activity } from "lucide-react";

export default function MetricsPanel({ ports = [], disruptions = [], isLoading = false }) {
  // Calculate status counts from ports data
  const statusCounts = ports.reduce((acc, port) => {
    const status = port.status || 'operational';
    if (status === 'operational') acc.normal = (acc.normal || 0) + 1;
    else if (status === 'minor_disruption') acc.minor_disruption = (acc.minor_disruption || 0) + 1;
    else if (status === 'major_disruption') acc.major_disruption = (acc.major_disruption || 0) + 1;
    else if (status === 'closed') acc.closed = (acc.closed || 0) + 1;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-800/50 rounded-xl p-4 min-w-20 animate-pulse">
            <div className="w-5 h-5 bg-slate-700 rounded mx-auto mb-2"></div>
            <div className="w-8 h-6 bg-slate-700 rounded mx-auto mb-1"></div>
            <div className="w-12 h-3 bg-slate-700 rounded mx-auto"></div>
          </div>
        ))}
      </div>
    );
  }
  const metrics = [
    {
      label: 'Operational',
      value: statusCounts.normal || 0,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10'
    },
    {
      label: 'Minor Issues',
      value: statusCounts.minor_disruption || 0,
      icon: Activity,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10'
    },
    {
      label: 'Major Issues',
      value: statusCounts.major_disruption || 0,
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10'
    },
    {
      label: 'Closed',
      value: statusCounts.closed || 0,
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-600/10'
    }
  ];

  return (
    <div className="flex gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div key={metric.label} className={`${metric.bgColor} rounded-xl p-4 min-w-20`}>
            <div className="flex items-center justify-center mb-2">
              <Icon className={`w-5 h-5 ${metric.color}`} />
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
              <div className="text-xs text-slate-400 mt-1">{metric.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}