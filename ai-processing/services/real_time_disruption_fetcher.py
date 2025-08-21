"""
Real-time Maritime Disruption Data Fetcher
Fetches current maritime incidents from multiple real-world sources
"""

import asyncio
import aiohttp
import json
import logging
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from bs4 import BeautifulSoup
import time
from dataclasses import dataclass
import httpx
from urllib.parse import urljoin, urlparse

logger = logging.getLogger(__name__)

@dataclass
class MaritimeDisruption:
    incident_id: str
    title: str
    description: str
    location: dict  # {"lat": float, "lng": float, "name": str}
    severity: str  # low, medium, high, critical
    incident_type: str  # port_closure, weather, accident, security, etc.
    start_date: datetime
    end_date: Optional[datetime]
    affected_vessels: Optional[int]
    economic_impact: Optional[int]
    source: str
    source_url: str
    confidence_score: float
    last_updated: datetime

class RealTimeDisruptionFetcher:
    def __init__(self):
        self.session = None
        self.cache = {}
        self.cache_ttl = 600  # 10 minutes cache
        
        # Maritime news and incident sources
        self.sources = {
            'maritime_executive': 'https://www.maritime-executive.com/',
            'lloyd_list': 'https://lloydslist.maritimeintelligence.informa.com/',
            'splash247': 'https://splash247.com/',
            'ship_technology': 'https://www.ship-technology.com/',
            'maritime_journal': 'https://www.maritimejournal.com/',
            'trade_winds': 'https://www.tradewindsnews.com/',
            'gcaptain': 'https://gcaptain.com/',
            'vessel_finder_news': 'https://www.vesselfinder.com/news'
        }
        
        # Search terms for maritime disruptions
        self.disruption_keywords = [
            'port closure', 'port strike', 'port congestion', 'canal blocked', 'canal closure',
            'shipping disruption', 'vessel accident', 'container shortage', 'supply chain',
            'maritime incident', 'ship collision', 'grounding', 'port labor', 'dock strike',
            'typhoon shipping', 'hurricane port', 'storm maritime', 'weather delay',
            'cyber attack port', 'security threat', 'piracy', 'naval blockade',
            'suez canal', 'panama canal', 'strait of hormuz', 'malacca strait',
            'container terminal', 'cargo delay', 'freight disruption', 'trade route',
            'vessel detention', 'port authority', 'maritime emergency', 'ship fire',
            'oil spill', 'environmental incident', 'coast guard', 'maritime rescue'
        ]
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=15),
            headers={
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def fetch_current_disruptions(self) -> List[MaritimeDisruption]:
        """Fetch current maritime disruptions from multiple sources"""
        
        # Check cache first
        cached_data = self._get_cached_disruptions()
        if cached_data:
            logger.info(f"Returning {len(cached_data)} cached disruptions")
            return cached_data
        
        all_disruptions = []
        
        # Fetch from multiple sources in parallel
        fetch_tasks = [
            self._fetch_from_maritime_executive(),
            self._fetch_from_gcaptain(),
            self._fetch_from_splash247(),
            self._fetch_from_vessel_finder(),
            self._fetch_from_rss_feeds(),
        ]
        
        results = await asyncio.gather(*fetch_tasks, return_exceptions=True)
        
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.warning(f"Source {i} failed: {result}")
                continue
            if result:
                all_disruptions.extend(result)
        
        # Remove duplicates and sort by severity
        unique_disruptions = self._deduplicate_disruptions(all_disruptions)
        sorted_disruptions = sorted(unique_disruptions, key=lambda x: self._severity_weight(x.severity), reverse=True)
        
        # Cache the results
        self._cache_disruptions(sorted_disruptions)
        
        logger.info(f"Fetched {len(sorted_disruptions)} unique maritime disruptions")
        return sorted_disruptions
    
    async def _fetch_from_maritime_executive(self) -> List[MaritimeDisruption]:
        """Scrape maritime disruptions from The Maritime Executive"""
        disruptions = []
        try:
            url = "https://www.maritime-executive.com/search?q=disruption+port+shipping"
            async with self.session.get(url) as response:
                if response.status != 200:
                    return disruptions
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Find article elements
                articles = soup.find_all('article') or soup.find_all('div', class_=['article', 'news-item'])
                
                for article in articles[:10]:  # Limit to recent articles
                    try:
                        title_elem = article.find(['h1', 'h2', 'h3']) or article.find('a')
                        if not title_elem:
                            continue
                        
                        title = title_elem.get_text(strip=True)
                        
                        # Check if title contains disruption keywords
                        if not any(keyword.lower() in title.lower() for keyword in self.disruption_keywords):
                            continue
                        
                        # Extract link
                        link_elem = title_elem if title_elem.name == 'a' else title_elem.find('a')
                        article_url = ""
                        if link_elem and link_elem.get('href'):
                            article_url = urljoin(url, link_elem['href'])
                        
                        # Extract description
                        desc_elem = article.find(['p', 'div'], class_=['summary', 'excerpt', 'description'])
                        description = desc_elem.get_text(strip=True)[:200] if desc_elem else ""
                        
                        # Determine incident type and severity from title/description
                        incident_type = self._classify_incident_type(title + " " + description)
                        severity = self._determine_severity(title + " " + description)
                        
                        # Extract location information
                        location = self._extract_location_from_text(title + " " + description)
                        
                        disruption = MaritimeDisruption(
                            incident_id=f"ME_{hash(title)}_{int(time.time())}",
                            title=title,
                            description=description,
                            location=location,
                            severity=severity,
                            incident_type=incident_type,
                            start_date=datetime.now(),
                            end_date=None,
                            affected_vessels=self._estimate_affected_vessels(title + " " + description),
                            economic_impact=None,
                            source="maritime_executive",
                            source_url=article_url,
                            confidence_score=0.75,
                            last_updated=datetime.now()
                        )
                        
                        disruptions.append(disruption)
                        
                    except Exception as e:
                        logger.warning(f"Error processing Maritime Executive article: {e}")
                        continue
                        
        except Exception as e:
            logger.error(f"Error fetching from Maritime Executive: {e}")
        
        return disruptions
    
    async def _fetch_from_gcaptain(self) -> List[MaritimeDisruption]:
        """Scrape maritime disruptions from gCaptain"""
        disruptions = []
        try:
            url = "https://gcaptain.com/"
            async with self.session.get(url) as response:
                if response.status != 200:
                    return disruptions
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Find news articles
                articles = soup.find_all(['article', 'div'], class_=['post', 'entry', 'news'])
                
                for article in articles[:15]:
                    try:
                        title_elem = article.find(['h1', 'h2', 'h3', 'h4'])
                        if not title_elem:
                            continue
                        
                        title = title_elem.get_text(strip=True)
                        
                        # Check for disruption-related content
                        if not any(keyword.lower() in title.lower() for keyword in self.disruption_keywords):
                            continue
                        
                        # Get article URL
                        link_elem = title_elem.find('a') or article.find('a')
                        article_url = ""
                        if link_elem and link_elem.get('href'):
                            article_url = urljoin(url, link_elem['href'])
                        
                        # Extract summary
                        summary_elem = article.find(['p', 'div'], class_=['excerpt', 'summary'])
                        description = summary_elem.get_text(strip=True)[:200] if summary_elem else ""
                        
                        incident_type = self._classify_incident_type(title + " " + description)
                        severity = self._determine_severity(title + " " + description)
                        location = self._extract_location_from_text(title + " " + description)
                        
                        disruption = MaritimeDisruption(
                            incident_id=f"GC_{hash(title)}_{int(time.time())}",
                            title=title,
                            description=description,
                            location=location,
                            severity=severity,
                            incident_type=incident_type,
                            start_date=datetime.now(),
                            end_date=None,
                            affected_vessels=self._estimate_affected_vessels(title + " " + description),
                            economic_impact=None,
                            source="gcaptain",
                            source_url=article_url,
                            confidence_score=0.80,
                            last_updated=datetime.now()
                        )
                        
                        disruptions.append(disruption)
                        
                    except Exception as e:
                        logger.warning(f"Error processing gCaptain article: {e}")
                        continue
                        
        except Exception as e:
            logger.error(f"Error fetching from gCaptain: {e}")
        
        return disruptions
    
    async def _fetch_from_splash247(self) -> List[MaritimeDisruption]:
        """Scrape maritime disruptions from Splash247"""
        disruptions = []
        try:
            url = "https://splash247.com/"
            async with self.session.get(url) as response:
                if response.status != 200:
                    return disruptions
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Find article headlines
                articles = soup.find_all(['h2', 'h3'], class_=['entry-title', 'headline', 'title'])
                
                for article in articles[:12]:
                    try:
                        title = article.get_text(strip=True)
                        
                        if not any(keyword.lower() in title.lower() for keyword in self.disruption_keywords):
                            continue
                        
                        # Get article link
                        link_elem = article.find('a')
                        article_url = ""
                        if link_elem and link_elem.get('href'):
                            article_url = urljoin(url, link_elem['href'])
                        
                        incident_type = self._classify_incident_type(title)
                        severity = self._determine_severity(title)
                        location = self._extract_location_from_text(title)
                        
                        disruption = MaritimeDisruption(
                            incident_id=f"SP_{hash(title)}_{int(time.time())}",
                            title=title,
                            description="",
                            location=location,
                            severity=severity,
                            incident_type=incident_type,
                            start_date=datetime.now(),
                            end_date=None,
                            affected_vessels=self._estimate_affected_vessels(title),
                            economic_impact=None,
                            source="splash247",
                            source_url=article_url,
                            confidence_score=0.70,
                            last_updated=datetime.now()
                        )
                        
                        disruptions.append(disruption)
                        
                    except Exception as e:
                        logger.warning(f"Error processing Splash247 article: {e}")
                        continue
                        
        except Exception as e:
            logger.error(f"Error fetching from Splash247: {e}")
        
        return disruptions
    
    async def _fetch_from_vessel_finder(self) -> List[MaritimeDisruption]:
        """Scrape maritime news from VesselFinder"""
        disruptions = []
        try:
            url = "https://www.vesselfinder.com/news"
            async with self.session.get(url) as response:
                if response.status != 200:
                    return disruptions
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Find news items
                news_items = soup.find_all(['div', 'article'], class_=['news-item', 'article'])
                
                for item in news_items[:10]:
                    try:
                        title_elem = item.find(['h2', 'h3', 'h4'])
                        if not title_elem:
                            continue
                        
                        title = title_elem.get_text(strip=True)
                        
                        if not any(keyword.lower() in title.lower() for keyword in self.disruption_keywords):
                            continue
                        
                        link_elem = title_elem.find('a') or item.find('a')
                        article_url = ""
                        if link_elem and link_elem.get('href'):
                            article_url = urljoin(url, link_elem['href'])
                        
                        # Get description
                        desc_elem = item.find(['p', 'div'], class_=['summary', 'description'])
                        description = desc_elem.get_text(strip=True)[:200] if desc_elem else ""
                        
                        incident_type = self._classify_incident_type(title + " " + description)
                        severity = self._determine_severity(title + " " + description)
                        location = self._extract_location_from_text(title + " " + description)
                        
                        disruption = MaritimeDisruption(
                            incident_id=f"VF_{hash(title)}_{int(time.time())}",
                            title=title,
                            description=description,
                            location=location,
                            severity=severity,
                            incident_type=incident_type,
                            start_date=datetime.now(),
                            end_date=None,
                            affected_vessels=self._estimate_affected_vessels(title + " " + description),
                            economic_impact=None,
                            source="vesselfinder",
                            source_url=article_url,
                            confidence_score=0.72,
                            last_updated=datetime.now()
                        )
                        
                        disruptions.append(disruption)
                        
                    except Exception as e:
                        logger.warning(f"Error processing VesselFinder article: {e}")
                        continue
                        
        except Exception as e:
            logger.error(f"Error fetching from VesselFinder: {e}")
        
        return disruptions
    
    async def _fetch_from_rss_feeds(self) -> List[MaritimeDisruption]:
        """Fetch from maritime RSS feeds"""
        disruptions = []
        
        rss_feeds = [
            'https://www.maritime-executive.com/rss.xml',
            'https://gcaptain.com/feed/',
            'https://splash247.com/feed/',
        ]
        
        for feed_url in rss_feeds:
            try:
                async with self.session.get(feed_url) as response:
                    if response.status != 200:
                        continue
                    
                    content = await response.text()
                    # Simple RSS parsing - in production, use proper XML parser
                    
                    # Extract titles between <title> tags
                    title_matches = re.findall(r'<title><!\[CDATA\[(.*?)\]\]></title>', content)
                    if not title_matches:
                        title_matches = re.findall(r'<title>(.*?)</title>', content)
                    
                    # Extract descriptions
                    desc_matches = re.findall(r'<description><!\[CDATA\[(.*?)\]\]></description>', content)
                    if not desc_matches:
                        desc_matches = re.findall(r'<description>(.*?)</description>', content)
                    
                    for i, title in enumerate(title_matches[:10]):
                        if not any(keyword.lower() in title.lower() for keyword in self.disruption_keywords):
                            continue
                        
                        description = desc_matches[i] if i < len(desc_matches) else ""
                        description = re.sub(r'<[^>]+>', '', description)[:200]  # Strip HTML tags
                        
                        incident_type = self._classify_incident_type(title + " " + description)
                        severity = self._determine_severity(title + " " + description)
                        location = self._extract_location_from_text(title + " " + description)
                        
                        disruption = MaritimeDisruption(
                            incident_id=f"RSS_{hash(title)}_{int(time.time())}",
                            title=title,
                            description=description,
                            location=location,
                            severity=severity,
                            incident_type=incident_type,
                            start_date=datetime.now(),
                            end_date=None,
                            affected_vessels=self._estimate_affected_vessels(title + " " + description),
                            economic_impact=None,
                            source="rss_feed",
                            source_url=feed_url,
                            confidence_score=0.65,
                            last_updated=datetime.now()
                        )
                        
                        disruptions.append(disruption)
                        
            except Exception as e:
                logger.warning(f"Error fetching RSS feed {feed_url}: {e}")
                continue
        
        return disruptions
    
    def _classify_incident_type(self, text: str) -> str:
        """Classify incident type based on text content"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['strike', 'labor', 'union', 'worker']):
            return 'labor_disruption'
        elif any(word in text_lower for word in ['storm', 'hurricane', 'typhoon', 'weather', 'wind']):
            return 'weather_extreme'
        elif any(word in text_lower for word in ['cyber', 'hack', 'malware', 'security breach']):
            return 'cyber_security'
        elif any(word in text_lower for word in ['collision', 'accident', 'grounding', 'fire', 'explosion']):
            return 'vessel_accident'
        elif any(word in text_lower for word in ['blockage', 'blocked', 'canal', 'closure']):
            return 'waterway_blockage'
        elif any(word in text_lower for word in ['congestion', 'delay', 'backlog']):
            return 'port_congestion'
        elif any(word in text_lower for word in ['piracy', 'attack', 'threat', 'security']):
            return 'security_threat'
        elif any(word in text_lower for word in ['spill', 'pollution', 'environmental']):
            return 'environmental_incident'
        else:
            return 'general_disruption'
    
    def _determine_severity(self, text: str) -> str:
        """Determine severity based on text content"""
        text_lower = text.lower()
        
        # Critical indicators
        if any(word in text_lower for word in ['emergency', 'critical', 'major', 'massive', 'catastrophic', 'severe']):
            return 'critical'
        # High severity indicators
        elif any(word in text_lower for word in ['significant', 'serious', 'substantial', 'widespread']):
            return 'high'
        # Medium severity indicators
        elif any(word in text_lower for word in ['moderate', 'partial', 'limited', 'temporary']):
            return 'medium'
        # Default to low
        else:
            return 'low'
    
    def _extract_location_from_text(self, text: str) -> dict:
        """Extract location information from text"""
        # Common maritime locations
        locations = {
            'suez canal': {'lat': 30.0131, 'lng': 32.5899, 'name': 'Suez Canal'},
            'panama canal': {'lat': 9.0820, 'lng': -79.6821, 'name': 'Panama Canal'},
            'strait of hormuz': {'lat': 26.5669, 'lng': 56.2497, 'name': 'Strait of Hormuz'},
            'malacca strait': {'lat': 4.0, 'lng': 100.0, 'name': 'Malacca Strait'},
            'singapore': {'lat': 1.2644, 'lng': 103.8315, 'name': 'Singapore'},
            'rotterdam': {'lat': 51.9225, 'lng': 4.47917, 'name': 'Rotterdam'},
            'shanghai': {'lat': 31.2304, 'lng': 121.4737, 'name': 'Shanghai'},
            'los angeles': {'lat': 33.7361, 'lng': -118.2639, 'name': 'Los Angeles'},
            'long beach': {'lat': 33.7701, 'lng': -118.1937, 'name': 'Long Beach'},
            'hong kong': {'lat': 22.3193, 'lng': 114.1694, 'name': 'Hong Kong'},
            'dubai': {'lat': 25.2048, 'lng': 55.2708, 'name': 'Dubai'},
            'hamburg': {'lat': 53.5511, 'lng': 9.9937, 'name': 'Hamburg'},
            'antwerp': {'lat': 51.2194, 'lng': 4.4025, 'name': 'Antwerp'},
        }
        
        text_lower = text.lower()
        for location_name, coords in locations.items():
            if location_name in text_lower:
                return coords
        
        # Default unknown location
        return {'lat': 0.0, 'lng': 0.0, 'name': 'Unknown'}
    
    def _estimate_affected_vessels(self, text: str) -> Optional[int]:
        """Estimate number of affected vessels from text"""
        text_lower = text.lower()
        
        # Look for specific numbers
        vessel_numbers = re.findall(r'(\d+)\s*(?:vessels?|ships?)', text_lower)
        if vessel_numbers:
            return int(vessel_numbers[0])
        
        # Estimate based on severity words
        if any(word in text_lower for word in ['hundreds', 'massive', 'major']):
            return 200
        elif any(word in text_lower for word in ['dozens', 'many', 'multiple']):
            return 50
        elif any(word in text_lower for word in ['several', 'few']):
            return 10
        
        return None
    
    def _deduplicate_disruptions(self, disruptions: List[MaritimeDisruption]) -> List[MaritimeDisruption]:
        """Remove duplicate disruptions based on title similarity"""
        unique_disruptions = []
        seen_titles = set()
        
        for disruption in disruptions:
            # Create a normalized title for comparison
            normalized_title = re.sub(r'[^\w\s]', '', disruption.title.lower())
            
            # Check for similarity with existing titles
            is_duplicate = False
            for seen_title in seen_titles:
                if self._calculate_similarity(normalized_title, seen_title) > 0.8:
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                unique_disruptions.append(disruption)
                seen_titles.add(normalized_title)
        
        return unique_disruptions
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate simple text similarity"""
        words1 = set(text1.split())
        words2 = set(text2.split())
        
        if not words1 and not words2:
            return 1.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0
    
    def _severity_weight(self, severity: str) -> int:
        """Convert severity to numeric weight for sorting"""
        weights = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}
        return weights.get(severity, 1)
    
    def _get_cached_disruptions(self) -> Optional[List[MaritimeDisruption]]:
        """Get cached disruption data if still valid"""
        if 'disruptions' in self.cache:
            cached_data, timestamp = self.cache['disruptions']
            if time.time() - timestamp < self.cache_ttl:
                return cached_data
        return None
    
    def _cache_disruptions(self, disruptions: List[MaritimeDisruption]):
        """Cache disruption data"""
        self.cache['disruptions'] = (disruptions, time.time())

# Usage functions
async def get_current_maritime_disruptions() -> List[MaritimeDisruption]:
    """Convenience function to get current maritime disruptions"""
    async with RealTimeDisruptionFetcher() as fetcher:
        return await fetcher.fetch_current_disruptions()

# Test the fetcher
if __name__ == "__main__":
    async def test_disruption_fetcher():
        print("Testing Real-time Maritime Disruption Fetcher...")
        
        async with RealTimeDisruptionFetcher() as fetcher:
            disruptions = await fetcher.fetch_current_disruptions()
            
            print(f"✅ Successfully fetched {len(disruptions)} maritime disruptions:")
            
            for i, disruption in enumerate(disruptions[:5], 1):
                print(f"\n{i}. {disruption.title}")
                print(f"   Type: {disruption.incident_type}")
                print(f"   Severity: {disruption.severity}")
                print(f"   Location: {disruption.location['name']}")
                print(f"   Source: {disruption.source}")
                if disruption.affected_vessels:
                    print(f"   Affected Vessels: {disruption.affected_vessels}")
    
    asyncio.run(test_disruption_fetcher())
