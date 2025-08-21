"""
Data Storage Service - TradeWatch AI Platform
Continuously collects and stores real-time maritime data in PostgreSQL
for AI training and analysis.
"""

import asyncio
import logging
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
import asyncpg
import httpx
from dataclasses import dataclass, asdict
import os
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class VesselRecord:
    vessel_id: str
    imo: str
    name: str
    vessel_type: str
    latitude: float
    longitude: float
    speed: float
    course: int
    status: str
    destination: str
    flag: str
    owner: str
    mmsi: str
    impacted: bool
    timestamp: datetime
    route: str = None
    eta: str = None
    crew_size: int = None
    dwt: int = None

@dataclass
class DisruptionRecord:
    disruption_id: str
    title: str
    description: str
    severity: str
    disruption_type: str
    latitude: float
    longitude: float
    status: str
    impact_level: str
    affected_routes: List[str]
    timestamp: datetime
    source: str = None
    estimated_duration: str = None

@dataclass
class TariffRecord:
    tariff_id: str
    name: str
    tariff_type: str
    rate: float
    change_percent: float
    status: str
    priority: str
    importer: str
    exporter: str
    product_category: str
    effective_date: str
    trade_volume: str
    affected_companies: int
    timestamp: datetime
    wto_case: str = None

class DataStorageService:
    def __init__(self):
        self.db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/tradewatch')
        self.pool = None
        self.data_api_url = "http://localhost:8001"
        
    async def initialize_database(self):
        """Initialize PostgreSQL connection pool and create tables"""
        try:
            self.pool = await asyncpg.create_pool(self.db_url, min_size=1, max_size=10)
            await self.create_tables()
            logger.info("Database initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise

    async def create_tables(self):
        """Create database tables with proper indexes for AI training"""
        async with self.pool.acquire() as conn:
            # Vessels table with temporal data for tracking movement patterns
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS vessels (
                    id SERIAL PRIMARY KEY,
                    vessel_id VARCHAR(50) NOT NULL,
                    imo VARCHAR(20),
                    name VARCHAR(200),
                    vessel_type VARCHAR(100),
                    latitude FLOAT NOT NULL,
                    longitude FLOAT NOT NULL,
                    speed FLOAT,
                    course INTEGER,
                    status VARCHAR(50),
                    destination VARCHAR(200),
                    flag VARCHAR(100),
                    owner VARCHAR(200),
                    mmsi VARCHAR(20),
                    impacted BOOLEAN DEFAULT FALSE,
                    route VARCHAR(200),
                    eta VARCHAR(50),
                    crew_size INTEGER,
                    dwt INTEGER,
                    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
                    created_at TIMESTAMP DEFAULT NOW()
                );
                
                CREATE INDEX IF NOT EXISTS idx_vessels_timestamp ON vessels(timestamp);
                CREATE INDEX IF NOT EXISTS idx_vessels_vessel_id ON vessels(vessel_id);
                CREATE INDEX IF NOT EXISTS idx_vessels_location ON vessels(latitude, longitude);
                CREATE INDEX IF NOT EXISTS idx_vessels_impacted ON vessels(impacted, timestamp);
            """)
            
            # Disruptions table for incident pattern analysis
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS disruptions (
                    id SERIAL PRIMARY KEY,
                    disruption_id VARCHAR(50) NOT NULL,
                    title VARCHAR(500),
                    description TEXT,
                    severity VARCHAR(50),
                    disruption_type VARCHAR(100),
                    latitude FLOAT NOT NULL,
                    longitude FLOAT NOT NULL,
                    status VARCHAR(50),
                    impact_level VARCHAR(50),
                    affected_routes JSONB,
                    source VARCHAR(200),
                    estimated_duration VARCHAR(100),
                    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
                    created_at TIMESTAMP DEFAULT NOW()
                );
                
                CREATE INDEX IF NOT EXISTS idx_disruptions_timestamp ON disruptions(timestamp);
                CREATE INDEX IF NOT EXISTS idx_disruptions_severity ON disruptions(severity, timestamp);
                CREATE INDEX IF NOT EXISTS idx_disruptions_location ON disruptions(latitude, longitude);
                CREATE INDEX IF NOT EXISTS idx_disruptions_type ON disruptions(disruption_type, timestamp);
            """)
            
            # Tariffs table for trade pattern analysis
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS tariffs (
                    id SERIAL PRIMARY KEY,
                    tariff_id VARCHAR(50) NOT NULL,
                    name VARCHAR(500),
                    tariff_type VARCHAR(100),
                    rate FLOAT,
                    change_percent FLOAT,
                    status VARCHAR(50),
                    priority VARCHAR(50),
                    importer VARCHAR(100),
                    exporter VARCHAR(100),
                    product_category VARCHAR(200),
                    effective_date VARCHAR(50),
                    trade_volume VARCHAR(50),
                    affected_companies INTEGER,
                    wto_case VARCHAR(50),
                    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
                    created_at TIMESTAMP DEFAULT NOW()
                );
                
                CREATE INDEX IF NOT EXISTS idx_tariffs_timestamp ON tariffs(timestamp);
                CREATE INDEX IF NOT EXISTS idx_tariffs_countries ON tariffs(importer, exporter);
                CREATE INDEX IF NOT EXISTS idx_tariffs_rate ON tariffs(rate, timestamp);
                CREATE INDEX IF NOT EXISTS idx_tariffs_priority ON tariffs(priority, timestamp);
            """)
            
            # AI training metadata table
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS ai_training_runs (
                    id SERIAL PRIMARY KEY,
                    model_name VARCHAR(100) NOT NULL,
                    training_start TIMESTAMP NOT NULL,
                    training_end TIMESTAMP,
                    data_start_date TIMESTAMP NOT NULL,
                    data_end_date TIMESTAMP NOT NULL,
                    records_count INTEGER,
                    model_accuracy FLOAT,
                    model_path VARCHAR(500),
                    parameters JSONB,
                    status VARCHAR(50) DEFAULT 'running',
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """)

    async def collect_and_store_vessels(self):
        """Collect vessel data and store in database"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.data_api_url}/api/vessels?limit=3000")
                if response.status_code == 200:
                    data = response.json()
                    vessels = data.get('vessels', [])
                    
                    vessel_records = []
                    for vessel in vessels:
                        try:
                            record = VesselRecord(
                                vessel_id=vessel.get('id', ''),
                                imo=vessel.get('imo', ''),
                                name=vessel.get('name', ''),
                                vessel_type=vessel.get('type', ''),
                                latitude=float(vessel.get('latitude', 0)),
                                longitude=float(vessel.get('longitude', 0)),
                                speed=float(vessel.get('speed', 0)),
                                course=int(vessel.get('course', 0)),
                                status=vessel.get('status', ''),
                                destination=vessel.get('destination', ''),
                                flag=vessel.get('flag', ''),
                                owner=vessel.get('owner', ''),
                                mmsi=vessel.get('mmsi', ''),
                                impacted=vessel.get('impacted', False),
                                route=vessel.get('route'),
                                eta=vessel.get('eta'),
                                crew_size=vessel.get('crew_size'),
                                dwt=vessel.get('dwt'),
                                timestamp=datetime.now()
                            )
                            vessel_records.append(record)
                        except (ValueError, TypeError) as e:
                            logger.warning(f"Skipped invalid vessel record: {e}")
                            continue
                    
                    await self.store_vessels(vessel_records)
                    logger.info(f"Stored {len(vessel_records)} vessel records")
                    
        except Exception as e:
            logger.error(f"Failed to collect vessel data: {e}")

    async def collect_and_store_disruptions(self):
        """Collect disruption data and store in database"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.data_api_url}/api/maritime-disruptions")
                if response.status_code == 200:
                    data = response.json()
                    disruptions = data.get('disruptions', [])
                    
                    disruption_records = []
                    for disruption in disruptions:
                        try:
                            coords = disruption.get('coordinates', [0, 0])
                            record = DisruptionRecord(
                                disruption_id=disruption.get('id', ''),
                                title=disruption.get('title', ''),
                                description=disruption.get('description', ''),
                                severity=disruption.get('severity', ''),
                                disruption_type=disruption.get('type', ''),
                                latitude=float(coords[0]) if len(coords) > 0 else 0.0,
                                longitude=float(coords[1]) if len(coords) > 1 else 0.0,
                                status=disruption.get('status', ''),
                                impact_level=disruption.get('impact_level', ''),
                                affected_routes=disruption.get('affected_routes', []),
                                source=disruption.get('source'),
                                estimated_duration=disruption.get('estimated_duration'),
                                timestamp=datetime.now()
                            )
                            disruption_records.append(record)
                        except (ValueError, TypeError) as e:
                            logger.warning(f"Skipped invalid disruption record: {e}")
                            continue
                    
                    await self.store_disruptions(disruption_records)
                    logger.info(f"Stored {len(disruption_records)} disruption records")
                    
        except Exception as e:
            logger.error(f"Failed to collect disruption data: {e}")

    async def collect_and_store_tariffs(self):
        """Collect tariff data and store in database"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.data_api_url}/api/tariffs?limit=1000")
                if response.status_code == 200:
                    data = response.json()
                    tariffs = data.get('tariffs', [])
                    
                    tariff_records = []
                    for tariff in tariffs:
                        try:
                            # Parse rate from string format like "15.5%"
                            rate_str = tariff.get('rate', '0%').replace('%', '')
                            rate = float(rate_str) if rate_str else 0.0
                            
                            # Parse change from string format like "+2.5%"
                            change_str = tariff.get('change', '0%').replace('%', '').replace('+', '')
                            change = float(change_str) if change_str else 0.0
                            
                            record = TariffRecord(
                                tariff_id=tariff.get('id', ''),
                                name=tariff.get('name', ''),
                                tariff_type=tariff.get('type', ''),
                                rate=rate,
                                change_percent=change,
                                status=tariff.get('status', ''),
                                priority=tariff.get('priority', ''),
                                importer=tariff.get('importer', ''),
                                exporter=tariff.get('exporter', ''),
                                product_category=tariff.get('product_category', ''),
                                effective_date=tariff.get('effective_date', ''),
                                trade_volume=tariff.get('trade_volume', ''),
                                affected_companies=tariff.get('affected_companies', 0),
                                wto_case=tariff.get('wto_case'),
                                timestamp=datetime.now()
                            )
                            tariff_records.append(record)
                        except (ValueError, TypeError) as e:
                            logger.warning(f"Skipped invalid tariff record: {e}")
                            continue
                    
                    await self.store_tariffs(tariff_records)
                    logger.info(f"Stored {len(tariff_records)} tariff records")
                    
        except Exception as e:
            logger.error(f"Failed to collect tariff data: {e}")

    async def store_vessels(self, vessels: List[VesselRecord]):
        """Store vessel records in database"""
        async with self.pool.acquire() as conn:
            values = [
                (
                    v.vessel_id, v.imo, v.name, v.vessel_type, v.latitude, v.longitude,
                    v.speed, v.course, v.status, v.destination, v.flag, v.owner,
                    v.mmsi, v.impacted, v.route, v.eta, v.crew_size, v.dwt, v.timestamp
                )
                for v in vessels
            ]
            
            await conn.executemany("""
                INSERT INTO vessels (
                    vessel_id, imo, name, vessel_type, latitude, longitude,
                    speed, course, status, destination, flag, owner,
                    mmsi, impacted, route, eta, crew_size, dwt, timestamp
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            """, values)

    async def store_disruptions(self, disruptions: List[DisruptionRecord]):
        """Store disruption records in database"""
        async with self.pool.acquire() as conn:
            values = [
                (
                    d.disruption_id, d.title, d.description, d.severity, d.disruption_type,
                    d.latitude, d.longitude, d.status, d.impact_level, 
                    json.dumps(d.affected_routes), d.source, d.estimated_duration, d.timestamp
                )
                for d in disruptions
            ]
            
            await conn.executemany("""
                INSERT INTO disruptions (
                    disruption_id, title, description, severity, disruption_type,
                    latitude, longitude, status, impact_level, affected_routes,
                    source, estimated_duration, timestamp
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            """, values)

    async def store_tariffs(self, tariffs: List[TariffRecord]):
        """Store tariff records in database"""
        async with self.pool.acquire() as conn:
            values = [
                (
                    t.tariff_id, t.name, t.tariff_type, t.rate, t.change_percent,
                    t.status, t.priority, t.importer, t.exporter, t.product_category,
                    t.effective_date, t.trade_volume, t.affected_companies, t.wto_case, t.timestamp
                )
                for t in tariffs
            ]
            
            await conn.executemany("""
                INSERT INTO tariffs (
                    tariff_id, name, tariff_type, rate, change_percent,
                    status, priority, importer, exporter, product_category,
                    effective_date, trade_volume, affected_companies, wto_case, timestamp
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            """, values)

    async def get_training_data(self, data_type: str, start_date: datetime, end_date: datetime) -> List[Dict]:
        """Retrieve historical data for AI training"""
        async with self.pool.acquire() as conn:
            if data_type == 'vessels':
                query = """
                    SELECT * FROM vessels 
                    WHERE timestamp BETWEEN $1 AND $2 
                    ORDER BY timestamp ASC
                """
            elif data_type == 'disruptions':
                query = """
                    SELECT * FROM disruptions 
                    WHERE timestamp BETWEEN $1 AND $2 
                    ORDER BY timestamp ASC
                """
            elif data_type == 'tariffs':
                query = """
                    SELECT * FROM tariffs 
                    WHERE timestamp BETWEEN $1 AND $2 
                    ORDER BY timestamp ASC
                """
            else:
                raise ValueError(f"Unknown data type: {data_type}")
            
            rows = await conn.fetch(query, start_date, end_date)
            return [dict(row) for row in rows]

    async def run_data_collection_loop(self):
        """Run continuous data collection every 5 minutes"""
        logger.info("Starting data collection loop...")
        while True:
            try:
                # Collect all data types
                await asyncio.gather(
                    self.collect_and_store_vessels(),
                    self.collect_and_store_disruptions(),
                    self.collect_and_store_tariffs()
                )
                
                # Wait 5 minutes before next collection
                await asyncio.sleep(300)  # 5 minutes
                
            except Exception as e:
                logger.error(f"Error in data collection loop: {e}")
                await asyncio.sleep(60)  # Wait 1 minute before retrying

async def main():
    """Main entry point for data storage service"""
    storage_service = DataStorageService()
    
    try:
        await storage_service.initialize_database()
        logger.info("Data storage service initialized successfully")
        
        # Run data collection loop
        await storage_service.run_data_collection_loop()
        
    except KeyboardInterrupt:
        logger.info("Data storage service stopped by user")
    except Exception as e:
        logger.error(f"Data storage service failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())
