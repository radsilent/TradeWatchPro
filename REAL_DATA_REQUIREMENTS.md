# Real Data Source Requirements for TradeWatch

## Overview
TradeWatch now connects to **authoritative official sources only** for all maritime data. No mock or randomly generated data is used.

## Required API Keys and Subscriptions

### Tariff Data Sources
- **US Census Bureau Trade API**: Free with registration
  - URL: https://api.census.gov/data
  - Requirement: Census API key
  - Status: ✅ Implemented

- **World Bank Open Data**: Free access
  - URL: https://api.worldbank.org/v2
  - Requirement: None (open access)
  - Status: ✅ Implemented

- **USTR Trade Data**: Web scraping of official releases
  - URL: https://ustr.gov/
  - Requirement: None (public data)
  - Status: ✅ Implemented

- **EU TARIC Database**: Requires API access
  - URL: https://ec.europa.eu/taxation_customs/dds2/taric
  - Requirement: EU TARIC API credentials
  - Status: 🔄 Requires authentication

- **WTO Tariff Database**: Official WTO data
  - URL: https://www.wto.org/english/tratop_e/tariffs_e/
  - Requirement: WTO API access
  - Status: 🔄 Requires authentication

### Vessel/AIS Data Sources
- **IMO GISIS Database**: Official vessel registry
  - URL: https://gisis.imo.org/
  - Requirement: IMO credentials/subscription
  - Status: 🔄 Requires paid subscription

- **US Coast Guard AIS**: Official US AIS data
  - URL: https://www.navcen.uscg.gov/
  - Requirement: USCG API key
  - Status: 🔄 Requires authentication

- **MarineTraffic API**: Commercial vessel tracking
  - URL: https://www.marinetraffic.com/en/ais-api-services
  - Requirement: Paid subscription
  - Status: 🔄 Requires paid subscription

- **VesselFinder API**: Commercial vessel data
  - URL: https://www.vesselfinder.com/api
  - Requirement: Paid subscription
  - Status: 🔄 Requires paid subscription

- **Danish Maritime Authority**: Some free AIS data
  - URL: https://www.dma.dk/
  - Requirement: Registration
  - Status: 🔄 Limited free access

### Maritime Disruption Sources
- **Maritime News RSS Feeds**: Free access
  - Sources: Maritime Executive, World Maritime News, Splash247, etc.
  - Requirement: None
  - Status: ✅ Implemented

- **IMO GISIS Maritime Incidents**: Official incident reports
  - URL: https://gisis.imo.org/Public/MCI/
  - Requirement: IMO access
  - Status: 🔄 Requires authentication

- **Port Authority Notifications**: Official port notices
  - Various port authority websites
  - Requirement: API keys per port
  - Status: 🔄 Requires multiple registrations

## Current Implementation Status

### ✅ Currently Working (Free Sources)
1. **World Bank Tariff Data**: Average applied tariff rates by country
2. **Maritime Industry RSS Feeds**: Real-time news about disruptions
3. **USTR Press Releases**: Official US trade actions and investigations
4. **US Census Trade Data**: Import/export statistics (requires free API key)

### 🔄 Requires API Keys/Subscriptions
1. **Comprehensive AIS Data**: Requires paid subscriptions to MarineTraffic, VesselFinder, or similar
2. **IMO Official Data**: Requires IMO GISIS subscription
3. **EU TARIC Database**: Requires EU API credentials
4. **Port Authority APIs**: Each major port requires separate API registration

### 💰 Cost Estimates for Full Real Data Access
- **MarineTraffic API**: $500-2000/month for comprehensive AIS data
- **IMO GISIS Subscription**: $1000-5000/year for vessel registry access
- **VesselFinder Pro**: $300-1000/month for real-time vessel tracking
- **Multiple Port Authority APIs**: $100-500/month per major port

## Recommendations

### Phase 1: Free Data Sources (Current)
- ✅ World Bank trade data
- ✅ Maritime news RSS feeds
- ✅ USTR trade announcements
- 🔄 Get free Census API key

### Phase 2: Essential Paid Sources
- Subscribe to one comprehensive AIS provider (MarineTraffic or VesselFinder)
- Get IMO GISIS access for official vessel data
- Register with major port authorities (Rotterdam, Singapore, Los Angeles)

### Phase 3: Complete Coverage
- Add EU TARIC API access
- Add WTO official tariff database access
- Add comprehensive maritime incident databases

## Technical Notes

- All random/mock data generation has been removed
- API server now only connects to authoritative sources
- Proper error handling for unavailable APIs
- Caching implemented to respect API rate limits
- Data quality validation from official sources only

## API Endpoints

The real data API server runs on port 8001 and provides:
- `/api/tariffs` - Real tariff data from official trade databases
- `/api/vessels` - Real vessel data from maritime authorities  
- `/api/maritime-disruptions` - Real disruptions from maritime industry sources
- `/api/data-sources` - Information about all connected data sources

All data includes source attribution and reliability indicators.
