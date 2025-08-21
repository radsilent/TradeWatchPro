#!/usr/bin/env python3
"""
Simple RSS test to check exact XML structure
"""

import requests
import xml.etree.ElementTree as ET

def test_rss():
    url = "https://splash247.com/feed/"
    
    response = requests.get(url)
    if response.status_code == 200:
        content = response.text
        print(f"Content length: {len(content)}")
        
        # Save a snippet to see the structure
        print("\n--- First 1000 characters ---")
        print(content[:1000])
        
        # Parse XML
        try:
            root = ET.fromstring(content)
            
            # Find all items
            items = root.findall('.//item')
            print(f"\nFound {len(items)} items")
            
            if items:
                first_item = items[0]
                print("\n--- First item structure ---")
                for child in first_item:
                    print(f"Tag: {child.tag}, Text: {child.text[:100] if child.text else 'None'}...")
                    
        except ET.ParseError as e:
            print(f"XML parsing error: {e}")
    else:
        print(f"HTTP error: {response.status_code}")

if __name__ == "__main__":
    test_rss()
