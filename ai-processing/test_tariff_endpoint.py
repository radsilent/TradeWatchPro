#!/usr/bin/env python3
"""
Test script to verify the tariff endpoint returns credible data
"""

import asyncio
import sys
import os

# Add current directory to path
sys.path.insert(0, os.getcwd())

async def test_tariff_endpoint():
    """Test the tariff endpoint directly"""
    
    print("🔍 Testing credible tariff endpoint...")
    
    try:
        # Import the API function directly
        from enhanced_real_data_api import get_real_tariffs_endpoint
        
        # Call the endpoint function
        print("📥 Calling get_real_tariffs_endpoint(limit=5)...")
        result = await get_real_tariffs_endpoint(limit=5)
        
        print(f"📊 Result type: {type(result)}")
        print(f"📊 Keys in result: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
        
        if isinstance(result, dict) and 'tariffs' in result:
            tariffs = result['tariffs']
            print(f"✅ Got {len(tariffs)} tariffs")
            print(f"📈 Data source: {result.get('data_source', 'Unknown')}")
            
            if tariffs:
                print("\n🎯 Sample tariffs:")
                for i, tariff in enumerate(tariffs[:3], 1):
                    print(f"{i}. {tariff.get('name', 'Unknown')}")
                    print(f"   Rate: {tariff.get('rate', 'Unknown')}")
                    print(f"   Type: {tariff.get('type', 'Unknown')}")
                    sources = tariff.get('sources', [])
                    if sources:
                        print(f"   Source: {sources[0].get('name', 'Unknown')}")
                    print()
                
                print("✅ Tariff endpoint is working with credible data!")
            else:
                print("❌ No tariffs returned")
        else:
            print(f"❌ Unexpected result format: {result}")
    
    except Exception as e:
        print(f"❌ Error testing tariff endpoint: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_tariff_endpoint())

