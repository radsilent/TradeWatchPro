# TradeWatch - Global Trade Intelligence Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.2.0-blue.svg)](https://reactjs.org/)

A comprehensive global trade intelligence platform that monitors maritime trade disruptions, port activities, supply chain analytics, and tariff impacts in real-time. Built by **VectorStream Systems** for enterprise maritime intelligence.

## 🌊 Features

### Core Modules
- **🌍 Global Overview Dashboard**: Real-time monitoring with interactive maps, 200+ major ports, and comprehensive legend
- **⚠️ Active Disruptions**: Track current trade disruptions with real-time news integration and source validation
- **🚢 Vessel Tracking**: Real-time vessel monitoring with triangular directional indicators and AIS data
- **💰 Tariff Tracking**: Comprehensive tariff analysis with 2025-2035 projections and 100+ global tariffs
- **🗺️ Trade Routes**: Interactive visualization of 8 major shipping lanes with vectors and risk assessment
- **📊 Analytics**: Advanced analytics with confidence scoring and trend analysis
- **📡 Live AIS Feed**: Real-time vessel tracking and maritime intelligence
- **🛰️ Live Port View**: Coming soon satellite imagery with auto-zoom and AIS/RF tracking capabilities

### Advanced Capabilities
- **Real-time Data Integration**: 110+ maritime search terms, news APIs, RSS feeds, and government data sources
- **AI-Powered Forecasting**: Disruption and tariff projections extending to 2035
- **Risk Assessment**: Critical chokepoint analysis and supply chain vulnerability mapping
- **Interactive Maps**: Leaflet-based visualizations with custom markers, legends, and overlays
- **Comprehensive Filtering**: Date slicers (2024-2035), severity filters, and region-specific analysis
- **Source Validation**: News source verification with reliability scoring and confidence metrics
- **Mobile Optimization**: Smart detection with desktop/tablet usage recommendations

## 🚀 Quick Start

### Option 1: Using the startup script (Recommended)
```bash
chmod +x start-app.sh
./start-app.sh
```

### Option 2: Manual setup
```bash
# Install Node.js 20 using nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20

# Install dependencies
npm install

# Start the development server
npm run dev
```

## 🌐 Accessing the Application

Once the development server is running, open your browser and navigate to:
```
http://localhost:5174
```

### Navigation Structure
- `/` - Global Overview Dashboard
- `/Disruptions` - Active Disruptions
- `/VesselTracking` - Vessel Tracking
- `/TariffTracking` - Tariff Analysis
- `/TradeRoutes` - Trade Routes Visualization
- `/Analytics` - Advanced Analytics
- `/LiveAIS` - Live AIS Feed
- `/LivePortView` - Live Port View (Satellite Coming Soon)

## 🛠️ Technology Stack

### Frontend Framework
- **React 18.2.0** with Hooks and Context
- **Vite 5.0** for build tooling and HMR
- **React Router DOM 6.x** for routing

### UI & Styling
- **Tailwind CSS 3.x** with custom maritime theme
- **Radix UI** for accessible component primitives
- **Lucide React** for consistent iconography
- **Custom CSS Variables** for maritime branding

### Data Visualization
- **Recharts 2.x** for charts and graphs
- **Leaflet** with React-Leaflet for interactive maps
- **Custom D3.js** integrations for specialized visualizations

### Data Integration
- **Real-time APIs**: NewsAPI, RSS feeds, government data sources
- **Custom Entities System**: Abstracted data layer for ports, disruptions, tariffs
- **API Aggregator**: Centralized data fetching with intelligent caching and fallbacks
- **Web Scraping Integration**: Real-time maritime disruption monitoring

### Development Tools
- **ESLint** with React and accessibility rules
- **Date-fns** for date manipulation and formatting
- **Custom Hooks** for state management and mobile detection

## 📁 Project Architecture

