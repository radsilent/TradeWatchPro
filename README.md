# TradeWatch - Global Trade Intelligence Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.2.0-blue.svg)](https://reactjs.org/)

A comprehensive global trade intelligence platform that monitors maritime trade disruptions, port activities, supply chain analytics, and tariff impacts in real-time. Built by **VectorStream Systems** for enterprise maritime intelligence.

![TradeWatch Dashboard](./docs/images/dashboard-preview.png)

## 🌊 Features

### Core Modules
- **🌍 Global Overview Dashboard**: Real-time monitoring of global trade activities with interactive maps
- **⚠️ Active Disruptions**: Track and analyze current trade disruptions with news integration
- **🚢 Vessel Tracking**: Real-time vessel monitoring with triangular directional indicators
- **💰 Tariff Tracking**: Comprehensive tariff analysis with 2025-2035 projections
- **🗺️ Trade Routes**: Interactive visualization of major shipping lanes with vectors and risk assessment
- **📊 Impact Analysis**: Multi-dimensional analysis including regional, sector, and economic impacts
- **📈 Analytics**: Advanced analytics with confidence scoring and source validation
- **🛰️ Live AIS Feed**: Real-time vessel tracking and maritime intelligence
- **🏭 Impacted Ports**: Port-specific impact assessments and performance metrics

### Advanced Capabilities
- **Real-time Data Integration**: News APIs, RSS feeds, and government data sources
- **AI-Powered Forecasting**: Projections extending to 2035 with scenario planning
- **Risk Assessment**: Critical chokepoint analysis and supply chain vulnerability mapping
- **Interactive Maps**: Leaflet-based visualizations with custom markers and overlays
- **Comprehensive Filtering**: Date slicers, severity filters, and region-specific analysis
- **Source Validation**: News source verification and reliability scoring

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
- `/ImpactedPorts` - Impact Analysis
- `/Analytics` - Advanced Analytics
- `/LiveAIS` - Live AIS Feed

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
- **Caching Layer**: In-memory caching for performance optimization

### Development Tools
- **ESLint** with React and accessibility rules
- **React Hook Form** with Zod validation
- **Date-fns** for date manipulation
- **Custom Hooks** for state management

## 📁 Project Architecture

```
TradeWatchApp/
├── public/
│   └── Spire_Maritime_Ships_2024_2030.csv    # Maritime data
├── src/
│   ├── api/                                   # Data layer
│   │   ├── entities.js                        # Data abstraction layer
│   │   ├── newsIntegration.js                 # News API integration
│   │   ├── realTimeIntegration.js             # Real-time data sources
│   │   ├── tariffIntegration.js               # Tariff data integration
│   │   ├── top200Ports.js                     # Global ports data
│   │   └── base44Client.js                    # Client integrations
│   ├── components/                            # React components
│   │   ├── dashboard/                         # Dashboard components
│   │   │   ├── GlobalMap.jsx                  # Interactive world map
│   │   │   ├── TradeRoutes.jsx                # Trade routes visualization
│   │   │   ├── ActiveAlerts.jsx               # Alert management
│   │   │   ├── MetricsPanel.jsx               # Key metrics display
│   │   │   ├── DisruptionTimeline.jsx         # Timeline visualization
│   │   │   └── DateSlicer.jsx                 # Date range controls
│   │   ├── ui/                                # Base UI components
│   │   └── VectorStreamLogo.jsx               # Company branding
│   ├── pages/                                 # Application pages
│   │   ├── Dashboard.jsx                      # Main dashboard
│   │   ├── VesselTracking.jsx                 # Vessel tracking page
│   │   ├── TariffTracking.jsx                 # Tariff analysis page
│   │   ├── TradeRoutes.jsx                    # Trade routes page
│   │   ├── ImpactAnalysis.jsx                 # Impact analysis page
│   │   ├── Analytics.jsx                      # Advanced analytics
│   │   ├── Layout.jsx                         # Application layout
│   │   └── index.jsx                          # Routing configuration
│   ├── hooks/                                 # Custom React hooks
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
- **News APIs**: Reuters, BBC, Maritime Executive, TradeWinds
- **Government APIs**: US Census Bureau, World Bank, OECD
- **Maritime APIs**: Port authorities, shipping lines, AIS providers
- **RSS Feeds**: Industry publications and news sources

### Data Processing
- **News Filtering**: 110+ maritime-specific search terms
- **Source Validation**: Reliability scoring and verification
- **Economic Impact**: Descriptive impact levels (Critical/High/Medium/Low)
- **Confidence Scoring**: Multi-factor confidence assessment

### Data Entities
```javascript
// Port Entity
{
  id, name, country, coordinates, annual_throughput,
  port_code, status, strategic_importance, facilities,
  major_shipping_lines, connectivity_score
}

// Disruption Entity
{
  id, title, description, start_date, severity,
  affected_regions, economic_impact, status,
  confidence, sources, category, location
}

