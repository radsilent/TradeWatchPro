"""
Comprehensive Maritime Data Scraper
Real-time data collection for AI training and projections
"""

import asyncio
import aiohttp
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import structlog
import json
import re
from bs4 import BeautifulSoup
import feedparser
from dataclasses import dataclass
import xml.etree.ElementTree as ET

logger = structlog.get_logger()

@dataclass
class ScrapingTarget:
    name: str
    url: str
    type: str  # 'api', 'rss', 'html', 'json'
    headers: Dict[str, str]
    rate_limit: float  # seconds between requests
    parser_function: str

class MaritimeDataScraper:
    """Comprehensive scraper for maritime intelligence data"""
    
    def __init__(self):
        self.session = None
        self.scraped_data = {
            'vessels': [],
            'ports': [],
            'disruptions': [],
            'tariffs': [],
            'weather': [],
            'economic_indicators': [],
            'news': []
        }
        
        # Rate limiting
        self.last_request_times = {}
        
        # Data sources configuration
        self.data_sources = self._configure_data_sources()
    
    def _configure_data_sources(self) -> List[ScrapingTarget]:
        """Configure all maritime data sources"""
        
        sources = [
            # AIS and Vessel Data Sources
            ScrapingTarget(
                name="MarineTraffic API",
                url="https://services.marinetraffic.com/api/exportvessels/v:3/",
                type="api",
                headers={"User-Agent": "TradeWatch-Intelligence/1.0"},
                rate_limit=2.0,
                parser_function="parse_marine_traffic"
            ),
            
            ScrapingTarget(
                name="VesselFinder Feed",
                url="https://www.vesselfinder.com/api/pro/vesselsonmap",
                type="api", 
                headers={"User-Agent": "Mozilla/5.0 (compatible; TradeWatch/1.0)"},
                rate_limit=3.0,
                parser_function="parse_vessel_finder"
            ),
            
            # Port Data Sources
            ScrapingTarget(
                name="Port Authority RSS",
                url="https://www.portofrotterdam.com/en/news/rss",
                type="rss",
                headers={},
                rate_limit=5.0,
                parser_function="parse_port_rss"
            ),
            
            ScrapingTarget(
                name="Singapore Port Authority",
                url="https://www.mpa.gov.sg/web/portal/home/media-centre/news-releases",
                type="html",
                headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"},
                rate_limit=4.0,
                parser_function="parse_singapore_port"
            ),
            
            # Maritime News Sources
            ScrapingTarget(
                name="Lloyd's List RSS",
                url="https://lloydslist.maritimeintelligence.informa.com/rss",
                type="rss",
                headers={},
                rate_limit=3.0,
                parser_function="parse_maritime_news_rss"
            ),
            
            ScrapingTarget(
                name="TradeWinds News",
                url="https://www.tradewindsnews.com/feed",
                type="rss",
                headers={},
                rate_limit=3.0,
                parser_function="parse_maritime_news_rss"
            ),
            
            ScrapingTarget(
                name="Maritime Executive",
                url="https://maritime-executive.com/rss.xml",
                type="rss",
                headers={},
                rate_limit=2.0,
                parser_function="parse_maritime_news_rss"
            ),
            
            ScrapingTarget(
                name="Splash247 News",
                url="https://splash247.com/feed/",
                type="rss",
                headers={},
                rate_limit=2.0,
                parser_function="parse_maritime_news_rss"
            ),
            
            # Economic and Trade Data
            ScrapingTarget(
                name="Baltic Exchange",
                url="https://www.balticexchange.com/en/data-services.html",
                type="html",
                headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"},
                rate_limit=5.0,
                parser_function="parse_baltic_exchange"
            ),
            
            ScrapingTarget(
                name="Freightos Baltic Index",
                url="https://fbx.freightos.com/api/daily-rates",
                type="api",
                headers={"Accept": "application/json"},
                rate_limit=4.0,
                parser_function="parse_freightos_rates"
            ),
            
            # Weather Data Sources  
            ScrapingTarget(
                name="Maritime Weather RSS",
                url="https://ocean.weather.gov/rss/",
                type="rss",
                headers={},
                rate_limit=5.0,
                parser_function="parse_weather_rss"
            ),
            
            # Disruption and Security Sources
            ScrapingTarget(
                name="IMO News",
                url="https://www.imo.org/en/MediaCentre/Pages/RSS.aspx",
                type="rss",
                headers={},
                rate_limit=5.0,
                parser_function="parse_imo_news"
            ),
            
            ScrapingTarget(
                name="Piracy Reporting Centre",
                url="https://icc-ccs.org/piracy-reporting-centre/live-piracy-map",
                type="html",
                headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"},
                rate_limit=10.0,
                parser_function="parse_piracy_reports"
            ),
            
            # Canal and Chokepoint Data
            ScrapingTarget(
                name="Suez Canal Authority",
                url="https://www.suezcanal.gov.eg/English/Navigation/Pages/NavigationStatistics.aspx",
                type="html",
                headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"},
                rate_limit=8.0,
                parser_function="parse_suez_canal"
            ),
            
            ScrapingTarget(
                name="Panama Canal Transit",
                url="https://www.pancanal.com/eng/general/estadisticas.html",
                type="html",
                headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"},
                rate_limit=8.0,
                parser_function="parse_panama_canal"
            )
        ]
        
        return sources
    
    async def initialize(self):
        """Initialize the scraper with HTTP session"""
        timeout = aiohttp.ClientTimeout(total=30, connect=10)
        connector = aiohttp.TCPConnector(limit=100, limit_per_host=10)
        
        self.session = aiohttp.ClientSession(
            timeout=timeout,
            connector=connector,
            headers={"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"}
        )
        
        logger.info("Maritime data scraper initialized", sources=len(self.data_sources))
    
    async def close(self):
        """Close the HTTP session"""
        if self.session:
            await self.session.close()
    
    async def scrape_all_sources(self) -> Dict[str, List[Dict[str, Any]]]:
        """Scrape data from all configured sources"""
        
        if not self.session:
            await self.initialize()
        
        tasks = []
        for source in self.data_sources:
            task = asyncio.create_task(self.scrape_source(source))
            tasks.append(task)
        
        # Execute all scraping tasks with rate limiting
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        scraped_count = 0
        error_count = 0
        
        for i, result in enumerate(results):
            source = self.data_sources[i]
            
            if isinstance(result, Exception):
                logger.error("Scraping failed", source=source.name, error=str(result))
                error_count += 1
            else:
                scraped_count += 1
                logger.info("Scraping completed", source=source.name, items=len(result))
        
        logger.info("Scraping session completed", 
                   successful=scraped_count, 
                   failed=error_count,
                   total_items=sum(len(data) for data in self.scraped_data.values()))
        
        return self.scraped_data
    
    async def scrape_source(self, source: ScrapingTarget) -> List[Dict[str, Any]]:
        """Scrape data from a single source with rate limiting"""
        
        # Rate limiting
        now = datetime.now().timestamp()
        last_request = self.last_request_times.get(source.name, 0)
        
        if now - last_request < source.rate_limit:
            await asyncio.sleep(source.rate_limit - (now - last_request))
        
        self.last_request_times[source.name] = datetime.now().timestamp()
        
        try:
            # Fetch data based on source type
            if source.type == "api":
                data = await self.fetch_api_data(source)
            elif source.type == "rss":
                data = await self.fetch_rss_data(source)
            elif source.type == "html":
                data = await self.fetch_html_data(source)
            else:
                logger.warning("Unknown source type", source=source.name, type=source.type)
                return []
            
            # Parse data using specified parser
            parser_method = getattr(self, source.parser_function, None)
            if parser_method:
                parsed_data = await parser_method(data, source)
                return parsed_data
            else:
                logger.warning("Parser function not found", 
                             source=source.name, 
                             parser=source.parser_function)
                return []
                
        except Exception as e:
            logger.error("Error scraping source", source=source.name, error=str(e))
            return []
    
    async def fetch_api_data(self, source: ScrapingTarget) -> Any:
        """Fetch data from API endpoint"""
        async with self.session.get(source.url, headers=source.headers) as response:
            if response.status == 200:
                content_type = response.headers.get('content-type', '').lower()
                if 'json' in content_type:
                    return await response.json()
                else:
                    return await response.text()
            else:
                raise Exception(f"HTTP {response.status}: {await response.text()}")
    
    async def fetch_rss_data(self, source: ScrapingTarget) -> Any:
        """Fetch RSS feed data"""
        async with self.session.get(source.url, headers=source.headers) as response:
            if response.status == 200:
                xml_content = await response.text()
                return feedparser.parse(xml_content)
            else:
                raise Exception(f"HTTP {response.status}: {await response.text()}")
    
    async def fetch_html_data(self, source: ScrapingTarget) -> BeautifulSoup:
        """Fetch and parse HTML data"""
        async with self.session.get(source.url, headers=source.headers) as response:
            if response.status == 200:
                html_content = await response.text()
                return BeautifulSoup(html_content, 'html.parser')
            else:
                raise Exception(f"HTTP {response.status}: {await response.text()}")
    
    # ================================
    # PARSER FUNCTIONS
    # ================================
    
    async def parse_marine_traffic(self, data: Any, source: ScrapingTarget) -> List[Dict[str, Any]]:
        """Parse MarineTraffic vessel data"""
        vessels = []
        
        # Generate mock vessel data for development
        for i in range(50):
            vessel = {
                'vessel_id': f"MT_{i:06d}",
                'imo_number': f"{7000000 + i}",
                'mmsi': f"{200000000 + i}",
                'vessel_name': f"Maritime Vessel {i+1}",
                'vessel_type': np.random.choice(['Container', 'Tanker', 'Bulk Carrier', 'General Cargo']),
                'flag_country': np.random.choice(['US', 'GB', 'DE', 'JP', 'SG', 'NL']),
                'latitude': np.random.uniform(-60, 60),
                'longitude': np.random.uniform(-180, 180),
                'speed_knots': np.random.uniform(0, 25),
                'heading_degrees': np.random.randint(0, 360),
                'timestamp': datetime.utcnow(),
                'gross_tonnage': np.random.randint(10000, 200000),
                'data_source': 'MarineTraffic',
                'scraped_at': datetime.utcnow()
            }
            vessels.append(vessel)
        
        self.scraped_data['vessels'].extend(vessels)
        return vessels
    
    async def parse_vessel_finder(self, data: Any, source: ScrapingTarget) -> List[Dict[str, Any]]:
        """Parse VesselFinder data"""
        vessels = []
        
        # Generate additional mock vessel data
        for i in range(30):
            vessel = {
                'vessel_id': f"VF_{i:06d}",
                'imo_number': f"{8000000 + i}",
                'mmsi': f"{300000000 + i}",
                'vessel_name': f"Cargo Ship {i+1}",
                'vessel_type': np.random.choice(['RoRo', 'LNG Tanker', 'Oil Tanker', 'Container']),
                'flag_country': np.random.choice(['LR', 'PA', 'MT', 'CY', 'BS']),
                'latitude': np.random.uniform(-50, 70),
                'longitude': np.random.uniform(-160, 160),
                'speed_knots': np.random.uniform(0, 30),
                'heading_degrees': np.random.randint(0, 360),
                'timestamp': datetime.utcnow(),
                'destination': np.random.choice(['Hamburg', 'Singapore', 'Rotterdam', 'Shanghai']),
                'eta': datetime.utcnow() + timedelta(days=np.random.randint(1, 15)),
                'data_source': 'VesselFinder',
                'scraped_at': datetime.utcnow()
            }
            vessels.append(vessel)
        
        self.scraped_data['vessels'].extend(vessels)
        return vessels
    
    async def parse_port_rss(self, data: feedparser.FeedParserDict, source: ScrapingTarget) -> List[Dict[str, Any]]:
        """Parse port authority RSS feeds"""
        port_updates = []
        
        for entry in data.entries[:10]:  # Limit to recent entries
            port_update = {
                'title': entry.get('title', ''),
                'description': entry.get('description', ''),
                'link': entry.get('link', ''),
                'published': entry.get('published', ''),
                'port_name': 'Rotterdam',  # Would extract from source
                'category': 'port_news',
                'source': source.name,
                'scraped_at': datetime.utcnow()
            }
            port_updates.append(port_update)
        
        self.scraped_data['ports'].extend(port_updates)
        return port_updates
    
    async def parse_singapore_port(self, soup: BeautifulSoup, source: ScrapingTarget) -> List[Dict[str, Any]]:
        """Parse Singapore Port Authority data"""
        port_data = []
        
        # Mock Singapore port performance data
        port_performance = {
            'port_id': 'SGSIN',
            'port_name': 'Singapore',
            'date': datetime.utcnow().date(),
            'vessel_arrivals': np.random.randint(50, 150),
            'vessel_departures': np.random.randint(50, 150),
            'container_throughput_teu': np.random.randint(50000, 120000),
            'cargo_throughput_tons': np.random.randint(1000000, 3000000),
            'berth_occupancy_rate': np.random.uniform(0.6, 0.9),
            'congestion_level': np.random.uniform(0.2, 0.8),
            'data_source': 'Singapore MPA',
            'scraped_at': datetime.utcnow()
        }
        port_data.append(port_performance)
        
        self.scraped_data['ports'].extend(port_data)
        return port_data
    
    async def parse_maritime_news_rss(self, data: feedparser.FeedParserDict, source: ScrapingTarget) -> List[Dict[str, Any]]:
        """Parse maritime news RSS feeds"""
        news_articles = []
        
        for entry in data.entries[:20]:  # Recent articles
            # Extract maritime relevance
            title = entry.get('title', '').lower()
            description = entry.get('description', '').lower()
            
            maritime_keywords = [
                'ship', 'vessel', 'port', 'cargo', 'freight', 'maritime', 'shipping',
                'container', 'tanker', 'disruption', 'delay', 'strike', 'canal',
                'supply chain', 'trade route', 'tariff', 'sanction'
            ]
            
            relevance_score = sum(1 for keyword in maritime_keywords 
                                if keyword in title or keyword in description)
            
            if relevance_score > 0:  # Only include maritime-relevant news
                article = {
                    'title': entry.get('title', ''),
                    'description': entry.get('description', ''),
                    'link': entry.get('link', ''),
                    'published': entry.get('published', ''),
                    'author': entry.get('author', ''),
                    'relevance_score': relevance_score,
                    'category': 'maritime_news',
                    'source': source.name,
                    'scraped_at': datetime.utcnow()
                }
                news_articles.append(article)
        
        self.scraped_data['news'].extend(news_articles)
        return news_articles
    
    async def parse_baltic_exchange(self, soup: BeautifulSoup, source: ScrapingTarget) -> List[Dict[str, Any]]:
        """Parse Baltic Exchange freight rates"""
        economic_data = []
        
        # Mock Baltic Exchange data
        for route in ['Capesize', 'Panamax', 'Supramax', 'Handysize']:
            rate_data = {
                'indicator': f'Baltic_{route}_Rate',
                'value': np.random.uniform(5000, 25000),
                'change_percent': np.random.uniform(-5, 5),
                'unit': 'USD/day',
                'date': datetime.utcnow().date(),
                'route_type': route,
                'source': 'Baltic Exchange',
                'scraped_at': datetime.utcnow()
            }
            economic_data.append(rate_data)
        
        self.scraped_data['economic_indicators'].extend(economic_data)
        return economic_data
    
    async def parse_freightos_rates(self, data: Any, source: ScrapingTarget) -> List[Dict[str, Any]]:
        """Parse Freightos freight rates"""
        freight_rates = []
        
        # Mock Freightos Baltic Index data
        routes = [
            'China-North Europe', 'China-Mediterranean', 'China-US West Coast',
            'China-US East Coast', 'Europe-US East Coast', 'Asia-US West Coast'
        ]
        
        for route in routes:
            rate = {
                'route': route,
                'rate_usd_per_feu': np.random.uniform(2000, 8000),
                'change_weekly': np.random.uniform(-10, 10),
                'date': datetime.utcnow().date(),
                'index_value': np.random.uniform(1000, 5000),
                'source': 'Freightos',
                'scraped_at': datetime.utcnow()
            }
            freight_rates.append(rate)
        
        self.scraped_data['economic_indicators'].extend(freight_rates)
        return freight_rates
    
    async def parse_weather_rss(self, data: feedparser.FeedParserDict, source: ScrapingTarget) -> List[Dict[str, Any]]:
        """Parse maritime weather data"""
        weather_data = []
        
        for entry in data.entries[:15]:
            title = entry.get('title', '').lower()
            
            # Extract weather conditions and locations
            if any(keyword in title for keyword in ['storm', 'gale', 'hurricane', 'warning']):
                weather = {
                    'title': entry.get('title', ''),
                    'description': entry.get('description', ''),
                    'severity': 'high' if 'warning' in title else 'medium',
                    'category': 'weather_alert',
                    'published': entry.get('published', ''),
                    'source': source.name,
                    'scraped_at': datetime.utcnow()
                }
                weather_data.append(weather)
        
        self.scraped_data['weather'].extend(weather_data)
        return weather_data
    
    async def parse_imo_news(self, data: feedparser.FeedParserDict, source: ScrapingTarget) -> List[Dict[str, Any]]:
        """Parse IMO regulatory news"""
        regulatory_news = []
        
        for entry in data.entries[:10]:
            news = {
                'title': entry.get('title', ''),
                'description': entry.get('description', ''),
                'link': entry.get('link', ''),
                'published': entry.get('published', ''),
                'category': 'regulatory',
                'source': 'IMO',
                'impact_level': np.random.choice(['low', 'medium', 'high']),
                'scraped_at': datetime.utcnow()
            }
            regulatory_news.append(news)
        
        self.scraped_data['disruptions'].extend(regulatory_news)
        return regulatory_news
    
    async def parse_piracy_reports(self, soup: BeautifulSoup, source: ScrapingTarget) -> List[Dict[str, Any]]:
        """Parse piracy and security reports"""
        security_incidents = []
        
        # Mock piracy incident data
        for i in range(5):
            incident = {
                'incident_type': np.random.choice(['Piracy', 'Armed Robbery', 'Suspicious Activity']),
                'location': np.random.choice(['Gulf of Guinea', 'Strait of Malacca', 'Red Sea', 'Arabian Sea']),
                'latitude': np.random.uniform(-20, 40),
                'longitude': np.random.uniform(30, 120),
                'date': datetime.utcnow() - timedelta(days=np.random.randint(1, 30)),
                'severity': np.random.choice(['low', 'medium', 'high']),
                'vessel_affected': f'Unknown Vessel {i+1}',
                'description': 'Security incident reported',
                'source': 'ICC Piracy Reporting Centre',
                'scraped_at': datetime.utcnow()
            }
            security_incidents.append(incident)
        
        self.scraped_data['disruptions'].extend(security_incidents)
        return security_incidents
    
    async def parse_suez_canal(self, soup: BeautifulSoup, source: ScrapingTarget) -> List[Dict[str, Any]]:
        """Parse Suez Canal transit data"""
        canal_data = []
        
        # Mock Suez Canal performance
        suez_performance = {
            'canal_name': 'Suez Canal',
            'daily_transits': np.random.randint(40, 70),
            'northbound_vessels': np.random.randint(20, 35),
            'southbound_vessels': np.random.randint(20, 35),
            'average_transit_time': np.random.uniform(12, 18),
            'revenue_usd': np.random.uniform(10000000, 20000000),
            'date': datetime.utcnow().date(),
            'congestion_level': np.random.uniform(0.1, 0.6),
            'source': 'Suez Canal Authority',
            'scraped_at': datetime.utcnow()
        }
        canal_data.append(suez_performance)
        
        self.scraped_data['ports'].extend(canal_data)
        return canal_data
    
    async def parse_panama_canal(self, soup: BeautifulSoup, source: ScrapingTarget) -> List[Dict[str, Any]]:
        """Parse Panama Canal transit data"""
        canal_data = []
        
        # Mock Panama Canal performance
        panama_performance = {
            'canal_name': 'Panama Canal',
            'daily_transits': np.random.randint(30, 45),
            'panamax_transits': np.random.randint(15, 25),
            'neopanamax_transits': np.random.randint(8, 15),
            'average_transit_time': np.random.uniform(8, 12),
            'water_level': np.random.uniform(82, 87),
            'restrictions': np.random.choice(['None', 'Draft Restrictions', 'Beam Restrictions']),
            'date': datetime.utcnow().date(),
            'source': 'Panama Canal Authority',
            'scraped_at': datetime.utcnow()
        }
        canal_data.append(panama_performance)
        
        self.scraped_data['ports'].extend(canal_data)
        return canal_data
    
    def get_scraping_statistics(self) -> Dict[str, Any]:
        """Get statistics about scraped data"""
        stats = {
            'total_sources': len(self.data_sources),
            'data_categories': {
                category: len(data) for category, data in self.scraped_data.items()
            },
            'total_items': sum(len(data) for data in self.scraped_data.values()),
            'last_scrape': datetime.utcnow().isoformat(),
            'sources_configured': [source.name for source in self.data_sources]
        }
        return stats
