"""
Extensive AIS Data Integration Service
Connects to multiple free AIS data sources to track thousands of vessels
"""

import asyncio
import aiohttp
import json
import time
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Set
from dataclasses import dataclass
import hashlib
import asyncpg
from fake_useragent import UserAgent
import random
import math

logger = logging.getLogger(__name__)

@dataclass
class VesselPosition:
    vessel_id: str
    imo_number: Optional[str]
    mmsi: str
    vessel_name: str
    vessel_type: str
    latitude: float
    longitude: float
    speed_knots: float
    heading_degrees: int
    timestamp: datetime
    source: str
    course_over_ground: Optional[float] = None
    rate_of_turn: Optional[float] = None
    navigational_status: Optional[str] = None
    destination: Optional[str] = None
    eta: Optional[datetime] = None
    draught: Optional[float] = None
    gross_tonnage: Optional[int] = None
    length: Optional[int] = None
    beam: Optional[int] = None

class ExtensiveAISService:
    def __init__(self, db_manager):
        self.db_manager = db_manager
        self.ua = UserAgent()
        self.session = None
        self.tracked_vessels: Set[str] = set()
        self.vessel_cache = {}
        self.last_update = {}
        self.rate_limiters = {}
        
        # Free AIS data sources
        self.ais_sources = {
            'marinetraffic_free': {
                'base_url': 'https://www.marinetraffic.com/en/ais/home/centerx:{lng}/centery:{lat}/zoom:10',
                'api_url': 'https://www.marinetraffic.com/getData/get_data_json_4/',
                'rate_limit': 1.0,  # seconds between requests
                'max_vessels_per_request': 50
            },
            'vesselfinder': {
                'base_url': 'https://www.vesselfinder.com/',
                'api_url': 'https://www.vesselfinder.com/api/pub/vesselsearch',
                'rate_limit': 2.0,
                'max_vessels_per_request': 30
            },
            'myshiptracking': {
                'base_url': 'https://www.myshiptracking.com/',
                'api_url': 'https://www.myshiptracking.com/requests/vesselsonmap.php',
                'rate_limit': 1.5,
                'max_vessels_per_request': 100
            },
            'openseamap': {
                'base_url': 'https://map.openseamap.org/',
                'api_url': 'https://t1.openseamap.org/seamark',
                'rate_limit': 0.5,
                'max_vessels_per_request': 200
            }
        }
        
        # Major shipping areas to focus on
        self.coverage_areas = [
            {"name": "North Atlantic", "lat": 45.0, "lng": -30.0, "radius": 1000},
            {"name": "Mediterranean", "lat": 36.0, "lng": 15.0, "radius": 800},
            {"name": "North Sea", "lat": 56.0, "lng": 3.0, "radius": 600},
            {"name": "Baltic Sea", "lat": 58.0, "lng": 20.0, "radius": 500},
            {"name": "Red Sea", "lat": 20.0, "lng": 38.0, "radius": 700},
            {"name": "Persian Gulf", "lat": 27.0, "lng": 52.0, "radius": 400},
            {"name": "Malacca Strait", "lat": 4.0, "lng": 100.0, "radius": 300},
            {"name": "Suez Canal", "lat": 30.0, "lng": 32.6, "radius": 100},
            {"name": "Panama Canal", "lat": 9.0, "lng": -80.0, "radius": 100},
            {"name": "Singapore Strait", "lat": 1.3, "lng": 103.8, "radius": 200},
            {"name": "English Channel", "lat": 50.0, "lng": 1.0, "radius": 300},
            {"name": "Gibraltar Strait", "lat": 36.0, "lng": -5.4, "radius": 100},
            {"name": "Bosphorus Strait", "lat": 41.0, "lng": 29.0, "radius": 50},
            {"name": "South China Sea", "lat": 15.0, "lng": 115.0, "radius": 1200},
            {"name": "East China Sea", "lat": 30.0, "lng": 125.0, "radius": 800},
            {"name": "Bay of Bengal", "lat": 15.0, "lng": 88.0, "radius": 600},
            {"name": "Arabian Sea", "lat": 15.0, "lng": 65.0, "radius": 800},
            {"name": "North Pacific", "lat": 40.0, "lng": -150.0, "radius": 2000},
            {"name": "North Atlantic Shipping Lanes", "lat": 50.0, "lng": -40.0, "radius": 1500},
            {"name": "Cape of Good Hope", "lat": -35.0, "lng": 20.0, "radius": 400}
        ]
    
    async def initialize(self):
        """Initialize the AIS service"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={'User-Agent': self.ua.random}
        )
        logger.info("ExtensiveAISService initialized")
    
    async def shutdown(self):
        """Cleanup resources"""
        if self.session:
            await self.session.close()
    
    async def start_comprehensive_tracking(self):
        """Start comprehensive vessel tracking across all coverage areas"""
        logger.info("Starting comprehensive AIS tracking for thousands of vessels")
        
        tasks = []
        
        # Create tracking tasks for each coverage area
        for area in self.coverage_areas:
            for source_name in self.ais_sources.keys():
                task = asyncio.create_task(
                    self.track_area_continuously(area, source_name)
                )
                tasks.append(task)
        
        # Start vessel detail enhancement task
        tasks.append(asyncio.create_task(self.enhance_vessel_details_continuously()))
        
        # Start prediction validation task
        tasks.append(asyncio.create_task(self.validate_predictions_continuously()))
        
        # Start vessel history compilation
        tasks.append(asyncio.create_task(self.compile_vessel_histories_continuously()))
        
        logger.info(f"Started {len(tasks)} tracking tasks")
        return tasks
    
    async def track_area_continuously(self, area: Dict[str, Any], source_name: str):
        """Continuously track vessels in a specific area using a specific source"""
        source = self.ais_sources[source_name]
        
        while True:
            try:
                # Apply rate limiting
                last_request = self.rate_limiters.get(f"{source_name}_{area['name']}", 0)
                time_since_last = time.time() - last_request
                
                if time_since_last < source['rate_limit']:
                    await asyncio.sleep(source['rate_limit'] - time_since_last)
                
                # Fetch vessels in area
                vessels = await self.fetch_vessels_in_area(area, source_name)
                
                if vessels:
                    # Process and store vessel data
                    await self.process_vessel_batch(vessels, source_name)
                    
                    logger.info(f"Processed {len(vessels)} vessels in {area['name']} from {source_name}")
                
                self.rate_limiters[f"{source_name}_{area['name']}"] = time.time()
                
                # Wait before next cycle (longer for areas with more vessels)
                base_interval = 300  # 5 minutes
                vessel_factor = min(len(vessels) / 100, 2.0) if vessels else 1.0
                await asyncio.sleep(base_interval * vessel_factor)
                
            except Exception as e:
                logger.error(f"Error tracking area {area['name']} from {source_name}: {e}")
                await asyncio.sleep(60)  # Wait 1 minute before retrying
    
    async def fetch_vessels_in_area(self, area: Dict[str, Any], source_name: str) -> List[VesselPosition]:
        """Fetch vessels in a specific geographical area"""
        source = self.ais_sources[source_name]
        vessels = []
        
        try:
            if source_name == 'marinetraffic_free':
                vessels = await self.fetch_from_marinetraffic(area)
            elif source_name == 'vesselfinder':
                vessels = await self.fetch_from_vesselfinder(area)
            elif source_name == 'myshiptracking':
                vessels = await self.fetch_from_myshiptracking(area)
            elif source_name == 'openseamap':
                vessels = await self.fetch_from_openseamap(area)
            
        except Exception as e:
            logger.error(f"Error fetching from {source_name}: {e}")
        
        return vessels
    
    async def fetch_from_marinetraffic(self, area: Dict[str, Any]) -> List[VesselPosition]:
        """Fetch vessel data from MarineTraffic free service"""
        vessels = []
        
        try:
            # Generate multiple search points within the area
            search_points = self.generate_search_grid(area, grid_size=5)
            
            for point in search_points:
                url = f"https://www.marinetraffic.com/getData/get_data_json_4/"
                params = {
                    'asset_type': 'vessels',
                    'sw_lat': point['lat'] - 0.5,
                    'sw_lng': point['lng'] - 0.5,
                    'ne_lat': point['lat'] + 0.5,
                    'ne_lng': point['lng'] + 0.5,
                    'zoom': 10,
                    'mmsi': '',
                    'shipname': '',
                    'fleet': '',
                    'details': 'true',
                    'trackvessel': 'true'
                }
                
                async with self.session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if 'data' in data:
                            for vessel_data in data['data']:
                                vessel = self.parse_marinetraffic_vessel(vessel_data)
                                if vessel:
                                    vessels.append(vessel)
                
                # Small delay between grid points
                await asyncio.sleep(0.5)
                
        except Exception as e:
            logger.error(f"Error fetching from MarineTraffic: {e}")
        
        return vessels
    
    async def fetch_from_vesselfinder(self, area: Dict[str, Any]) -> List[VesselPosition]:
        """Fetch vessel data from VesselFinder"""
        vessels = []
        
        try:
            # VesselFinder API approach (simulated - would need actual API access)
            url = "https://www.vesselfinder.com/api/pub/vesselsearch"
            
            params = {
                'lat': area['lat'],
                'lng': area['lng'],
                'radius': min(area['radius'], 100),  # Limit radius for free service
                'format': 'json'
            }
            
            headers = {
                'User-Agent': self.ua.random,
                'Referer': 'https://www.vesselfinder.com/'
            }
            
            async with self.session.get(url, params=params, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if isinstance(data, list):
                        for vessel_data in data:
                            vessel = self.parse_vesselfinder_vessel(vessel_data)
                            if vessel:
                                vessels.append(vessel)
                
        except Exception as e:
            logger.error(f"Error fetching from VesselFinder: {e}")
        
        return vessels
    
    async def fetch_from_myshiptracking(self, area: Dict[str, Any]) -> List[VesselPosition]:
        """Fetch vessel data from MyShipTracking"""
        vessels = []
        
        try:
            url = "https://www.myshiptracking.com/requests/vesselsonmap.php"
            
            params = {
                'lat1': area['lat'] - 1.0,
                'lng1': area['lng'] - 1.0,
                'lat2': area['lat'] + 1.0,
                'lng2': area['lng'] + 1.0,
                'zoom': 8
            }
            
            headers = {
                'User-Agent': self.ua.random,
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': 'https://www.myshiptracking.com/'
            }
            
            async with self.session.get(url, params=params, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if 'vessels' in data:
                        for vessel_data in data['vessels']:
                            vessel = self.parse_myshiptracking_vessel(vessel_data)
                            if vessel:
                                vessels.append(vessel)
                
        except Exception as e:
            logger.error(f"Error fetching from MyShipTracking: {e}")
        
        return vessels
    
    async def fetch_from_openseamap(self, area: Dict[str, Any]) -> List[VesselPosition]:
        """Fetch vessel data from OpenSeaMap"""
        vessels = []
        
        try:
            # OpenSeaMap uses different API structure
            url = "https://t1.openseamap.org/seamark"
            
            params = {
                'zoom': 10,
                'x': self.lng_to_tile_x(area['lng'], 10),
                'y': self.lat_to_tile_y(area['lat'], 10)
            }
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if 'features' in data:
                        for feature in data['features']:
                            vessel = self.parse_openseamap_vessel(feature)
                            if vessel:
                                vessels.append(vessel)
                
        except Exception as e:
            logger.error(f"Error fetching from OpenSeaMap: {e}")
        
        return vessels
    
    def generate_search_grid(self, area: Dict[str, Any], grid_size: int = 3) -> List[Dict[str, float]]:
        """Generate a grid of search points within an area"""
        points = []
        radius_deg = area['radius'] / 111  # Convert km to approximate degrees
        
        for i in range(grid_size):
            for j in range(grid_size):
                lat_offset = (i - grid_size//2) * (radius_deg / grid_size)
                lng_offset = (j - grid_size//2) * (radius_deg / grid_size)
                
                points.append({
                    'lat': area['lat'] + lat_offset,
                    'lng': area['lng'] + lng_offset
                })
        
        return points
    
    def parse_marinetraffic_vessel(self, vessel_data: List) -> Optional[VesselPosition]:
        """Parse vessel data from MarineTraffic format"""
        try:
            if len(vessel_data) >= 10:
                return VesselPosition(
                    vessel_id=f"MT_{vessel_data[0]}",
                    mmsi=str(vessel_data[0]),
                    vessel_name=vessel_data[1] or f"Vessel_{vessel_data[0]}",
                    vessel_type=vessel_data[2] or "Unknown",
                    latitude=float(vessel_data[3]),
                    longitude=float(vessel_data[4]),
                    speed_knots=float(vessel_data[5] or 0),
                    heading_degrees=int(vessel_data[6] or 0),
                    timestamp=datetime.now(),
                    source="marinetraffic",
                    imo_number=vessel_data[7] if len(vessel_data) > 7 else None,
                    destination=vessel_data[8] if len(vessel_data) > 8 else None
                )
        except (ValueError, IndexError, TypeError) as e:
            logger.debug(f"Error parsing MarineTraffic vessel data: {e}")
        return None
    
    def parse_vesselfinder_vessel(self, vessel_data: Dict) -> Optional[VesselPosition]:
        """Parse vessel data from VesselFinder format"""
        try:
            return VesselPosition(
                vessel_id=f"VF_{vessel_data.get('mmsi', 'unknown')}",
                mmsi=str(vessel_data.get('mmsi', '')),
                vessel_name=vessel_data.get('name', f"Vessel_{vessel_data.get('mmsi', 'unknown')}"),
                vessel_type=vessel_data.get('type', 'Unknown'),
                latitude=float(vessel_data.get('lat', 0)),
                longitude=float(vessel_data.get('lng', 0)),
                speed_knots=float(vessel_data.get('speed', 0)),
                heading_degrees=int(vessel_data.get('heading', 0)),
                timestamp=datetime.now(),
                source="vesselfinder",
                imo_number=vessel_data.get('imo'),
                destination=vessel_data.get('destination'),
                eta=self.parse_eta(vessel_data.get('eta')) if vessel_data.get('eta') else None
            )
        except (ValueError, TypeError) as e:
            logger.debug(f"Error parsing VesselFinder vessel data: {e}")
        return None
    
    def parse_myshiptracking_vessel(self, vessel_data: Dict) -> Optional[VesselPosition]:
        """Parse vessel data from MyShipTracking format"""
        try:
            return VesselPosition(
                vessel_id=f"MST_{vessel_data.get('mmsi', 'unknown')}",
                mmsi=str(vessel_data.get('mmsi', '')),
                vessel_name=vessel_data.get('shipname', f"Vessel_{vessel_data.get('mmsi', 'unknown')}"),
                vessel_type=vessel_data.get('shiptype', 'Unknown'),
                latitude=float(vessel_data.get('latitude', 0)),
                longitude=float(vessel_data.get('longitude', 0)),
                speed_knots=float(vessel_data.get('speed', 0)),
                heading_degrees=int(vessel_data.get('course', 0)),
                timestamp=datetime.now(),
                source="myshiptracking",
                imo_number=vessel_data.get('imo'),
                navigational_status=vessel_data.get('navstat')
            )
        except (ValueError, TypeError) as e:
            logger.debug(f"Error parsing MyShipTracking vessel data: {e}")
        return None
    
    def parse_openseamap_vessel(self, feature_data: Dict) -> Optional[VesselPosition]:
        """Parse vessel data from OpenSeaMap format"""
        try:
            geometry = feature_data.get('geometry', {})
            properties = feature_data.get('properties', {})
            
            if geometry.get('type') == 'Point':
                coordinates = geometry.get('coordinates', [])
                if len(coordinates) >= 2:
                    return VesselPosition(
                        vessel_id=f"OSM_{properties.get('mmsi', 'unknown')}",
                        mmsi=str(properties.get('mmsi', '')),
                        vessel_name=properties.get('name', f"Vessel_{properties.get('mmsi', 'unknown')}"),
                        vessel_type=properties.get('vessel_type', 'Unknown'),
                        latitude=float(coordinates[1]),
                        longitude=float(coordinates[0]),
                        speed_knots=float(properties.get('speed', 0)),
                        heading_degrees=int(properties.get('heading', 0)),
                        timestamp=datetime.now(),
                        source="openseamap"
                    )
        except (ValueError, TypeError) as e:
            logger.debug(f"Error parsing OpenSeaMap vessel data: {e}")
        return None
    
    async def process_vessel_batch(self, vessels: List[VesselPosition], source: str):
        """Process and store a batch of vessel positions"""
        if not vessels:
            return
        
        try:
            # Filter out duplicates and invalid positions
            valid_vessels = []
            for vessel in vessels:
                # Basic validation
                if (vessel.latitude != 0 and vessel.longitude != 0 and
                    -90 <= vessel.latitude <= 90 and -180 <= vessel.longitude <= 180):
                    
                    # Check for duplicates using vessel ID and recent timestamp
                    vessel_key = f"{vessel.mmsi}_{source}"
                    last_position = self.vessel_cache.get(vessel_key)
                    
                    if (not last_position or 
                        self.calculate_distance(vessel.latitude, vessel.longitude,
                                              last_position.latitude, last_position.longitude) > 0.01 or
                        (datetime.now() - last_position.timestamp).total_seconds() > 300):
                        
                        valid_vessels.append(vessel)
                        self.vessel_cache[vessel_key] = vessel
                        self.tracked_vessels.add(vessel.mmsi)
            
            if valid_vessels:
                # Store in database
                await self.store_vessel_positions(valid_vessels)
                
                # Update vessel registry
                await self.update_vessel_registry(valid_vessels)
                
                logger.debug(f"Stored {len(valid_vessels)} valid vessel positions from {source}")
        
        except Exception as e:
            logger.error(f"Error processing vessel batch: {e}")
    
    async def store_vessel_positions(self, vessels: List[VesselPosition]):
        """Store vessel positions in the database"""
        if not vessels:
            return
        
        try:
            values = []
            for vessel in vessels:
                values.append((
                    vessel.vessel_id,
                    vessel.mmsi,
                    f"POINT({vessel.longitude} {vessel.latitude})",
                    vessel.speed_knots,
                    vessel.heading_degrees,
                    vessel.timestamp,
                    vessel.source,
                    vessel.course_over_ground,
                    vessel.rate_of_turn,
                    vessel.navigational_status
                ))
            
            query = """
            INSERT INTO maritime.vessel_positions 
            (vessel_id, mmsi, coordinates, speed_knots, heading_degrees, timestamp, 
             data_source, course_over_ground, rate_of_turn, navigational_status)
            VALUES ($1, $2, $3::geography, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (vessel_id, timestamp) DO UPDATE SET
                coordinates = EXCLUDED.coordinates,
                speed_knots = EXCLUDED.speed_knots,
                heading_degrees = EXCLUDED.heading_degrees,
                data_source = EXCLUDED.data_source
            """
            
            async with self.db_manager.get_connection() as conn:
                await conn.executemany(query, values)
                
        except Exception as e:
            logger.error(f"Error storing vessel positions: {e}")
    
    async def update_vessel_registry(self, vessels: List[VesselPosition]):
        """Update the vessel registry with new vessel information"""
        try:
            for vessel in vessels:
                # Check if vessel exists in registry
                query = "SELECT vessel_id FROM maritime.vessels WHERE mmsi = $1"
                
                async with self.db_manager.get_connection() as conn:
                    existing = await conn.fetchval(query, vessel.mmsi)
                    
                    if not existing:
                        # Insert new vessel
                        insert_query = """
                        INSERT INTO maritime.vessels 
                        (vessel_id, mmsi, vessel_name, vessel_type, imo_number, 
                         gross_tonnage, length, beam, coordinates, created_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::geography, $10)
                        ON CONFLICT (mmsi) DO UPDATE SET
                            vessel_name = EXCLUDED.vessel_name,
                            vessel_type = EXCLUDED.vessel_type,
                            coordinates = EXCLUDED.coordinates
                        """
                        
                        await conn.execute(insert_query,
                            vessel.vessel_id,
                            vessel.mmsi,
                            vessel.vessel_name,
                            vessel.vessel_type,
                            vessel.imo_number,
                            vessel.gross_tonnage,
                            vessel.length,
                            vessel.beam,
                            f"POINT({vessel.longitude} {vessel.latitude})",
                            datetime.now()
                        )
        
        except Exception as e:
            logger.error(f"Error updating vessel registry: {e}")
    
    async def enhance_vessel_details_continuously(self):
        """Continuously enhance vessel details from multiple sources"""
        while True:
            try:
                # Get vessels that need detail enhancement
                query = """
                SELECT DISTINCT mmsi, vessel_name, vessel_type 
                FROM maritime.vessels 
                WHERE (imo_number IS NULL OR gross_tonnage IS NULL)
                AND created_at > NOW() - INTERVAL '7 days'
                LIMIT 100
                """
                
                async with self.db_manager.get_connection() as conn:
                    vessels_to_enhance = await conn.fetch(query)
                
                for vessel_record in vessels_to_enhance:
                    enhanced_details = await self.fetch_vessel_details(vessel_record['mmsi'])
                    
                    if enhanced_details:
                        await self.update_vessel_details(vessel_record['mmsi'], enhanced_details)
                    
                    # Rate limiting
                    await asyncio.sleep(2)
                
                # Sleep for 1 hour before next enhancement cycle
                await asyncio.sleep(3600)
                
            except Exception as e:
                logger.error(f"Error in vessel enhancement: {e}")
                await asyncio.sleep(300)
    
    async def validate_predictions_continuously(self):
        """Continuously validate AI predictions against actual vessel movements"""
        while True:
            try:
                # Get recent predictions to validate
                query = """
                SELECT p.prediction_id, p.vessel_id, p.output_prediction, p.prediction_timestamp
                FROM ai_models.predictions p
                WHERE p.prediction_type = 'vessel_movement'
                AND p.prediction_timestamp > NOW() - INTERVAL '24 hours'
                AND p.actual_outcome IS NULL
                LIMIT 50
                """
                
                async with self.db_manager.get_connection() as conn:
                    predictions = await conn.fetch(query)
                
                for prediction in predictions:
                    actual_outcome = await self.get_actual_vessel_outcome(
                        prediction['vessel_id'], 
                        prediction['prediction_timestamp']
                    )
                    
                    if actual_outcome:
                        accuracy_score = self.calculate_prediction_accuracy(
                            prediction['output_prediction'],
                            actual_outcome
                        )
                        
                        await self.update_prediction_accuracy(
                            prediction['prediction_id'],
                            actual_outcome,
                            accuracy_score
                        )
                
                # Sleep for 30 minutes before next validation cycle
                await asyncio.sleep(1800)
                
            except Exception as e:
                logger.error(f"Error in prediction validation: {e}")
                await asyncio.sleep(300)
    
    async def compile_vessel_histories_continuously(self):
        """Continuously compile vessel movement histories for AI training"""
        while True:
            try:
                # Compile histories for vessels with recent activity
                query = """
                SELECT DISTINCT vessel_id
                FROM maritime.vessel_positions
                WHERE timestamp > NOW() - INTERVAL '6 hours'
                LIMIT 200
                """
                
                async with self.db_manager.get_connection() as conn:
                    active_vessels = await conn.fetch(query)
                
                for vessel_record in active_vessels:
                    vessel_id = vessel_record['vessel_id']
                    
                    # Get vessel history
                    history = await self.get_vessel_movement_history(vessel_id, days=7)
                    
                    if len(history) >= 10:  # Minimum points for training
                        # Store compiled history for AI training
                        await self.store_vessel_training_data(vessel_id, history)
                
                # Sleep for 2 hours before next compilation cycle
                await asyncio.sleep(7200)
                
            except Exception as e:
                logger.error(f"Error in history compilation: {e}")
                await asyncio.sleep(600)
    
    async def get_vessel_movement_history(self, vessel_id: str, days: int = 7) -> List[Dict[str, Any]]:
        """Get vessel movement history for analysis"""
        try:
            query = """
            SELECT 
                ST_X(coordinates::geometry) as longitude,
                ST_Y(coordinates::geometry) as latitude,
                speed_knots,
                heading_degrees,
                timestamp,
                course_over_ground,
                navigational_status
            FROM maritime.vessel_positions
            WHERE vessel_id = $1
            AND timestamp > NOW() - INTERVAL '%s days'
            ORDER BY timestamp
            """ % days
            
            async with self.db_manager.get_connection() as conn:
                history = await conn.fetch(query, vessel_id)
            
            return [dict(record) for record in history]
            
        except Exception as e:
            logger.error(f"Error getting vessel history: {e}")
            return []
    
    async def get_tracking_statistics(self) -> Dict[str, Any]:
        """Get comprehensive tracking statistics"""
        try:
            async with self.db_manager.get_connection() as conn:
                # Total vessels tracked
                total_vessels = await conn.fetchval(
                    "SELECT COUNT(DISTINCT mmsi) FROM maritime.vessels"
                )
                
                # Recent positions
                recent_positions = await conn.fetchval("""
                    SELECT COUNT(*) FROM maritime.vessel_positions 
                    WHERE timestamp > NOW() - INTERVAL '1 hour'
                """)
                
                # Active vessels (moved in last 6 hours)
                active_vessels = await conn.fetchval("""
                    SELECT COUNT(DISTINCT vessel_id) FROM maritime.vessel_positions 
                    WHERE timestamp > NOW() - INTERVAL '6 hours'
                """)
                
                # Coverage by source
                coverage_by_source = await conn.fetch("""
                    SELECT data_source, COUNT(DISTINCT vessel_id) as vessel_count,
                           COUNT(*) as position_count
                    FROM maritime.vessel_positions 
                    WHERE timestamp > NOW() - INTERVAL '24 hours'
                    GROUP BY data_source
                """)
                
                # Geographic distribution
                geographic_coverage = await conn.fetch("""
                    SELECT 
                        CASE 
                            WHEN ST_X(coordinates::geometry) BETWEEN -180 AND -90 THEN 'Americas'
                            WHEN ST_X(coordinates::geometry) BETWEEN -90 AND 30 THEN 'Atlantic'
                            WHEN ST_X(coordinates::geometry) BETWEEN 30 AND 90 THEN 'Europe_Africa'
                            WHEN ST_X(coordinates::geometry) BETWEEN 90 AND 180 THEN 'Asia_Pacific'
                            ELSE 'Unknown'
                        END as region,
                        COUNT(DISTINCT vessel_id) as vessel_count
                    FROM maritime.vessel_positions 
                    WHERE timestamp > NOW() - INTERVAL '24 hours'
                    GROUP BY region
                """)
            
            return {
                'total_vessels_tracked': total_vessels,
                'recent_positions': recent_positions,
                'active_vessels': active_vessels,
                'tracked_vessel_count': len(self.tracked_vessels),
                'coverage_by_source': [dict(record) for record in coverage_by_source],
                'geographic_coverage': [dict(record) for record in geographic_coverage],
                'last_update': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting tracking statistics: {e}")
            return {}
    
    # Helper functions
    def calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two points in degrees"""
        return math.sqrt((lat2 - lat1)**2 + (lng2 - lng1)**2)
    
    def lng_to_tile_x(self, lng: float, zoom: int) -> int:
        """Convert longitude to tile X coordinate"""
        return int((lng + 180.0) / 360.0 * (1 << zoom))
    
    def lat_to_tile_y(self, lat: float, zoom: int) -> int:
        """Convert latitude to tile Y coordinate"""
        lat_rad = math.radians(lat)
        return int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * (1 << zoom))
    
    def parse_eta(self, eta_string: str) -> Optional[datetime]:
        """Parse ETA string to datetime"""
        try:
            # Handle various ETA formats
            if eta_string and eta_string.lower() != 'n/a':
                return datetime.fromisoformat(eta_string.replace('Z', '+00:00'))
        except:
            pass
        return None
