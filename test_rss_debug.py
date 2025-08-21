#!/usr/bin/env python3
"""
Debug script to test RSS feed parsing for maritime disruptions
"""

import asyncio
import aiohttp
import xml.etree.ElementTree as ET

async def test_rss_feed():
    rss_url = "https://splash247.com/feed/"
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(rss_url) as response:
                if response.status == 200:
                    content = await response.text()
                    print(f"✅ Successfully fetched RSS from {rss_url}")
                    print(f"Content length: {len(content)} characters")
                    
                    # Parse XML
                    try:
                        root = ET.fromstring(content)
                        print(f"✅ Successfully parsed XML")
                        
                        # Find items
                        items = root.findall('.//item')
                        print(f"📰 Found {len(items)} items in RSS feed")
                        
                        for i, item in enumerate(items[:5]):  # Test first 5 items
                            title_elem = item.find('title')
                            desc_elem = item.find('description')
                            
                            title = title_elem.text if title_elem is not None else "No title"
                            description = desc_elem.text if desc_elem is not None else "No description"
                            
                            print(f"\n📋 Item {i+1}:")
                            print(f"   Title: {title}")
                            print(f"   Description: {description[:100]}..." if len(description) > 100 else f"   Description: {description}")
                            
                            # Test maritime relevance
                            combined_text = f"{title} {description}"
                            is_relevant = test_maritime_relevance(combined_text)
                            print(f"   Maritime relevant: {is_relevant}")
                            
                    except ET.ParseError as e:
                        print(f"❌ XML parsing failed: {e}")
                        print(f"Content preview: {content[:500]}")
                        
                else:
                    print(f"❌ HTTP request failed with status {response.status}")
                    
        except Exception as e:
            print(f"❌ Request failed: {e}")

def test_maritime_relevance(text):
    """Test maritime relevance filtering"""
    text_lower = text.lower()
    
    # Exclude non-maritime topics
    exclude_keywords = [
        'meta', 'facebook', 'instagram', 'ai chat', 'artificial intelligence',
        'children', 'sensual', 'politics', 'election', 'celebrity', 'entertainment',
        'sports', 'cryptocurrency', 'bitcoin', 'gaming', 'healthcare', 'covid vaccine',
        'automobile', 'tesla', 'real estate', 'restaurant', 'retail'
    ]
    
    # Check for exclusions first
    excluded = any(keyword in text_lower for keyword in exclude_keywords)
    if excluded:
        print(f"   ❌ Excluded due to non-maritime keywords")
        return False
    
    # Maritime-specific keywords
    maritime_keywords = [
        'shipping', 'maritime', 'vessel', 'cargo ship', 'container ship', 'port',
        'harbor', 'terminal', 'dock', 'tanker', 'freight', 'supply chain',
        'suez canal', 'panama canal', 'strait', 'navigation', 'coast guard',
        'loading', 'unloading', 'berth', 'anchorage', 'pilot service',
        'bill of lading', 'manifest', 'customs', 'import', 'export'
    ]
    
    matches = [keyword for keyword in maritime_keywords if keyword in text_lower]
    
    # Additional specific shipping/port terms
    specific_terms = [
        'container', 'teu', 'twenty-foot equivalent', 'cargo', 'freight rate',
        'bunker fuel', 'ship fuel', 'maritime law', 'flag state', 'imo',
        'international maritime', 'port authority', 'terminal operator',
        'shipping line', 'maersk', 'msc', 'cosco', 'evergreen line',
        'cma cgm', 'hapag lloyd', 'shipping alliance', 'suezmax', 'vlcc'
    ]
    
    specific_matches = [term for term in specific_terms if term in text_lower]
    
    print(f"   Maritime keywords found: {matches}")
    print(f"   Specific terms found: {specific_matches}")
    
    # Must have at least 1 maritime keyword OR 1 specific shipping term
    is_relevant = len(matches) >= 1 or len(specific_matches) >= 1
    return is_relevant

if __name__ == "__main__":
    asyncio.run(test_rss_feed())
