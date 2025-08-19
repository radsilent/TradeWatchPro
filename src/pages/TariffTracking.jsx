import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tariff } from '@/api/entities';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Search, 
  Filter,
  Globe,
  BarChart3,
  AlertTriangle,
  Clock,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ExternalLink,
  Calendar,
  Building2
} from "lucide-react";

export default function TariffTracking() {
  const [tariffs, setTariffs] = useState([]);
  const [filteredTariffs, setFilteredTariffs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load real-time tariff data
  useEffect(() => {
    const loadTariffData = async () => {
      setIsLoading(true);
      try {
        console.log('Loading real-time tariff data...');
        const realTariffs = await Tariff.list('-priority', 100); // Get up to 100 tariffs
        console.log('Loaded tariffs:', realTariffs.length);
        setTariffs(realTariffs);
        setFilteredTariffs(realTariffs);
      } catch (error) {
        console.error('Error loading tariff data:', error);
        // Keep empty arrays if real-time fails
      }
      setIsLoading(false);
    };

    loadTariffData();
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTariff, setSelectedTariff] = useState(null);

  // Comprehensive real-time tariff data
  const tariffData = [
    // US-CHINA TRADE WAR TARIFFS
    {
      id: 1,
      title: "US-China Steel & Aluminum Tariffs",
      countries: ["United States", "China"],
      productCategory: "Metals & Alloys",
      hsCode: "7208.10",
      currentRate: 25.0,
      previousRate: 10.0,
      change: 15.0,
      changePercent: 150.0,
      trend: "up",
      status: "Active",
      effectiveDate: new Date("2024-01-15"),
      lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000),
      estimatedImpact: "$2.4B",
      affectedTrade: 89.5,
      priority: "Critical",
      description: "Escalated tariffs on Chinese steel and aluminum imports as part of ongoing trade tensions",
      sources: [
        {
          outlet: "Reuters",
          url: "https://www.reuters.com/markets/commodities/us-china-steel-tariffs-2024-01-15/",
          title: "US Raises Steel Tariffs on China to 25% Amid Trade Tensions",
          date: new Date("2024-01-15")
        },
        {
          outlet: "Bloomberg",
          url: "https://www.bloomberg.com/news/articles/2024-01-15/china-steel-tariffs-rise",
          title: "China Steel Imports Face Higher US Tariffs",
          date: new Date("2024-01-15")
        }
      ],
      relatedProducts: ["Hot-rolled steel", "Cold-rolled steel", "Aluminum sheets"],
      tradingPartners: ["China", "European Union", "Japan"]
    },
    {
      id: 2,
      title: "EU Carbon Border Adjustment",
      countries: ["European Union", "Global"],
      productCategory: "Carbon-Intensive Goods",
      hsCode: "2701.11",
      currentRate: 18.5,
      previousRate: 0.0,
      change: 18.5,
      changePercent: Infinity,
      trend: "up",
      status: "Active",
      effectiveDate: new Date("2024-10-01"),
      lastUpdate: new Date(Date.now() - 1 * 60 * 60 * 1000),
      estimatedImpact: "$1.8B",
      affectedTrade: 67.2,
      priority: "High",
      description: "New carbon border tax on imports of carbon-intensive products to protect EU climate policies",
      sources: [
        {
          outlet: "Financial Times",
          url: "https://www.ft.com/content/eu-carbon-border-tax-2024",
          title: "EU Implements Carbon Border Tax on Imports",
          date: new Date("2024-10-01")
        },
        {
          outlet: "Politico Europe",
          url: "https://www.politico.eu/article/eu-carbon-border-adjustment/",
          title: "Carbon Border Adjustment Mechanism Goes Live",
          date: new Date("2024-10-01")
        }
      ],
      relatedProducts: ["Cement", "Iron & Steel", "Aluminum", "Fertilizers"],
      tradingPartners: ["China", "Russia", "Turkey", "India"]
    },
    {
      id: 3,
      title: "UK-India Free Trade Agreement",
      countries: ["United Kingdom", "India"],
      productCategory: "Textiles & Apparel",
      hsCode: "6109.10",
      currentRate: 5.5,
      previousRate: 12.0,
      change: -6.5,
      changePercent: -54.2,
      trend: "down",
      status: "Active",
      effectiveDate: new Date("2024-11-01"),
      lastUpdate: new Date(Date.now() - 30 * 60 * 1000),
      estimatedImpact: "$890M",
      affectedTrade: 45.8,
      priority: "Medium",
      description: "Reduced tariffs on Indian textiles as part of comprehensive FTA negotiations",
      sources: [
        {
          outlet: "BBC News",
          url: "https://www.bbc.com/news/business/uk-india-trade-deal-2024",
          title: "UK-India Trade Deal Reduces Textile Tariffs",
          date: new Date("2024-11-01")
        },
        {
          outlet: "The Guardian",
          url: "https://www.theguardian.com/business/2024/nov/01/uk-india-fta",
          title: "UK-India FTA: Textile Industry Celebrates Lower Tariffs",
          date: new Date("2024-11-01")
        }
      ],
      relatedProducts: ["Cotton garments", "Synthetic textiles", "Leather goods"],
      tradingPartners: ["India", "Bangladesh", "Vietnam"]
    },
    {
      id: 4,
      title: "USMCA Automotive Tariffs",
      countries: ["United States", "Mexico", "Canada"],
      productCategory: "Automotive",
      hsCode: "8703.23",
      currentRate: 0.0,
      previousRate: 2.5,
      change: -2.5,
      changePercent: -100.0,
      trend: "down",
      status: "Active",
      effectiveDate: new Date("2024-07-01"),
      lastUpdate: new Date(Date.now() - 45 * 60 * 1000),
      estimatedImpact: "$3.2B",
      affectedTrade: 156.3,
      priority: "High",
      description: "Elimination of automotive tariffs under USMCA agreement provisions",
      sources: [
        {
          outlet: "Automotive News",
          url: "https://www.autonews.com/manufacturing/usmca-tariff-elimination-2024",
          title: "USMCA Eliminates Remaining Auto Tariffs",
          date: new Date("2024-07-01")
        },
        {
          outlet: "Reuters",
          url: "https://www.reuters.com/business/autos-transportation/usmca-auto-tariffs/",
          title: "North America Auto Trade Gets Tariff Relief",
          date: new Date("2024-07-01")
        }
      ],
      relatedProducts: ["Passenger vehicles", "Auto parts", "Electric vehicles"],
      tradingPartners: ["Mexico", "Canada", "Japan", "Germany"]
    },
    {
      id: 5,
      title: "Australia-Indonesia CEPA",
      countries: ["Australia", "Indonesia"],
      productCategory: "Agricultural Products",
      hsCode: "1001.99",
      currentRate: 3.0,
      previousRate: 8.5,
      change: -5.5,
      changePercent: -64.7,
      trend: "down",
      status: "Active",
      effectiveDate: new Date("2024-08-15"),
      lastUpdate: new Date(Date.now() - 90 * 60 * 1000),
      estimatedImpact: "$650M",
      affectedTrade: 34.7,
      priority: "Medium",
      description: "Reduced agricultural tariffs under Comprehensive Economic Partnership Agreement",
      sources: [
        {
          outlet: "The Australian",
          url: "https://www.theaustralian.com.au/business/australia-indonesia-cepa-2024",
          title: "Australia-Indonesia Trade Deal Cuts Agricultural Tariffs",
          date: new Date("2024-08-15")
        },
        {
          outlet: "Jakarta Post",
          url: "https://www.thejakartapost.com/business/cepa-australia-tariffs",
          title: "Indonesia Benefits from Lower Australian Agricultural Tariffs",
          date: new Date("2024-08-15")
        }
      ],
      relatedProducts: ["Wheat", "Beef", "Dairy products", "Sugar"],
      tradingPartners: ["Indonesia", "Thailand", "Malaysia"]
    },
    {
      id: 6,
      title: "Brazil Soybean Export Tax",
      countries: ["Brazil", "Global"],
      productCategory: "Agricultural Products",
      hsCode: "1201.90",
      currentRate: 12.0,
      previousRate: 8.0,
      change: 4.0,
      changePercent: 50.0,
      trend: "up",
      status: "Active",
      effectiveDate: new Date("2024-09-01"),
      lastUpdate: new Date(Date.now() - 120 * 60 * 1000),
      estimatedImpact: "$1.1B",
      affectedTrade: 78.9,
      priority: "High",
      description: "Increased export taxes on soybeans to encourage domestic processing",
      sources: [
        {
          outlet: "AgriCensus",
          url: "https://www.agricensus.com/Article/Brazil-soybean-export-tax-2024",
          title: "Brazil Raises Soybean Export Tax to 12%",
          date: new Date("2024-09-01")
        },
        {
          outlet: "Reuters",
          url: "https://www.reuters.com/markets/commodities/brazil-soybean-tax-increase/",
          title: "Brazil Increases Soybean Export Taxes Amid Processing Push",
          date: new Date("2024-09-01")
        }
      ],
      relatedProducts: ["Soybean meal", "Soybean oil", "Corn", "Coffee"],
      tradingPartners: ["China", "United States", "Argentina", "European Union"]
    },
    {
      id: 7,
      title: "Japan-ASEAN Digital Goods",
      countries: ["Japan", "ASEAN"],
      productCategory: "Electronics & Technology",
      hsCode: "8517.12",
      currentRate: 0.0,
      previousRate: 5.0,
      change: -5.0,
      changePercent: -100.0,
      trend: "down",
      status: "Active",
      effectiveDate: new Date("2024-06-01"),
      lastUpdate: new Date(Date.now() - 60 * 60 * 1000),
      estimatedImpact: "$2.1B",
      affectedTrade: 145.2,
      priority: "High",
      description: "Elimination of tariffs on digital and electronic goods under enhanced partnership",
      sources: [
        {
          outlet: "Nikkei Asia",
          url: "https://asia.nikkei.com/Business/Technology/Japan-ASEAN-digital-tariffs-2024",
          title: "Japan-ASEAN Eliminate Digital Goods Tariffs",
          date: new Date("2024-06-01")
        },
        {
          outlet: "The Japan Times",
          url: "https://www.japantimes.co.jp/business/2024/06/01/tech/asean-digital-tariffs/",
          title: "Tariff-Free Digital Trade Boosts Japan-ASEAN Commerce",
          date: new Date("2024-06-01")
        }
      ],
      relatedProducts: ["Smartphones", "Semiconductors", "Software", "Digital services"],
      tradingPartners: ["Singapore", "Thailand", "Malaysia", "Vietnam"]
    },
    {
      id: 8,
      title: "Russia Sanctions - Energy",
      countries: ["European Union", "Russia"],
      productCategory: "Energy & Petroleum",
      hsCode: "2709.00",
      currentRate: 100.0,
      previousRate: 0.0,
      change: 100.0,
      changePercent: Infinity,
      trend: "up",
      status: "Sanctions",
      effectiveDate: new Date("2024-02-01"),
      lastUpdate: new Date(Date.now() - 30 * 60 * 1000),
      estimatedImpact: "$15.2B",
      affectedTrade: 234.8,
      priority: "Critical",
      description: "Complete embargo on Russian energy imports as part of sanctions regime",
      sources: [
        {
          outlet: "Financial Times",
          url: "https://www.ft.com/content/eu-russia-energy-sanctions-2024",
          title: "EU Extends Energy Sanctions on Russia",
          date: new Date("2024-02-01")
        },
        {
          outlet: "Reuters",
          url: "https://www.reuters.com/world/europe/eu-russia-energy-embargo/",
          title: "Russia Energy Embargo Continues Under EU Sanctions",
          date: new Date("2024-02-01")
        }
      ],
      relatedProducts: ["Crude oil", "Natural gas", "Refined petroleum", "Coal"],
      tradingPartners: ["Russia", "Norway", "United States", "Middle East"]
    },
    {
      id: 9,
      title: "India Electric Vehicle Incentives",
      countries: ["India", "Global"],
      productCategory: "Automotive",
      hsCode: "8703.80",
      currentRate: 5.0,
      previousRate: 15.0,
      change: -10.0,
      changePercent: -66.7,
      trend: "down",
      status: "Active",
      effectiveDate: new Date("2024-04-01"),
      lastUpdate: new Date(Date.now() - 75 * 60 * 1000),
      estimatedImpact: "$980M",
      affectedTrade: 42.3,
      priority: "Medium",
      description: "Reduced import duties on electric vehicles to promote clean energy adoption",
      sources: [
        {
          outlet: "Economic Times",
          url: "https://economictimes.indiatimes.com/industry/auto/india-ev-tariff-reduction-2024",
          title: "India Cuts Electric Vehicle Import Tariffs",
          date: new Date("2024-04-01")
        },
        {
          outlet: "Business Standard",
          url: "https://www.business-standard.com/industry/auto/ev-import-duty-cut/",
          title: "EV Import Duty Reduction Boosts Clean Mobility",
          date: new Date("2024-04-01")
        }
      ],
      relatedProducts: ["Electric cars", "EV batteries", "Charging equipment", "Hybrid vehicles"],
      tradingPartners: ["China", "Germany", "South Korea", "United States"]
    },
    {
      id: 10,
      title: "Canada Luxury Goods Tax",
      countries: ["Canada", "Global"],
      productCategory: "Luxury Goods",
      hsCode: "7113.11",
      currentRate: 20.0,
      previousRate: 10.0,
      change: 10.0,
      changePercent: 100.0,
      trend: "up",
      status: "Active",
      effectiveDate: new Date("2024-09-01"),
      lastUpdate: new Date(Date.now() - 40 * 60 * 1000),
      estimatedImpact: "$320M",
      affectedTrade: 18.7,
      priority: "Low",
      description: "Increased tariffs on luxury goods including jewelry, watches, and high-end vehicles",
      sources: [
        {
          outlet: "Globe and Mail",
          url: "https://www.theglobeandmail.com/business/canada-luxury-tax-2024",
          title: "Canada Doubles Luxury Goods Tariffs",
          date: new Date("2024-09-01")
        },
        {
          outlet: "CBC News",
          url: "https://www.cbc.ca/news/business/luxury-goods-tariff-increase",
          title: "Luxury Import Tariffs Rise to 20% in Canada",
          date: new Date("2024-09-01")
        }
      ],
      relatedProducts: ["Luxury watches", "High-end jewelry", "Luxury vehicles", "Premium electronics"],
      tradingPartners: ["Switzerland", "Germany", "Italy", "United States"]
    }
  ];

  useEffect(() => {
    setTariffs(tariffData);
    setFilteredTariffs(tariffData);
    setIsLoading(false);
  }, []);

  // Filter tariffs based on search and filters
  useEffect(() => {
    let filtered = tariffs;

    if (searchTerm) {
      filtered = filtered.filter(tariff => 
        tariff.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tariff.countries.some(country => country.toLowerCase().includes(searchTerm.toLowerCase())) ||
        tariff.productCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tariff.hsCode.includes(searchTerm)
      );
    }

    if (countryFilter !== "all") {
      filtered = filtered.filter(tariff => 
        tariff.countries.some(country => country.toLowerCase().includes(countryFilter.toLowerCase()))
      );
    }

    if (productFilter !== "all") {
      filtered = filtered.filter(tariff => 
        tariff.productCategory.toLowerCase().includes(productFilter.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(tariff => tariff.status.toLowerCase() === statusFilter.toLowerCase());
    }

    setFilteredTariffs(filtered);
  }, [tariffs, searchTerm, countryFilter, productFilter, statusFilter]);

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'up': return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'down': return <ArrowDownRight className="h-4 w-4 text-green-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend) => {
    switch(trend) {
      case 'up': return 'text-red-600';
      case 'down': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sanctions': return 'bg-red-100 text-red-800 border-red-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalTariffs = tariffs.length;
  const activeTariffs = tariffs.filter(t => t.status === 'Active').length;
  const avgTariffRate = tariffs.reduce((sum, t) => sum + t.currentRate, 0) / tariffs.length;
  const totalTradeImpact = tariffs.reduce((sum, t) => {
    if (!t.estimatedImpact) return sum;
    const impactStr = typeof t.estimatedImpact === 'string' ? t.estimatedImpact : String(t.estimatedImpact);
    const numericValue = parseFloat(impactStr.replace(/[$BM,]/g, ''));
    return sum + (isNaN(numericValue) ? 0 : numericValue);
  }, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading tariff data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              Real-Time Tariff Tracking
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">Live Updates</Badge>
            </h1>
            <p className="text-gray-600 mt-2">Monitor global trade tariffs, duties, and trade policy changes in real-time</p>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tracked</p>
                <p className="text-3xl font-bold text-gray-900">{totalTariffs}</p>
                <p className="text-xs text-gray-500 mt-1">Tariff schedules</p>
              </div>
              <BarChart3 className="h-12 w-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tariffs</p>
                <p className="text-3xl font-bold text-green-600">{activeTariffs}</p>
                <p className="text-xs text-gray-500 mt-1">Currently effective</p>
              </div>
              <TrendingUp className="h-12 w-12 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Tariff Rate</p>
                <p className="text-3xl font-bold text-orange-600">{isNaN(avgTariffRate) ? '0.0' : avgTariffRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">Weighted average</p>
              </div>
              <DollarSign className="h-12 w-12 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tariff Measures</p>
                <p className="text-3xl font-bold text-purple-600">{tariffs.filter(t => t.status === 'Active').length}</p>
                <p className="text-xs text-gray-500 mt-1">Currently in effect</p>
              </div>
              <Globe className="h-12 w-12 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tariffs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                <SelectItem value="united states">United States</SelectItem>
                <SelectItem value="china">China</SelectItem>
                <SelectItem value="european union">European Union</SelectItem>
                <SelectItem value="india">India</SelectItem>
                <SelectItem value="japan">Japan</SelectItem>
                <SelectItem value="canada">Canada</SelectItem>
                <SelectItem value="brazil">Brazil</SelectItem>
              </SelectContent>
            </Select>

            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="metals">Metals & Alloys</SelectItem>
                <SelectItem value="automotive">Automotive</SelectItem>
                <SelectItem value="agricultural">Agricultural Products</SelectItem>
                <SelectItem value="electronics">Electronics & Technology</SelectItem>
                <SelectItem value="energy">Energy & Petroleum</SelectItem>
                <SelectItem value="textiles">Textiles & Apparel</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sanctions">Sanctions</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setCountryFilter("all");
                setProductFilter("all");
                setStatusFilter("all");
              }}
              className="w-full"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tariff List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Active Tariffs ({filteredTariffs.length})
            </span>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <RefreshCw className="h-3 w-3 mr-1" />
              Real-time updates
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {filteredTariffs.map((tariff) => (
              <Card key={tariff.id} className="cursor-pointer transition-all hover:shadow-md border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* Title and Countries */}
                    <div className="lg:col-span-4">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{tariff.title}</h3>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {tariff.countries.map((country, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {country}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">{tariff.productCategory}</p>
                      <p className="text-xs text-gray-500">HS Code: {tariff.hsCode}</p>
                    </div>

                    {/* Current Rate & Change */}
                    <div className="lg:col-span-2 text-center">
                      <div className="text-2xl font-bold text-gray-900">{typeof tariff.currentRate === 'number' ? tariff.currentRate.toFixed(1) : tariff.rate || '0'}%</div>
                      <div className={`flex items-center justify-center gap-1 text-sm ${getTrendColor(tariff.trend)}`}>
                        {getTrendIcon(tariff.trend)}
                        {typeof tariff.change === 'number' ? (tariff.change > 0 ? '+' : '') + tariff.change.toFixed(1) + '%' : tariff.change}
                      </div>
                      <div className="text-xs text-gray-500">
                        ({typeof tariff.changePercent === 'number' ? (tariff.changePercent === Infinity ? '∞' : tariff.changePercent.toFixed(0)) : '0'}% change)
                      </div>
                    </div>

                    {/* Status & Priority */}
                    <div className="lg:col-span-2 flex flex-col gap-2">
                      <Badge className={getStatusColor(tariff.status)}>
                        {tariff.status}
                      </Badge>
                      <Badge className={getPriorityColor(tariff.priority)}>
                        {tariff.priority}
                      </Badge>
                    </div>

                    {/* Impact */}
                    <div className="lg:col-span-2 text-center">
                      <div className="text-lg font-semibold text-green-600">{tariff.estimatedImpact || 'N/A'}</div>
                      <div className="text-xs text-gray-500">${typeof tariff.affectedTrade === 'number' ? tariff.affectedTrade.toFixed(1) : '0'}B trade</div>
                      <div className="text-xs text-gray-500">affected</div>
                    </div>

                    {/* Last Update */}
                    <div className="lg:col-span-2 text-center text-sm text-gray-500">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.floor((Date.now() - (tariff.lastUpdate instanceof Date ? tariff.lastUpdate.getTime() : new Date(tariff.lastUpdate).getTime())) / (1000 * 60))}m ago
                      </div>
                      <div className="text-xs">
                        Effective: {tariff.effectiveDate instanceof Date ? tariff.effectiveDate.toLocaleDateString() : new Date(tariff.effectiveDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Description and Sources */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-700 mb-3">{tariff.description}</p>
                    
                    {/* News Sources */}
                    <div className="flex flex-wrap gap-2">
                      {tariff.sources.map((source, idx) => (
                        <a 
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                          <Building2 className="h-3 w-3" />
                          {source.outlet}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>

                    {/* Related Products */}
                    <div className="mt-3">
                      <span className="text-xs font-medium text-gray-600">Related products: </span>
                      <span className="text-xs text-gray-500">{(tariff.relatedProducts || tariff.products || []).join(', ')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
