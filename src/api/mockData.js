// Mock data for TradeWatch App - replaces Base44 API calls

export const mockPorts = [
  {
    id: "port_1",
    name: "Port of Shanghai",
    country: "China",
    coordinates: {
      lat: 31.2304,
      lng: 121.4737
    },
    strategic_importance: 95,
    container_volume: "47.3M TEU",
    status: "operational",
    disruption_level: "low",
    port_code: "CNSHA",
    annual_throughput: 47300000
  },
  {
    id: "port_2", 
    name: "Port of Singapore",
    country: "Singapore",
    coordinates: {
      lat: 1.3521,
      lng: 103.8198
    },
    strategic_importance: 92,
    container_volume: "37.2M TEU",
    status: "operational",
    disruption_level: "low",
    port_code: "SGSIN",
    annual_throughput: 37200000
  },
  {
    id: "port_3",
    name: "Port of Los Angeles",
    country: "USA",
    coordinates: {
      lat: 34.0522,
      lng: -118.2437
    },
    strategic_importance: 88,
    container_volume: "9.9M TEU",
    status: "minor_disruption",
    disruption_level: "medium",
    port_code: "USLAX",
    annual_throughput: 9900000
  },
  {
    id: "port_4",
    name: "Port of Rotterdam",
    country: "Netherlands",
    coordinates: {
      lat: 51.9225,
      lng: 4.4792
    },
    strategic_importance: 85,
    container_volume: "15.3M TEU",
    status: "operational",
    disruption_level: "low",
    port_code: "NLRTM",
    annual_throughput: 15300000
  },
  {
    id: "port_5",
    name: "Port of Hamburg",
    country: "Germany",
    coordinates: {
      lat: 53.5511,
      lng: 9.9937
    },
    strategic_importance: 82,
    container_volume: "8.7M TEU",
    status: "operational",
    disruption_level: "low",
    port_code: "DEHAM",
    annual_throughput: 8700000
  },
  {
    id: "port_6",
    name: "Port of Dubai",
    country: "UAE",
    coordinates: {
      lat: 25.2048,
      lng: 55.2708
    },
    strategic_importance: 80,
    container_volume: "14.1M TEU",
    status: "operational",
    disruption_level: "low",
    port_code: "AEDXB",
    annual_throughput: 14100000
  },
  {
    id: "port_7",
    name: "Port of Busan",
    country: "South Korea",
    coordinates: {
      lat: 35.1796,
      lng: 129.0756
    },
    strategic_importance: 78,
    container_volume: "23.2M TEU",
    status: "operational",
    disruption_level: "low",
    port_code: "KRBUS",
    annual_throughput: 23200000
  },
  {
    id: "port_8",
    name: "Port of Antwerp",
    country: "Belgium",
    coordinates: {
      lat: 51.2194,
      lng: 4.4025
    },
    strategic_importance: 75,
    container_volume: "13.5M TEU",
    status: "operational",
    disruption_level: "low",
    port_code: "BEANR",
    annual_throughput: 13500000
  }
];