```
TradeWatchApp/
├── public/
│   └── Spire_Maritime_Ships_2024_2030.csv    # Maritime data
├── src/
│   ├── api/                                   # Data layer
│   │   ├── entities.js                        # Data abstraction layer
│   │   ├── apiAggregator.js                   # Centralized API management
│   │   ├── newsIntegration.js                 # News API integration
│   │   ├── realTimeIntegration.js             # Real-time data sources
│   │   ├── tariffIntegration.js               # Tariff data integration
│   │   ├── top200Ports.js                     # Global ports data
│   │   └── maritimeAPIs.js                    # Maritime API integrations
│   ├── components/                            # React components
│   │   ├── dashboard/                         # Dashboard components
│   │   │   ├── GlobalMap.jsx                  # Interactive world map with legend
│   │   │   ├── TradeRoutes.jsx                # Trade routes visualization
│   │   │   ├── ActiveAlerts.jsx               # Alert management
│   │   │   ├── MetricsPanel.jsx               # Key metrics display
│   │   │   ├── DisruptionTimeline.jsx         # Timeline visualization
│   │   │   └── DateSlicer.jsx                 # Date range controls (2024-2035)
│   │   ├── ui/                                # Base UI components (Radix UI)
│   │   └── VectorStreamLogo.jsx               # Company branding
│   ├── pages/                                 # Application pages
│   │   ├── Dashboard.jsx                      # Main dashboard
│   │   ├── VesselTracking.jsx                 # Vessel tracking page
│   │   ├── TariffTracking.jsx                 # Tariff analysis page
│   │   ├── TradeRoutes.jsx                    # Trade routes page
│   │   ├── Analytics.jsx                      # Advanced analytics
│   │   ├── LivePortView.jsx                   # Satellite port monitoring
│   │   ├── Layout.jsx                         # Application layout with mobile detection
│   │   └── index.jsx                          # Routing configuration
│   ├── hooks/                                 # Custom React hooks
│   │   └── use-mobile.jsx                     # Mobile detection hook
│   ├── lib/                                   # Utility libraries
│   ├── utils/                                 # Helper functions
│   └── main.jsx                               # Application entry point
├── docs/                                      # Documentation
├── package.json                               # Dependencies and scripts
├── tailwind.config.js                        # Tailwind configuration
├── vite.config.js                            # Vite configuration
└── start-app.sh                              # Startup script
```

## 🗺️ Data Sources & Integration

### Real-time Data Sources
- **News APIs**: Reuters, BBC, Maritime Executive, TradeWinds, AP News
- **Government APIs**: US Census Bureau, World Bank, OECD, Trade.gov
- **Maritime APIs**: Port authorities, shipping lines, AIS providers
- **RSS Feeds**: Industry publications and specialized maritime news sources

### Data Processing
- **News Filtering**: 110+ maritime-specific search terms for disruption detection
- **Source Validation**: Multi-tier reliability scoring and verification system
- **Impact Assessment**: Descriptive impact levels (Critical/High/Medium/Low)
- **Confidence Scoring**: Multi-factor confidence assessment with source weighting

### Data Entities
```javascript
// Port Entity (200+ Global Ports)
{
  id, name, country, coordinates, annual_throughput,
  port_code, status, strategic_importance, facilities,
  major_shipping_lines, connectivity_score
}

// Disruption Entity
{
  id, title, description, start_date, severity,
  affected_regions, economic_impact, status,
  confidence, sources, category, location, news_links
}

// Tariff Entity (100+ Global Tariffs)
{
  id, name, type, currentRate, projectedRate,
  countries, products, effectiveDate, priority,
  estimatedImpact, affectedTrade, imposingCountry
}

// Vessel Entity
{
  id, name, type, flag, coordinates, heading,
  speed, status, destination, eta, imo_number
}
```

## 🎨 UI/UX Design System

### Color Palette
```css
:root {
  --maritime-dark: #0a1628;
  --maritime-blue: #1e3a8a;
  --ocean-blue: #0369a1;
  --alert-red: #dc2626;
  --warning-amber: #d97706;
  --success-emerald: #059669;
  --slate-100: #f1f5f9;
  --slate-800: #1e293b;
  --slate-900: #0f172a;
}
```

### Component System
- **Interactive Maps**: Dark theme with comprehensive legends and real-time counts
- **Mobile Detection**: Smart banner system encouraging desktop/tablet usage
- **Cards**: Maritime-themed with backdrop blur effects and gradient borders
- **Navigation**: Responsive sidebar with contextual icons and VectorStream branding
- **Date Controls**: Advanced sliders supporting 2024-2035 range with dual cursors
- **Badges**: Risk-level color coding with severity indicators
- **Tables**: Responsive with sorting, filtering, and source link integration

## 📊 Available Scripts

```bash
# Development
npm run dev          # Start development server (port 5174)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Utilities
npm run clean        # Clean build artifacts
```

## 🚢 Maritime Domain Features

### Global Trade Routes (8 Major Routes)
1. **Asia-Europe Route** - $1.24T value, 24.5M TEU
2. **Trans-Pacific Route** - $980B value, 18.7M TEU
3. **Asia-Middle East Route** - $620B value, 12.3M TEU
4. **Europe-Americas Route** - $540B value, 9.8M TEU
5. **Intra-Asia Route** - $450B value, 15.2M TEU
6. **Panama Canal Route** - $380B value, 6.8M TEU
7. **Northern Sea Route** - $120B value, 2.1M TEU
8. **Africa-Global Route** - $280B value, 6.7M TEU

### Critical Chokepoints
- **Suez Canal** - 12% of global trade
- **Strait of Hormuz** - 21% of global LNG
- **Panama Canal** - 6% of global trade
- **Strait of Malacca** - 25% of traded goods
- **Bosphorus Strait** - 3% of global oil

### Top 200 Global Ports
- Comprehensive port data with precise coordinates
- Strategic importance scoring and connectivity assessments
- Annual throughput metrics and facility information
- Real-time plotting on interactive maps

