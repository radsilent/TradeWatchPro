import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Mock report data generators
const generateTradeVolumeReport = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map(month => ({
    month,
    volume: Math.floor(Math.random() * 500000) + 800000,
    value: Math.floor(Math.random() * 40000000) + 60000000,
    containers: Math.floor(Math.random() * 50000) + 80000,
    growth: (Math.random() - 0.5) * 20
  }));
};

const generateRoutePerformance = () => [
  { route: 'Asia-Europe', volume: 2450000, revenue: 1200000000, efficiency: 94.2, avgDelay: 2.1, vessels: 145 },
  { route: 'Trans-Pacific', volume: 1890000, revenue: 950000000, efficiency: 91.8, avgDelay: 1.8, vessels: 112 },
  { route: 'Asia-Americas', volume: 1560000, revenue: 780000000, efficiency: 89.5, avgDelay: 2.4, vessels: 98 },
  { route: 'Europe-Americas', volume: 980000, revenue: 490000000, efficiency: 96.1, avgDelay: 1.2, vessels: 67 },
  { route: 'Intra-Asia', volume: 3200000, revenue: 800000000, efficiency: 93.7, avgDelay: 1.5, vessels: 203 },
  { route: 'Middle East-Asia', volume: 750000, revenue: 375000000, efficiency: 88.9, avgDelay: 2.8, vessels: 45 }
];

const generatePortPerformance = () => [
  { port: 'Shanghai', throughput: 47030000, efficiency: 94.2, revenue: 2400000000, growth: 5.8 },
  { port: 'Singapore', throughput: 37200000, revenue: 1860000000, efficiency: 97.1, growth: 3.2 },
  { port: 'Ningbo-Zhoushan', throughput: 31080000, revenue: 1554000000, efficiency: 92.8, growth: 7.1 },
  { port: 'Shenzhen', throughput: 28770000, revenue: 1438500000, efficiency: 91.5, growth: 4.6 },
  { port: 'Guangzhou', throughput: 25230000, revenue: 1261500000, efficiency: 89.9, growth: 6.3 },
  { port: 'Busan', throughput: 22990000, revenue: 1149500000, efficiency: 93.4, growth: 2.8 },
  { port: 'Hong Kong', throughput: 18100000, revenue: 905000000, efficiency: 95.7, growth: -1.2 },
  { port: 'Los Angeles', throughput: 10677000, revenue: 533850000, efficiency: 87.3, growth: 8.9 }
];

const generateCargoTypes = () => [
  { type: 'Containers', value: 45, color: '#3b82f6', volume: 12500000 },
  { type: 'Bulk Cargo', value: 28, color: '#10b981', volume: 7800000 },
  { type: 'Oil & Gas', value: 15, color: '#f59e0b', volume: 4200000 },
  { type: 'Automotive', value: 8, color: '#ef4444', volume: 2200000 },
  { type: 'Other', value: 4, color: '#6b7280', volume: 1100000 }
];

const generateKPIData = () => ({
  totalRevenue: 8750000000,
  revenueGrowth: 12.3,
  totalVolume: 27800000,
  volumeGrowth: 8.7,
  avgEfficiency: 92.4,
  efficiencyChange: 2.1,
  onTimeDelivery: 94.8,
  deliveryChange: 1.5,
  customerSatisfaction: 4.7,
  satisfactionChange: 0.3,
  fuelEfficiency: 87.2,
  fuelChange: -3.2
});