export const mockDisruptions = [
  {
    id: "disruption_1",
    title: "Suez Canal Blockage - Ever Given Incident",
    description: "Container ship Ever Given blocked the Suez Canal for 6 days, causing major delays in global trade",
    start_date: "2024-03-23",
    end_date: "2024-03-29",
    severity: "high",
    affected_ports: ["port_1", "port_2", "port_3", "port_4"],
    affected_regions: ["Suez Canal", "Mediterranean"],
    economic_impact: "$9.6 billion",
    status: "resolved",
    confidence_score: 95,
    sources: ["Reuters", "BBC", "Bloomberg"]
  },
  {
    id: "disruption_2",
    title: "Port of Los Angeles Labor Strike",
    description: "Dockworkers strike at Port of LA causing significant delays in container processing",
    start_date: "2024-08-15",
    end_date: "2024-08-18",
    severity: "medium",
    affected_ports: ["port_3"],
    affected_regions: ["North Pacific"],
    economic_impact: "$2.1 billion",
    status: "active",
    confidence_score: 88,
    sources: ["Reuters", "CNN"]
  },
  {
    id: "disruption_3",
    title: "Typhoon Hinnamnor Hits Busan Port",
    description: "Major typhoon causes temporary closure of Busan port operations",
    start_date: "2024-09-05",
    end_date: "2024-09-07",
    severity: "medium",
    affected_ports: ["port_7"],
    affected_regions: ["North Pacific"],
    economic_impact: "$800 million",
    status: "resolved",
    confidence_score: 92,
    sources: ["Reuters", "Korea Herald"]
  },
  {
    id: "disruption_4",
    title: "Cyber Attack on Port of Rotterdam",
    description: "Ransomware attack disrupts port management systems",
    start_date: "2024-07-12",
    end_date: "2024-07-14",
    severity: "high",
    affected_ports: ["port_4"],
    affected_regions: ["North Atlantic"],
    economic_impact: "$1.5 billion",
    status: "resolved",
    confidence_score: 85,
    sources: ["Reuters", "Dutch News"]
  },
  {
    id: "disruption_5",
    title: "Shanghai Port COVID-19 Lockdown",
    description: "COVID-19 restrictions cause major delays at world's busiest port",
    start_date: "2024-04-01",
    end_date: "2024-04-15",
    severity: "high",
    affected_ports: ["port_1"],
    affected_regions: ["South China Sea"],
    economic_impact: "$4.2 billion",
    status: "resolved",
    confidence_score: 90,
    sources: ["Reuters", "South China Morning Post"]
  },
  {
    id: "disruption_6",
    title: "Red Sea Shipping Attacks",
    description: "Houthi attacks on commercial vessels force rerouting around Africa",
    start_date: "2024-11-15",
    end_date: null,
    severity: "critical",
    affected_ports: ["port_1", "port_2", "port_4", "port_6"],
    affected_regions: ["Arabian Sea", "Strait of Hormuz", "Persian Gulf"],
    economic_impact: "$3.8 billion",
    status: "active",
    confidence_score: 87,
    sources: ["Reuters", "BBC", "Al Jazeera"]
  },
  {
    id: "disruption_7",
    title: "Port of Hamburg Flooding",
    description: "Severe flooding causes temporary closure of port operations",
    start_date: "2024-06-20",
    end_date: "2024-06-22",
    severity: "medium",
    affected_ports: ["port_5"],
    affected_regions: ["North Atlantic"],
    economic_impact: "$600 million",
    status: "resolved",
    confidence_score: 89,
    sources: ["Reuters", "Deutsche Welle"]
  },
  {
    id: "disruption_8",
    title: "Dubai Port Equipment Failure",
    description: "Major crane failure causes delays in container handling",
    start_date: "2024-08-10",
    end_date: "2024-08-12",
    severity: "low",
    affected_ports: ["port_6"],
    affected_regions: ["Persian Gulf"],
    economic_impact: "$200 million",
    status: "resolved",
    confidence_score: 82,
    sources: ["Reuters", "Gulf News"]
  },
  {
    id: "disruption_9",
    title: "Panama Canal Drought Crisis",
    description: "Severe drought reduces canal capacity, forcing ships to wait weeks",
    start_date: "2024-10-01",
    end_date: null,
    severity: "critical",
    affected_ports: ["port_3", "port_4", "port_5"],
    affected_regions: ["Panama Canal", "Caribbean Sea"],
    economic_impact: "$5.2 billion",
    status: "active",
    confidence_score: 94,
    sources: ["Reuters", "Bloomberg", "BBC"]
  },
  {
    id: "disruption_10",
    title: "Strait of Malacca Piracy Surge",
    description: "Increased pirate attacks force vessels to reroute through longer paths",
    start_date: "2024-09-20",
    end_date: null,
    severity: "high",
    affected_ports: ["port_1", "port_2", "port_7"],
    affected_regions: ["Strait of Malacca", "Indian Ocean"],
    economic_impact: "$1.8 billion",
    status: "active",
    confidence_score: 86,
    sources: ["Reuters", "Maritime Security"]
  },
  {
    id: "disruption_11",
    title: "Port of Singapore Cyber Breach",
    description: "Sophisticated cyber attack targets port management systems",
    start_date: "2024-10-15",
    end_date: "2024-10-18",
    severity: "high",
    affected_ports: ["port_2"],
    affected_regions: ["Strait of Malacca"],
    economic_impact: "$2.5 billion",
    status: "resolved",
    confidence_score: 91,
    sources: ["Reuters", "Straits Times"]
  },
  {
    id: "disruption_12",
    title: "Baltic Sea Navigation Disruption",
    description: "Russian military exercises block key shipping lanes",
    start_date: "2024-11-01",
    end_date: "2024-11-05",
    severity: "medium",
    affected_ports: ["port_4", "port_5", "port_8"],
    affected_regions: ["Baltic Sea", "North Sea"],
    economic_impact: "$1.2 billion",
    status: "resolved",
    confidence_score: 88,
    sources: ["Reuters", "BBC"]
  },
  {
    id: "disruption_13",
    title: "Mediterranean Storm System",
    description: "Unprecedented storm system disrupts shipping across Mediterranean",
    start_date: "2024-10-25",
    end_date: "2024-10-28",
    severity: "high",
    affected_ports: ["port_4", "port_8"],
    affected_regions: ["Mediterranean", "Black Sea"],
    economic_impact: "$1.7 billion",
    status: "resolved",
    confidence_score: 93,
    sources: ["Reuters", "Weather Channel"]
  },
  {
    id: "disruption_14",
    title: "South China Sea Territorial Dispute",
    description: "Escalating tensions force vessels to avoid disputed waters",
    start_date: "2024-11-10",
    end_date: null,
    severity: "critical",
    affected_ports: ["port_1", "port_2", "port_7"],
    affected_regions: ["South China Sea", "East China Sea"],
    economic_impact: "$4.5 billion",
    status: "active",
    confidence_score: 89,
    sources: ["Reuters", "South China Morning Post"]
  },
  {
    id: "disruption_15",
    title: "North Atlantic Storm Season",
    description: "Intense storm season disrupts transatlantic shipping routes",
    start_date: "2024-11-05",
    end_date: null,
    severity: "medium",
    affected_ports: ["port_3", "port_4", "port_5"],
    affected_regions: ["North Atlantic", "Labrador Sea"],
    economic_impact: "$2.8 billion",
    status: "active",
    confidence_score: 87,
    sources: ["Reuters", "NOAA"]
  },
  {
    id: "disruption_16",
    title: "Port of Antwerp Chemical Spill",
    description: "Major chemical spill forces temporary port closure",
    start_date: "2024-09-15",
    end_date: "2024-09-20",
    severity: "high",
    affected_ports: ["port_8"],
    affected_regions: ["North Sea"],
    economic_impact: "$900 million",
    status: "resolved",
    confidence_score: 90,
    sources: ["Reuters", "Belgian News"]
  },
  {
    id: "disruption_17",
    title: "Arctic Route Ice Conditions",
    description: "Unusual ice conditions block Northern Sea Route",
    start_date: "2024-10-30",
    end_date: null,
    severity: "medium",
    affected_ports: ["port_5", "port_8"],
    affected_regions: ["Arctic Ocean", "Barents Sea"],
    economic_impact: "$600 million",
    status: "active",
    confidence_score: 84,
    sources: ["Reuters", "Arctic Council"]
  },
  {
    id: "disruption_18",
    title: "Indian Ocean Cyclone Season",
    description: "Multiple cyclones disrupt shipping in Indian Ocean",
    start_date: "2024-11-08",
    end_date: null,
    severity: "high",
    affected_ports: ["port_1", "port_2", "port_6"],
    affected_regions: ["Indian Ocean", "Arabian Sea"],
    economic_impact: "$3.1 billion",
    status: "active",
    confidence_score: 92,
    sources: ["Reuters", "IMD"]
  },
  {
    id: "disruption_19",
    title: "Port of Busan Earthquake",
    description: "Moderate earthquake damages port infrastructure",
    start_date: "2024-11-12",
    end_date: "2024-11-15",
    severity: "high",
    affected_ports: ["port_7"],
    affected_regions: ["Sea of Japan"],
    economic_impact: "$1.4 billion",
    status: "resolved",
    confidence_score: 95,
    sources: ["Reuters", "Korea Herald"]
  },
  {
    id: "disruption_20",
    title: "Gulf of Mexico Hurricane Impact",
    description: "Hurricane disrupts Gulf Coast port operations",
    start_date: "2024-11-03",
    end_date: "2024-11-07",
    severity: "medium",
    affected_ports: ["port_3"],
    affected_regions: ["Gulf of Mexico"],
    economic_impact: "$1.9 billion",
    status: "resolved",
    confidence_score: 91,
    sources: ["Reuters", "NOAA"]
  }
];

