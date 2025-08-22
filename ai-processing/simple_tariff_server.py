#!/usr/bin/env python3
"""
Simple standalone tariff API server with credible data
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import uvicorn
from datetime import datetime
import logging
import sys
import os

# Add current directory to path
sys.path.insert(0, os.getcwd())

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="TradeWatch Credible Tariff API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "TradeWatch Credible Tariff API",
        "status": "running",
        "data_source": "Real government sources: USTR, World Bank, WTO, EU TARIC, Canada CBSA"
    }

@app.get("/api/tariffs")
async def get_credible_tariffs_api(limit: int = 500):
    """Get credible tariff data from official government sources"""
    try:
        logger.info(f"Fetching {limit} CREDIBLE tariff records from government sources...")
        
        # Import and use the credible tariff scraper
        from services.credible_tariff_scraper import get_credible_tariffs
        
        tariffs = await get_credible_tariffs(limit)
        
        if not tariffs:
            logger.warning("No credible tariff data available")
            return {
                "tariffs": [],
                "total": 0,
                "limit": limit,
                "data_source": "Credible government sources - no data available",
                "timestamp": datetime.now().isoformat(),
                "message": "No credible tariff data available"
            }
        
        # Extract unique sources
        sources = set()
        for tariff in tariffs:
            for source in tariff.get('sources', []):
                sources.add(source['name'])
        
        logger.info(f"Successfully fetched {len(tariffs)} credible tariffs from {len(sources)} sources")
        
        return {
            "tariffs": tariffs,
            "total": len(tariffs),
            "limit": limit,
            "data_source": "CREDIBLE government sources: " + ", ".join(sorted(sources)),
            "timestamp": datetime.now().isoformat(),
            "sources": list(sorted(sources)),
            "credible": True,
            "fake_data": False
        }
        
    except Exception as e:
        logger.error(f"Error fetching credible tariff data: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "tariffs": [],
            "total": 0,
            "limit": limit,
            "data_source": "Error fetching credible data",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "credible-tariff-api"}

if __name__ == "__main__":
    logger.info("Starting TradeWatch Credible Tariff API server...")
    logger.info("Using ONLY credible government sources - NO FAKE DATA")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")

