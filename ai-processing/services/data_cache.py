#!/usr/bin/env python3
"""
Data Cache Service for TradeWatch
Stores real AIS, tariff, and disruption data in SQLite database for fast retrieval
"""

import sqlite3
import json
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class DataCache:
    """SQLite-based cache for maritime data"""
    
    def __init__(self, db_path: str = "data/tradewatch_cache.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(exist_ok=True)
        self.init_database()
    
    def init_database(self):
        """Initialize database tables"""
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS vessels (
                    id TEXT PRIMARY KEY,
                    mmsi TEXT,
                    name TEXT,
                    latitude REAL,
                    longitude REAL,
                    speed REAL,
                    course REAL,
                    status TEXT,
                    vessel_type TEXT,
                    flag TEXT,
                    data_source TEXT,
                    raw_data TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS disruptions (
                    id TEXT PRIMARY KEY,
                    title TEXT,
                    description TEXT,
                    severity TEXT,
                    status TEXT,
                    disruption_type TEXT,
                    latitude REAL,
                    longitude REAL,
                    confidence INTEGER,
                    raw_data TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS tariffs (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    rate TEXT,
                    tariff_type TEXT,
                    status TEXT,
                    importer TEXT,
                    exporter TEXT,
                    priority TEXT,
                    raw_data TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_vessels_updated ON vessels(updated_at);
                CREATE INDEX IF NOT EXISTS idx_disruptions_updated ON disruptions(updated_at);
                CREATE INDEX IF NOT EXISTS idx_tariffs_updated ON tariffs(updated_at);
            """)
    
    def cache_vessels(self, vessels: List[Dict[str, Any]]) -> int:
        """Cache vessel data"""
        cached_count = 0
        
        with sqlite3.connect(self.db_path) as conn:
            for vessel in vessels:
                try:
                    conn.execute("""
                        INSERT OR REPLACE INTO vessels 
                        (id, mmsi, name, latitude, longitude, speed, course, status, 
                         vessel_type, flag, data_source, raw_data, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    """, (
                        vessel.get('id', f"vessel_{vessel.get('mmsi', 'unknown')}"),
                        vessel.get('mmsi'),
                        vessel.get('name'),
                        vessel.get('latitude'),
                        vessel.get('longitude'),
                        vessel.get('speed'),
                        vessel.get('course'),
                        vessel.get('status'),
                        vessel.get('type'),
                        vessel.get('flag'),
                        vessel.get('data_source', 'AIS Stream'),
                        json.dumps(vessel)
                    ))
                    cached_count += 1
                except Exception as e:
                    logger.warning(f"Failed to cache vessel {vessel.get('id', 'unknown')}: {e}")
        
        logger.info(f"Cached {cached_count} vessels")
        return cached_count
    
    def cache_disruptions(self, disruptions: List[Dict[str, Any]]) -> int:
        """Cache disruption data"""
        cached_count = 0
        
        with sqlite3.connect(self.db_path) as conn:
            for disruption in disruptions:
                try:
                    coords = disruption.get('coordinates', [0, 0])
                    lat = coords[0] if len(coords) > 0 else 0
                    lon = coords[1] if len(coords) > 1 else 0
                    
                    conn.execute("""
                        INSERT OR REPLACE INTO disruptions 
                        (id, title, description, severity, status, disruption_type,
                         latitude, longitude, confidence, raw_data, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    """, (
                        disruption.get('id', f"disruption_{datetime.now().timestamp()}"),
                        disruption.get('title'),
                        disruption.get('description'),
                        disruption.get('severity'),
                        disruption.get('status'),
                        disruption.get('type'),
                        lat,
                        lon,
                        disruption.get('confidence', 0),
                        json.dumps(disruption)
                    ))
                    cached_count += 1
                except Exception as e:
                    logger.warning(f"Failed to cache disruption {disruption.get('id', 'unknown')}: {e}")
        
        logger.info(f"Cached {cached_count} disruptions")
        return cached_count
    
    def cache_tariffs(self, tariffs: List[Dict[str, Any]]) -> int:
        """Cache tariff data"""
        cached_count = 0
        
        with sqlite3.connect(self.db_path) as conn:
            for tariff in tariffs:
                try:
                    conn.execute("""
                        INSERT OR REPLACE INTO tariffs 
                        (id, name, rate, tariff_type, status, importer, exporter, 
                         priority, raw_data, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    """, (
                        tariff.get('id', f"tariff_{datetime.now().timestamp()}"),
                        tariff.get('name'),
                        tariff.get('rate'),
                        tariff.get('type'),
                        tariff.get('status'),
                        tariff.get('importer'),
                        tariff.get('exporter'),
                        tariff.get('priority'),
                        json.dumps(tariff)
                    ))
                    cached_count += 1
                except Exception as e:
                    logger.warning(f"Failed to cache tariff {tariff.get('id', 'unknown')}: {e}")
        
        logger.info(f"Cached {cached_count} tariffs")
        return cached_count
    
    def get_cached_vessels(self, limit: int = 500, max_age_hours: int = 1) -> List[Dict[str, Any]]:
        """Get cached vessels that are not too old"""
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("""
                SELECT raw_data FROM vessels 
                WHERE updated_at > ? 
                ORDER BY updated_at DESC 
                LIMIT ?
            """, (cutoff_time.isoformat(), limit))
            
            vessels = []
            for row in cursor.fetchall():
                try:
                    vessel_data = json.loads(row['raw_data'])
                    vessels.append(vessel_data)
                except Exception as e:
                    logger.warning(f"Failed to parse cached vessel data: {e}")
            
            return vessels
    
    def get_cached_disruptions(self, limit: int = 100, max_age_hours: int = 6) -> List[Dict[str, Any]]:
        """Get cached disruptions that are not too old"""
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("""
                SELECT raw_data FROM disruptions 
                WHERE updated_at > ? 
                ORDER BY updated_at DESC 
                LIMIT ?
            """, (cutoff_time.isoformat(), limit))
            
            disruptions = []
            for row in cursor.fetchall():
                try:
                    disruption_data = json.loads(row['raw_data'])
                    disruptions.append(disruption_data)
                except Exception as e:
                    logger.warning(f"Failed to parse cached disruption data: {e}")
            
            return disruptions
    
    def get_cached_tariffs(self, limit: int = 50, max_age_hours: int = 24) -> List[Dict[str, Any]]:
        """Get cached tariffs that are not too old"""
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("""
                SELECT raw_data FROM tariffs 
                WHERE updated_at > ? 
                ORDER BY updated_at DESC 
                LIMIT ?
            """, (cutoff_time.isoformat(), limit))
            
            tariffs = []
            for row in cursor.fetchall():
                try:
                    tariff_data = json.loads(row['raw_data'])
                    tariffs.append(tariff_data)
                except Exception as e:
                    logger.warning(f"Failed to parse cached tariff data: {e}")
            
            return tariffs
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        with sqlite3.connect(self.db_path) as conn:
            stats = {}
            
            # Count vessels
            cursor = conn.execute("SELECT COUNT(*) FROM vessels")
            stats['vessels_total'] = cursor.fetchone()[0]
            
            # Count recent vessels (last hour)
            cutoff = (datetime.now() - timedelta(hours=1)).isoformat()
            cursor = conn.execute("SELECT COUNT(*) FROM vessels WHERE updated_at > ?", (cutoff,))
            stats['vessels_recent'] = cursor.fetchone()[0]
            
            # Count disruptions
            cursor = conn.execute("SELECT COUNT(*) FROM disruptions")
            stats['disruptions_total'] = cursor.fetchone()[0]
            
            # Count tariffs
            cursor = conn.execute("SELECT COUNT(*) FROM tariffs")
            stats['tariffs_total'] = cursor.fetchone()[0]
            
            return stats

# Global cache instance
data_cache = DataCache()