// Tariff Entity
{
  id, name, type, currentRate, projectedRate,
  countries, products, effectiveDate, priority,
  estimatedImpact, affectedTrade
}
```

## 🎨 UI/UX Design System

### Color Palette
```css
:root {
  --maritime-dark: #0c1e3d;
  --maritime-blue: #1e3a8a;
  --ocean-blue: #0369a1;
  --alert-red: #dc2626;
  --warning-amber: #d97706;
  --success-emerald: #059669;
}
```

### Component System
- **Cards**: Maritime-themed with backdrop blur effects
- **Maps**: Dark theme optimized for maritime data
- **Charts**: Custom color schemes for data visualization
- **Navigation**: Sidebar with contextual icons
- **Badges**: Risk-level color coding
- **Tables**: Responsive with sorting and filtering

## 📊 Available Scripts

```bash
# Development
npm run dev          # Start development server (port 5174)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Utilities
npm run clean        # Clean build artifacts
npm run type-check   # TypeScript type checking
```

## 🔧 Configuration

### Environment Variables
```bash
# API Configuration
VITE_NEWS_API_KEY=your_news_api_key
VITE_MARITIME_API_KEY=your_maritime_api_key

# Feature Flags
VITE_ENABLE_REAL_TIME=true
VITE_ENABLE_FORECASTING=true
```

### Build Configuration
- **Vite**: Modern build tool with HMR
- **Target**: ES2020 for modern browsers
- **Bundle Analysis**: Built-in bundle analyzer
- **Code Splitting**: Route-based splitting

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
- Comprehensive port data with coordinates
- Strategic importance scoring
- Annual throughput metrics
- Connectivity assessments

## 🔍 Analytics & Intelligence

### Confidence Scoring Methodology
- **Source Credibility**: Reuters/Bloomberg (90-95%), Industry (70-80%)
- **Validation Bonuses**: Multiple sources (+10-20%), Historical precedent (+15%)
- **Geographic Context**: Location-specific reliability adjustments
- **Temporal Factors**: Recency and update frequency

### Risk Assessment Framework
- **Geopolitical Risk**: Regional stability analysis
- **Weather Risk**: Climate and seasonal factors
- **Infrastructure Risk**: Port and route capacity
- **Economic Risk**: Trade volume and value impacts

## 🌐 Deployment

### Production Build
```bash
npm run build
```

### Docker Deployment
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5174
CMD ["npm", "run", "preview"]
```

## 🧪 Testing

### Test Coverage
- Component unit tests
- Integration tests for data flows
- End-to-end testing for critical paths
- Performance testing for map rendering

### Testing Commands
```bash
npm run test          # Run unit tests
npm run test:e2e      # Run E2E tests
npm run test:coverage # Generate coverage report
```

## 🔒 Security

### Data Security
- API key management
- CORS configuration
- Input validation and sanitization
- XSS protection

### Privacy
- No personal data collection
- Anonymized analytics
- Secure data transmission

## 📈 Performance

### Optimization Features
- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: WebP format with fallbacks
- **Caching**: Strategic API response caching
- **Bundle Size**: Optimized dependencies

### Performance Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.0s
- **Bundle Size**: < 500KB gzipped

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- ESLint configuration for code quality
- Prettier for consistent formatting
- Conventional commits for changelog generation
- Component documentation with JSDoc

## 📝 Changelog

### Version 2.0.0 (Latest)
- ✅ Added comprehensive Trade Routes visualization
- ✅ Implemented 2025-2035 tariff projections
- ✅ Enhanced Impact Analysis with scenario planning
- ✅ Integrated real-time news and RSS feeds
- ✅ Added top 200 global ports data
- ✅ Improved date slicer extending to 2035
- ✅ Fixed data visualization issues
- ✅ Added VectorStream Systems branding

### Version 1.0.0
- Initial release with core maritime intelligence features
- Basic dashboard and disruption tracking
- Port and vessel monitoring capabilities

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
- Clear browser cache

**Data not displaying**
- Check API endpoints in network tab
- Verify data format in console logs
- Check for CORS issues

## 📞 Support & Contact

### VectorStream Systems
- **Website**: [vectorstream.systems](https://vectorstream.systems)
- **Email**: support@vectorstream.systems
- **Documentation**: [docs.tradewatch.app](https://docs.tradewatch.app)
- **Issue Tracking**: GitHub Issues

### Community
- **Discord**: [TradeWatch Community](https://discord.gg/tradewatch)
- **Twitter**: [@TradeWatchApp](https://twitter.com/tradewatchapp)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Maritime Industry Partners** for domain expertise
- **Open Source Community** for foundational libraries
- **Data Providers** for real-time information
- **Beta Testers** for feedback and validation

---

**Built with ❤️ by VectorStream Systems for the global maritime community**