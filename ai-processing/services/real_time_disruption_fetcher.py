"""
Real-time maritime disruption fetcher using existing frontend APIs
Integrates with news APIs and RSS feeds to get live disruption data
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# News API endpoints and configurations
API_ENDPOINTS = {
    'newsapi': 'https://newsapi.org/v2/everything',
    'rss_feeds': {
        'reuters': 'https://www.reuters.com/business/aerospace-defense/rss',
        'maritime_executive': 'https://www.maritime-executive.com/rss.xml',
        'trade_winds': 'https://www.tradewindsnews.com/rss'
    }
}

# CORS proxies for handling cross-origin requests
CORS_PROXIES = [
    'https://api.allorigins.win/get?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest='
]

async def get_real_time_disruptions(limit: int = 20) -> List[Dict[str, Any]]:
    """
    Fetch real-time maritime disruptions from news APIs and RSS feeds
    Returns list of disruption dictionaries with proper coordinates
    """
    logger.info("Starting real-time disruption fetch from external APIs...")
    
    disruptions = []
    
    # Comprehensive maritime search terms
    search_terms = [
        # Core maritime incidents
        "maritime disruption", "shipping delay", "port strike", "suez canal", "panama canal",
        "red sea shipping", "container ship", "supply chain disruption", "maritime security",
        "port congestion", "vessel breakdown", "cargo delay", "terminal closure",
        
        # Specific waterways and ports
        "strait of hormuz", "singapore port", "los angeles port", "hamburg port", 
        "rotterdam port", "shanghai port", "long beach port", "felixstowe port",
        "gulf of aden", "strait of malacca", "english channel", "bosphorus strait",
        
        # Maritime incidents
        "ship collision", "vessel grounding", "port accident", "dock workers strike",
        "maritime terrorism", "piracy attack", "coast guard", "customs inspection",
        "oil spill", "container ship fire", "cargo contamination", "anchor dragging"
    ]
    
    try:
        # Fetch from RSS feeds and free sources (no API keys required)
        headers = {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=15), headers=headers) as session:
            tasks = []
            
            # Fetch from RSS feeds (verified working URLs)
            rss_feeds = {
                'splash247': 'https://splash247.com/feed/',
                'gCaptain': 'https://gcaptain.com/feed/',
                'maritime_professional': 'https://www.maritimeprofessional.com/rss/news/',
                'world_maritime_news': 'https://worldmaritimenews.com/feed/',
                'safety4sea': 'https://safety4sea.com/feed/'
            }
            
            for source, rss_url in rss_feeds.items():
                task = fetch_rss_disruptions(session, source, rss_url)
                tasks.append(task)
            
            # Execute all RSS fetches concurrently
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            for result in results:
                if isinstance(result, list):
                    disruptions.extend(result)
                elif isinstance(result, Exception):
                    logger.warning(f"RSS fetch failed: {result}")
                    
                # Limit total disruptions to avoid overwhelming the system
                if len(disruptions) >= limit:
                    break
            
            # Remove duplicates and sort by confidence/severity
            disruptions = remove_duplicates(disruptions)
            disruptions = sorted(disruptions, key=lambda x: (
                severity_score(x.get('severity', 'low')),
                x.get('confidence', 0)
            ), reverse=True)
            
            # NO FALLBACK TO MOCK DATA - only real RSS feed results
            logger.info(f"Found {len(disruptions)} disruptions from real RSS feeds only")
            
            logger.info(f"Successfully fetched {len(disruptions)} real-time disruptions from RSS feeds")
            return disruptions[:limit]
            
    except Exception as e:
        logger.error(f"Error fetching real-time disruptions: {e}")
        return []

async def fetch_news_for_term(session: aiohttp.ClientSession, search_term: str) -> List[Dict[str, Any]]:
    """Fetch news articles for a specific maritime search term"""
    disruptions = []
    
    try:
        # Try NewsAPI first
        url = f"{API_ENDPOINTS['newsapi']}?q={search_term}&language=en&sortBy=publishedAt&pageSize=5"
        
        # Try direct fetch first, then CORS proxies
        response = None
        
        try:
            async with session.get(url) as resp:
                if resp.status == 200:
                    response = resp
        except Exception:
            # Try CORS proxies
            for proxy in CORS_PROXIES[:2]:  # Limit proxy attempts
                try:
                    proxy_url = proxy + url
                    async with session.get(proxy_url) as resp:
                        if resp.status == 200:
                            response = resp
                            break
                except Exception:
                    continue
        
        if response:
            data = await response.json()
            articles = data.get('articles', [])
            
            for article in articles:
                if is_maritime_relevant(article.get('title', '') + ' ' + article.get('description', '')):
                    disruption = convert_article_to_disruption(article, search_term)
                    if disruption:
                        disruptions.append(disruption)
                        
    except Exception as e:
        logger.warning(f"Failed to fetch news for term '{search_term}': {e}")
    
    return disruptions

async def fetch_rss_disruptions(session: aiohttp.ClientSession, source: str, rss_url: str) -> List[Dict[str, Any]]:
    """Fetch maritime disruptions from RSS feeds"""
    disruptions = []
    
    try:
        logger.info(f"Fetching RSS from {source}: {rss_url}")
        async with session.get(rss_url) as response:
            if response.status == 200:
                content = await response.text()
                logger.info(f"Successfully fetched RSS content from {source}, length: {len(content)}")
                
                # Parse RSS feed
                from xml.etree import ElementTree as ET
                try:
                    root = ET.fromstring(content)
                    
                    # Handle different RSS formats
                    items = root.findall('.//item') or root.findall('.//{http://www.w3.org/2005/Atom}entry')
                    logger.info(f"Found {len(items)} items in RSS feed from {source}")
                    
                    for item in items[:10]:  # Limit to 10 items per feed
                        title = ""
                        description = ""
                        pub_date = ""
                        link = ""
                        
                        # Extract RSS item data with better handling
                        title_elem = item.find('title')
                        if title_elem is not None and title_elem.text:
                            title = title_elem.text.strip()
                            # Clean up CDATA if present
                            if title.startswith('<![CDATA[') and title.endswith(']]>'):
                                title = title[9:-3].strip()
                        
                        desc_elem = item.find('description') 
                        if desc_elem is not None and desc_elem.text:
                            description = desc_elem.text.strip()
                            # Clean up CDATA if present
                            if description.startswith('<![CDATA[') and description.endswith(']]>'):
                                description = description[9:-3].strip()
                            # Strip HTML tags for better text matching
                            import re
                            description = re.sub(r'<[^>]+>', '', description)
                            description = re.sub(r'\s+', ' ', description).strip()
                        else:
                            # Try content:encoded or other fields
                            content_elem = item.find('.//{http://purl.org/rss/1.0/modules/content/}encoded')
                            if content_elem is not None and content_elem.text:
                                description = content_elem.text.strip()
                                import re
                                description = re.sub(r'<[^>]+>', '', description)
                                description = re.sub(r'\s+', ' ', description).strip()[:300]
                        
                        link_elem = item.find('link') or item.find('.//{http://www.w3.org/2005/Atom}link')
                        if link_elem is not None:
                            link = link_elem.text if hasattr(link_elem, 'text') else link_elem.get('href', '')
                        
                        pub_elem = item.find('pubDate') or item.find('.//{http://www.w3.org/2005/Atom}published')
                        if pub_elem is not None:
                            pub_date = pub_elem.text or ""
                        
                        # Check if maritime relevant
                        combined_text = f"{title} {description}"
                        logger.info(f"Processing article: '{title}' | Desc: '{description[:100]}...'")
                        if is_maritime_relevant(combined_text):
                            logger.info(f"Found maritime relevant article: {title}")
                            # Create disruption from RSS item
                            disruption = {
                                'id': f"rss_{source}_{hash(title)%100000}",
                                'title': title[:100],  # Limit title length
                                'description': description[:300] if description else title,
                                'severity': infer_severity(combined_text),
                                'status': 'active',
                                'coordinates': infer_coordinates(combined_text),
                                'affected_regions': infer_regions(combined_text),
                                'sources': [{
                                    'name': source.replace('_', ' ').title(),
                                    'url': link,
                                    'reliability': 'medium',
                                    'published_date': pub_date
                                }],
                                'confidence': calculate_confidence(combined_text, 1),  # Assume 1 day old
                                'last_updated': datetime.now().isoformat()
                            }
                            disruptions.append(disruption)
                            
                except ET.ParseError as e:
                    logger.warning(f"Failed to parse RSS from {source}: {e}")
                    
    except Exception as e:
        logger.warning(f"Failed to fetch RSS from {source}: {e}")
    
    return disruptions

def is_maritime_relevant(text: str) -> bool:
    """Check if article text is relevant to maritime operations"""
    text_lower = text.lower()
    
    # Exclude non-maritime topics
    exclude_keywords = [
        'meta', 'facebook', 'instagram', 'ai chat', 'artificial intelligence',
        'children', 'sensual', 'politics', 'election', 'celebrity', 'entertainment',
        'sports', 'cryptocurrency', 'bitcoin', 'gaming', 'healthcare', 'covid vaccine',
        'automobile', 'tesla', 'real estate', 'restaurant', 'retail'
    ]
    
    if any(keyword in text_lower for keyword in exclude_keywords):
        return False
    
    # Maritime-specific keywords (must have at least 2 matches)
    maritime_keywords = [
        'shipping', 'maritime', 'vessel', 'cargo ship', 'container ship', 'port',
        'harbor', 'terminal', 'dock', 'tanker', 'freight', 'supply chain',
        'suez canal', 'panama canal', 'strait', 'navigation', 'coast guard',
        'loading', 'unloading', 'berth', 'anchorage', 'pilot service',
        'bill of lading', 'manifest', 'customs', 'import', 'export'
    ]
    
    matches = sum(1 for keyword in maritime_keywords if keyword in text_lower)
    
    # Additional specific shipping/port terms
    specific_terms = [
        'container', 'teu', 'twenty-foot equivalent', 'cargo', 'freight rate',
        'bunker fuel', 'ship fuel', 'maritime law', 'flag state', 'imo',
        'international maritime', 'port authority', 'terminal operator',
        'shipping line', 'maersk', 'msc', 'cosco', 'evergreen line',
        'cma cgm', 'hapag lloyd', 'shipping alliance', 'suezmax', 'vlcc'
    ]
    
    specific_matches = sum(1 for term in specific_terms if term in text_lower)
    
    # Must have at least 1 maritime keyword OR 1 specific shipping term (more lenient)
    return matches >= 1 or specific_matches >= 1

def convert_article_to_disruption(article: Dict[str, Any], search_term: str) -> Dict[str, Any]:
    """Convert news article to disruption format"""
    title = article.get('title', 'Maritime Disruption')
    description = article.get('description', 'Maritime disruption reported in recent news')
    content = title + ' ' + description
    
    published_date = article.get('publishedAt')
    if published_date:
        try:
            pub_date = datetime.fromisoformat(published_date.replace('Z', '+00:00'))
        except:
            pub_date = datetime.now()
    else:
        pub_date = datetime.now()
    
    # Determine if disruption is still active (within last 7 days)
    days_old = (datetime.now() - pub_date.replace(tzinfo=None)).days
    status = 'active' if days_old <= 7 else 'monitoring'
    
    return {
        "id": f"news_{int(pub_date.timestamp())}_{abs(hash(title)) % 10000}",
        "title": title[:100],
        "description": description[:200] if description else "Maritime disruption reported in recent news",
        "severity": infer_severity(content),
        "status": status,
        "affected_regions": infer_regions(content),
        "coordinates": infer_coordinates(content),
        "sources": [{
            "name": article.get('source', {}).get('name', 'News Source'),
            "url": article.get('url', ''),
            "reliability": "high",
            "published_date": pub_date.isoformat()
        }],
        "confidence": calculate_confidence(content, days_old),
        "last_updated": datetime.now().isoformat(),
        "category": infer_category(search_term),
        "start_date": pub_date.isoformat(),
        "end_date": None
    }

def infer_severity(text: str) -> str:
    """Infer disruption severity from article text"""
    text_lower = text.lower()
    
    critical_terms = ['crisis', 'critical', 'severe', 'emergency', 'catastrophic', 'massive']
    high_terms = ['significant', 'serious', 'major', 'substantial', 'heavy', 'widespread']
    medium_terms = ['moderate', 'notable', 'considerable', 'affecting', 'impact']
    
    if any(term in text_lower for term in critical_terms):
        return 'high'
    elif any(term in text_lower for term in high_terms):
        return 'medium'
    elif any(term in text_lower for term in medium_terms):
        return 'medium'
    else:
        return 'low'

def infer_regions(text: str) -> List[str]:
    """Infer affected regions from article text"""
    text_lower = text.lower()
    
    region_keywords = {
        'red sea': ['Red Sea', 'Gulf of Aden'],
        'suez': ['Suez Canal', 'Mediterranean Sea'],
        'panama': ['Panama Canal', 'Caribbean Sea'],
        'south china sea': ['South China Sea', 'Southeast Asia'],
        'strait of hormuz': ['Strait of Hormuz', 'Persian Gulf'],
        'malacca': ['Strait of Malacca', 'Southeast Asia'],
        'singapore': ['Singapore', 'Southeast Asia'],
        'los angeles': ['Los Angeles', 'US West Coast'],
        'hamburg': ['Hamburg', 'Northern Europe'],
        'rotterdam': ['Rotterdam', 'Northern Europe'],
        'mediterranean': ['Mediterranean Sea'],
        'atlantic': ['North Atlantic'],
        'pacific': ['Pacific Ocean'],
        'baltic': ['Baltic Sea', 'Northern Europe']
    }
    
    regions = []
    for keyword, region_list in region_keywords.items():
        if keyword in text_lower:
            regions.extend(region_list)
    
    return list(set(regions)) if regions else ['Global']

def infer_coordinates(text: str) -> List[float]:
    """Infer coordinates from article text based on location mentions"""
    text_lower = text.lower()
    
    location_coords = {
        'suez': [30.0, 32.5],
        'panama': [9.0, -79.5],
        'singapore': [1.29, 103.85],
        'strait of hormuz': [26.5, 56.0],
        'red sea': [20.0, 38.0],
        'los angeles': [33.74, -118.25],
        'hamburg': [53.55, 9.99],
        'rotterdam': [51.92, 4.48],
        'shanghai': [31.23, 121.47],
        'gulf of aden': [14.0, 48.0],
        'south china sea': [16.0, 112.0],
        'malacca': [2.2, 102.2],
        'mediterranean': [35.0, 18.0],
        'baltic sea': [58.0, 20.0]
    }
    
    for location, coords in location_coords.items():
        if location in text_lower:
            return coords
    
    return [0.0, 0.0]  # Default global coordinates

def infer_category(search_term: str) -> str:
    """Infer disruption category from search term"""
    category_map = {
        'strike': 'Labor Dispute',
        'delay': 'Logistics',
        'canal': 'Infrastructure',
        'security': 'Security',
        'weather': 'Weather',
        'port': 'Port Operations',
        'vessel': 'Vessel Incident',
        'collision': 'Accident',
        'fire': 'Emergency'
    }
    
    search_lower = search_term.lower()
    for keyword, category in category_map.items():
        if keyword in search_lower:
            return category
    
    return 'Maritime'

def calculate_confidence(text: str, days_old: int) -> int:
    """Calculate confidence score based on text content and recency"""
    base_confidence = 70
    
    # Boost confidence for specific maritime terms
    specific_terms = ['port authority', 'coast guard', 'maritime', 'vessel', 'cargo', 'terminal']
    text_lower = text.lower()
    
    for term in specific_terms:
        if term in text_lower:
            base_confidence += 5
    
    # Reduce confidence for older articles
    if days_old > 7:
        base_confidence -= (days_old - 7) * 2
    
    # Cap confidence between 50 and 95
    return max(50, min(95, base_confidence))

def severity_score(severity: str) -> int:
    """Convert severity to numeric score for sorting"""
    scores = {
        'high': 3,
        'medium': 2,
        'low': 1
    }
    return scores.get(severity, 1)

def remove_duplicates(disruptions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Remove duplicate disruptions based on title similarity"""
    unique_disruptions = []
    seen_titles = set()
    
    for disruption in disruptions:
        title = disruption.get('title', '').lower()
        # Create a simplified title for comparison
        simple_title = ''.join(title.split()[:5])  # First 5 words
        
        if simple_title not in seen_titles:
            seen_titles.add(simple_title)
            unique_disruptions.append(disruption)
    
    return unique_disruptions