## 🔍 Analytics & Intelligence

### Confidence Scoring Methodology
- **Source Credibility**: Reuters/Bloomberg (90-95%), Industry sources (70-80%)
- **Validation Bonuses**: Multiple sources (+10-20%), Historical precedent (+15%)
- **Geographic Context**: Location-specific reliability adjustments
- **Temporal Factors**: Recency weighting and update frequency analysis

### Risk Assessment Framework
- **Geopolitical Risk**: Regional stability and conflict analysis
- **Weather Risk**: Climate patterns and seasonal disruption factors
- **Infrastructure Risk**: Port capacity and route vulnerability assessment
- **Economic Risk**: Trade volume impacts and cargo value analysis

## 🌐 Mobile & Accessibility

### Mobile Experience
- **Smart Detection**: Automatic mobile device and screen size detection
- **User Guidance**: Prominent banner recommending desktop/tablet usage
- **Persistent Preferences**: LocalStorage-based dismissal system
- **Responsive Design**: Optimized layouts for various screen sizes

### Accessibility Features
- **Semantic HTML**: Proper heading structure and ARIA labels
- **Keyboard Navigation**: Full keyboard accessibility support
- **Screen Reader Support**: Comprehensive alt text and descriptions
- **High Contrast**: Maritime color scheme with sufficient contrast ratios

## 🛰️ Future Features (Coming Soon)

### Live Port View
- **Satellite Imagery**: Real-time port monitoring with auto-zoom capabilities
- **AIS Integration**: Live vessel tracking within port boundaries
- **RF Data Analysis**: Radio frequency signal monitoring for vessel detection
- **Throughput Analytics**: Container movement and cargo flow analysis
- **Berth Occupancy**: Real-time dock utilization monitoring

## 🔧 Configuration

### Environment Variables
```bash
# API Configuration
VITE_NEWS_API_KEY=your_news_api_key
VITE_MARITIME_API_KEY=your_maritime_api_key

# Feature Flags
VITE_ENABLE_REAL_TIME=true
VITE_ENABLE_FORECASTING=true
VITE_ENABLE_SATELLITE=false  # Coming soon
```

## 🆘 Troubleshooting

### Common Issues

**Node.js version issues**
```bash
nvm install 20
nvm use 20
```

**Port conflicts (5174 already in use)**
```bash
# Kill process using port 5174
lsof -ti:5174 | xargs kill -9
```

**Dependencies issues**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Map not loading**
- Check browser console for Leaflet errors
- Verify internet connection for tile loading
- Clear browser cache and reload

**Data not displaying**
- Check API endpoints in network tab
- Verify data format in console logs
- Check for CORS issues with external APIs

**Date parsing errors**
- Ensure date-fns is properly installed
- Check for null/undefined date values in data sources
- Verify date format consistency across data sources

## 📈 Performance Optimization

### Current Optimizations
- **Code Splitting**: Route-based lazy loading
- **API Caching**: Intelligent caching with different TTLs
- **Data Limiting**: Optimized initial load with pagination
- **Map Rendering**: Efficient marker clustering and viewport-based loading
- **Bundle Optimization**: Tree-shaking and dependency analysis

### Performance Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.0s
- **Bundle Size**: < 500KB gzipped

## 📝 Recent Updates (v3.0.0)

### ✅ Latest Features
- **Map Legend**: Comprehensive legend with real-time counts for ports, disruptions, and tariffs
- **Mobile Detection**: Smart banner system encouraging optimal device usage
- **Enhanced Tariff Data**: 100+ global tariffs with 2025-2035 projections
- **Live Port View**: Coming soon satellite monitoring with detailed feature descriptions
- **Improved Analytics**: Robust date parsing and error handling
- **Source Integration**: Real-time news links and source validation
- **Performance Optimizations**: Faster loading and better caching

### 🔧 Technical Improvements
- **Error Handling**: Comprehensive error boundaries and fallback systems
- **Data Validation**: Robust input validation and sanitization
- **API Reliability**: Multiple fallback layers and retry mechanisms
- **Date Management**: Enhanced date parsing with multiple format support
- **Mobile UX**: Responsive design with device-specific recommendations

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- ESLint configuration for code quality
- Consistent formatting and naming conventions
- Component documentation with clear prop types
- Comprehensive error handling and logging

## 📞 Support & Contact

### VectorStream Systems
- **Website**: [vectorstream.systems](https://vectorstream.systems)
- **Email**: support@vectorstream.systems
- **Documentation**: [docs.tradewatch.app](https://docs.tradewatch.app)
- **Issue Tracking**: GitHub Issues

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Maritime Industry Partners** for domain expertise and validation
- **Open Source Community** for foundational libraries and tools
- **Data Providers** for real-time information and API access
- **Beta Testers** for comprehensive feedback and testing

---

**Built with ❤️ by VectorStream Systems for the global maritime community**

*Copyright © 2025 VectorStream Systems. All rights reserved.*