export const mockVessels = [
  {
    id: "vessel_1",
    name: "Ever Given",
    mmsi: "9811000",
    coordinates: {
      lat: 31.2304,
      lng: 121.4737
    },
    speed: 12.5,
    heading: 45,
    destination: "Port of Shanghai",
    vessel_type: "Container Ship",
    status: "underway"
  },
  {
    id: "vessel_2",
    name: "MSC Oscar",
    mmsi: "9811001",
    coordinates: {
      lat: 1.3521,
      lng: 103.8198
    },
    speed: 8.2,
    heading: 90,
    destination: "Port of Singapore",
    vessel_type: "Container Ship",
    status: "anchored"
  },
  {
    id: "vessel_3",
    name: "CMA CGM Marco Polo",
    mmsi: "9811002",
    coordinates: {
      lat: 34.0522,
      lng: -118.2437
    },
    speed: 15.1,
    heading: 180,
    destination: "Port of Los Angeles",
    vessel_type: "Container Ship",
    status: "underway"
  }
];

export const mockAnalytics = {
  totalDisruptions: 156,
  activeDisruptions: 23,
  economicImpact: "$28.7 billion",
  affectedPorts: 45,
  averageResolutionTime: "4.2 days",
  topDisruptionTypes: [
    { type: "Weather Events", count: 42, percentage: 27 },
    { type: "Labor Disputes", count: 38, percentage: 24 },
    { type: "Cyber Attacks", count: 25, percentage: 16 },
    { type: "Equipment Failures", count: 22, percentage: 14 },
    { type: "Geopolitical", count: 18, percentage: 12 },
    { type: "Other", count: 11, percentage: 7 }
  ]
};