const generateRecentReports = () => [
  {
    id: 'RPT-001',
    title: 'Q3 2024 Trade Volume Analysis',
    type: 'Quarterly Report',
    date: new Date('2024-08-20'),
    status: 'Completed',
    size: '2.4 MB',
    format: 'PDF'
  },
  {
    id: 'RPT-002',
    title: 'Port Efficiency Benchmarking',
    type: 'Performance Report',
    date: new Date('2024-08-18'),
    status: 'Completed',
    size: '1.8 MB',
    format: 'Excel'
  },
  {
    id: 'RPT-003',
    title: 'Route Optimization Analysis',
    type: 'Operational Report',
    date: new Date('2024-08-15'),
    status: 'Completed',
    size: '3.1 MB',
    format: 'PDF'
  },
  {
    id: 'RPT-004',
    title: 'Weekly Fleet Performance',
    type: 'Weekly Report',
    date: new Date('2024-08-23'),
    status: 'Generating',
    size: 'Pending',
    format: 'PDF'
  }
];

function Reports() {
  const [tradeData, setTradeData] = useState([]);
  const [routeData, setRouteData] = useState([]);
  const [portData, setPortData] = useState([]);
  const [cargoData, setCargoData] = useState([]);
  const [kpiData, setKpiData] = useState({});
  const [recentReports, setRecentReports] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('12months');
  const [selectedReport, setSelectedReport] = useState('trade-volume');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setTradeData(generateTradeVolumeReport());
      setRouteData(generateRoutePerformance());
      setPortData(generatePortPerformance());
      setCargoData(generateCargoTypes());
      setKpiData(generateKPIData());
      setRecentReports(generateRecentReports());
      setLoading(false);
    }, 1200);
  }, []);

  const handleGenerateReport = (reportType) => {
    // Simulate report generation
    const newReport = {
      id: `RPT-${Date.now()}`,
      title: `${reportType} Report - ${new Date().toLocaleDateString()}`,
      type: 'Custom Report',
      date: new Date(),
      status: 'Generating',
      size: 'Pending',
      format: 'PDF'
    };
    
    setRecentReports(prev => [newReport, ...prev]);
    
    // Simulate completion after 3 seconds
    setTimeout(() => {
      setRecentReports(prev => prev.map(report => 
        report.id === newReport.id 
          ? { ...report, status: 'Completed', size: `${(Math.random() * 3 + 1).toFixed(1)} MB` }
          : report
      ));
    }, 3000);
  };

  const handleDownloadReport = (reportId) => {
    // Simulate download
    alert(`Downloading report ${reportId}...`);
  };

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-3 text-lg">Loading reports data...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
        <div className="flex items-center space-x-4">
          <select 
            value={selectedTimeframe} 
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-background"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="3months">Last 3 Months</option>
            <option value="12months">Last 12 Months</option>
          </select>
          <button 
            onClick={() => handleGenerateReport('Comprehensive')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
            <span className="text-xs text-green-600">+{kpiData.revenueGrowth}%</span>
          </div>
          <p className="text-xl font-bold">${(kpiData.totalRevenue / 1000000000).toFixed(1)}B</p>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
            <span className="text-xs text-green-600">+{kpiData.volumeGrowth}%</span>
          </div>
          <p className="text-xl font-bold">{(kpiData.totalVolume / 1000000).toFixed(1)}M TEU</p>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Avg Efficiency</p>
            <span className="text-xs text-green-600">+{kpiData.efficiencyChange}%</span>
          </div>
          <p className="text-xl font-bold">{kpiData.avgEfficiency}%</p>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">On-Time Delivery</p>
            <span className="text-xs text-green-600">+{kpiData.deliveryChange}%</span>
          </div>
          <p className="text-xl font-bold">{kpiData.onTimeDelivery}%</p>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Customer Rating</p>
            <span className="text-xs text-green-600">+{kpiData.satisfactionChange}</span>
          </div>
          <p className="text-xl font-bold">{kpiData.customerSatisfaction}/5.0</p>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Fuel Efficiency</p>
            <span className="text-xs text-red-600">{kpiData.fuelChange}%</span>
          </div>
          <p className="text-xl font-bold">{kpiData.fuelEfficiency}%</p>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex space-x-4 mb-6 border-b">
          {[
            { id: 'trade-volume', label: 'Trade Volume' },
            { id: 'route-performance', label: 'Route Performance' },
            { id: 'port-analysis', label: 'Port Analysis' },
            { id: 'cargo-breakdown', label: 'Cargo Breakdown' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedReport(tab.id)}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                selectedReport === tab.id 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Trade Volume Report */}
        {selectedReport === 'trade-volume' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Trade Volume Analysis</h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={tradeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'volume' ? `${value.toLocaleString()} TEU` : 
                  name === 'value' ? `$${(value / 1000000).toFixed(1)}M` :
                  `${value.toLocaleString()}`,
                  name === 'volume' ? 'Volume' : name === 'value' ? 'Value' : 'Containers'
                ]} />
                <Legend />
                <Area type="monotone" dataKey="volume" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Volume (TEU)" />
                <Area type="monotone" dataKey="containers" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Containers" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Route Performance Report */}
        {selectedReport === 'route-performance' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Route Performance Analysis</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Route</th>
                    <th className="text-right py-2">Volume (TEU)</th>
                    <th className="text-right py-2">Revenue</th>
                    <th className="text-right py-2">Efficiency</th>
                    <th className="text-right py-2">Avg Delay</th>
                    <th className="text-right py-2">Vessels</th>
                  </tr>
                </thead>
                <tbody>
                  {routeData.map((route, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-3 font-medium">{route.route}</td>
                      <td className="text-right py-3">{route.volume.toLocaleString()}</td>
                      <td className="text-right py-3">${(route.revenue / 1000000).toFixed(0)}M</td>
                      <td className="text-right py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          route.efficiency >= 95 ? 'bg-green-100 text-green-800' :
                          route.efficiency >= 90 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {route.efficiency}%
                        </span>
                      </td>
                      <td className="text-right py-3">{route.avgDelay}h</td>
                      <td className="text-right py-3">{route.vessels}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={routeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="route" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="efficiency" fill="#3b82f6" name="Efficiency %" />
                <Bar dataKey="vessels" fill="#10b981" name="Active Vessels" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Port Analysis Report */}
        {selectedReport === 'port-analysis' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Port Performance Analysis</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Port</th>
                      <th className="text-right py-2">Throughput</th>
                      <th className="text-right py-2">Growth</th>
                      <th className="text-right py-2">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portData.slice(0, 6).map((port, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-2 font-medium">{port.port}</td>
                        <td className="text-right py-2">{(port.throughput / 1000000).toFixed(1)}M</td>
                        <td className="text-right py-2">
                          <span className={`text-xs ${port.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {port.growth >= 0 ? '+' : ''}{port.growth}%
                          </span>
                        </td>
                        <td className="text-right py-2">{port.efficiency}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={portData.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="port" />
                  <YAxis />
                  <Tooltip formatter={(value) => [(value / 1000000).toFixed(1) + 'M TEU', 'Throughput']} />
                  <Bar dataKey="throughput" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Cargo Breakdown Report */}
        {selectedReport === 'cargo-breakdown' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Cargo Type Analysis</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={cargoData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {cargoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-4">
                {cargoData.map((cargo, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: cargo.color }}></div>
                      <span className="font-medium">{cargo.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{cargo.value}%</div>
                      <div className="text-sm text-muted-foreground">{(cargo.volume / 1000000).toFixed(1)}M TEU</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Reports */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Reports</h3>
        <div className="space-y-3">
          {recentReports.map((report) => (
            <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  📊
                </div>
                <div>
                  <h4 className="font-medium">{report.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>{report.type}</span>
                    <span>{report.date.toLocaleDateString()}</span>
                    <span>{report.size}</span>
                    <span>{report.format}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  report.status === 'Completed' ? 'bg-green-100 text-green-800' :
                  report.status === 'Generating' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {report.status}
                </span>
                {report.status === 'Completed' && (
                  <button 
                    onClick={() => handleDownloadReport(report.id)}
                    className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                  >
                    Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Reports;
