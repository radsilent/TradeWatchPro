# 🌊 TradeWatch Pro - Maritime Intelligence Platform

**Real-time AIS vessel tracking, tariff monitoring, and maritime disruption alerts**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Cloudflare%20Workers-orange)](https://tradewatch-backend.collaromatt.workers.dev)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-green)](https://fastapi.tiangolo.com/)

## 🚀 Features

### 🚢 Real-time Vessel Tracking
- **25,000+ vessels** tracked globally via AIS Stream integration
- Live vessel positions, speeds, courses, and destinations
- Interactive Leaflet maps with vessel markers and popups
- Vessel impact analysis and risk assessment

### 📊 Government Tariff Data
- Real-time tariff data from **World Bank, WTO, USTR** APIs
- Trade policy changes and economic impact analysis
- Country-specific tariff rates and product categories
- Historical tariff trends and predictions

### 🚨 Maritime Disruption Alerts
- **NOAA weather warnings** and navigation alerts
- RSS feeds from **Reuters, Splash247, gCaptain**
- Port congestion and operational disruptions
- Security alerts and piracy warnings

### 🧠 AI-Powered Analytics
- Economic forecasting and trade projections
- Route optimization recommendations
- Risk assessment and impact scoring
- ML-based disruption predictions

### 💼 Business Intelligence
- Professional dashboard with real-time metrics
- Fleet management and vessel monitoring
- Cost savings analysis and ROI calculations
- Subscription-based pricing tiers

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  React Frontend │    │  FastAPI Backend │    │ External APIs   │
│                 │    │                  │    │                 │
│ • Analytics     │◄──►│ • AIS Stream     │◄──►│ • AIS Stream    │
│ • Fleet Mgmt    │    │ • Tariff APIs    │    │ • World Bank    │
│ • Alerts        │    │ • Disruption     │    │ • NOAA          │
│ • Settings      │    │ • ML Predictions │    │ • Reuters RSS   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│ Cloudflare Pages│    │Cloudflare Workers│
│ (Frontend)      │    │ (Backend API)    │
└─────────────────┘    └──────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Leaflet** for interactive maps
- **Recharts** for data visualization

### Backend
- **FastAPI** (Python) for high-performance APIs
- **aiohttp** for async HTTP requests
- **BeautifulSoup** for web scraping
- **Real-time WebSocket** connections for AIS data

### Deployment
- **Cloudflare Workers** for serverless backend
- **Cloudflare Pages** for frontend hosting
- **GitHub Actions** for CI/CD (optional)

### Data Sources
- **AIS Stream** - Real-time vessel positions
- **World Bank API** - Trade and tariff data
- **NOAA** - Weather and navigation warnings
- **Reuters/Maritime News** - Disruption alerts
- **WTO/USTR** - Government trade policies

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- Git

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/TradeWatchPro.git
cd TradeWatchPro
```

### 2. Install Dependencies
```bash
# Frontend dependencies
npm install

# Backend dependencies
cd ai-processing
pip install -r requirements.txt
cd ..
```

### 3. Start Development Servers
```bash
# Terminal 1: Start backend API
cd ai-processing
python3 enhanced_real_data_api.py

# Terminal 2: Start frontend
npm run dev
```

### 4. Open Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8001
- **API Docs:** http://localhost:8001/docs

## 🌐 Production Deployment

### Cloudflare Workers (Backend)
```bash
cd cloudflare-worker
wrangler deploy
```

### Cloudflare Pages (Frontend)
```bash
npm run build
# Upload dist/ folder to Cloudflare Pages
```

**Live URLs:**
- **Backend API:** https://tradewatch-backend.XXXX.workers.dev
- **Frontend:** https://tradewatch-pro.pages.dev (after Pages deployment)

## 📡 API Endpoints

### Vessels
```http
GET /api/vessels?limit=1000
```
Returns real-time vessel data with AIS positions

### Maritime Disruptions
```http
GET /api/maritime-disruptions
```
Current maritime alerts and disruptions

### Tariffs
```http
GET /api/tariffs?limit=100
```
Government tariff data and trade policies

### Ports
```http
GET /api/ports?limit=50
```
Major port information and statistics

### AI Projections
```http
GET /api/ai-projections
```
Economic forecasts and trade predictions

## 🧪 Testing

```bash
# Run comprehensive tests
./test-app.sh

# Test individual components
curl http://localhost:8001/api/health
curl http://localhost:8001/api/vessels?limit=5
```

## 📊 Data Sources & Compliance

- **AIS Stream:** Real-time vessel tracking (Licensed)
- **World Bank:** Open trade data (Public Domain)
- **NOAA:** Weather/navigation warnings (Public Domain)
- **Reuters RSS:** Maritime news (Fair Use)
- **Government APIs:** USTR, WTO, EU TARIC (Public)


### ROI Features
- Route optimization savings
- Disruption early warning
- Tariff impact analysis
- Supply chain risk mitigation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **AIS Stream** for real-time vessel data
- **OpenStreetMap** for map tiles
- **Cloudflare** for serverless infrastructure
- **Maritime community** for data standards

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/TradeWatchPro/issues)


---

**Built with ❤️ for the maritime industry** 🚢⚓
