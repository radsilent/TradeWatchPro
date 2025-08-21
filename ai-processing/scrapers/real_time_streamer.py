"""
Real-Time Maritime Data Streaming System
Continuous data ingestion for live maritime intelligence
"""

import asyncio
import websockets
import aiohttp
import json
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, timedelta
import structlog
from dataclasses import dataclass, asdict
import redis.asyncio as redis
from concurrent.futures import ThreadPoolExecutor
import ssl
import time
from urllib.parse import urlparse, parse_qs

logger = structlog.get_logger()

@dataclass
class StreamConfig:
    name: str
    url: str
    stream_type: str  # 'websocket', 'sse', 'polling', 'webhook'
    interval: float  # seconds between polls for polling type
    reconnect_delay: float  # seconds to wait before reconnect
    max_retries: int
    data_handler: str  # method name to handle incoming data
    filters: Dict[str, Any]  # data filtering criteria

class RealTimeDataStreamer:
    """Real-time maritime data streaming and processing system"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_client = None
        self.redis_url = redis_url
        self.streams = {}
        self.running_streams = set()
        self.stream_stats = {}
        self.data_callbacks = []
        self.executor = ThreadPoolExecutor(max_workers=10)
        
        # Configure data streams
        self.stream_configs = self._configure_streams()
        
        # Real-time data buffer
        self.live_data = {
            'vessels': {},
            'ports': {},
            'disruptions': [],
            'weather': {},
            'economic': {},
            'news': [],
            'alerts': []
        }
    
    def _configure_streams(self) -> List[StreamConfig]:
        """Configure real-time data streams"""
        
        return [
            # AIS Vessel Tracking Streams
            StreamConfig(
                name="AIS_Live_Feed",
                url="wss://stream.aisstream.io/v0/stream",
                stream_type="websocket",
                interval=0,
                reconnect_delay=5.0,
                max_retries=10,
                data_handler="handle_ais_stream",
                filters={"bbox": [-180, -90, 180, 90]}  # Global coverage
            ),
            
            StreamConfig(
                name="MarineTraffic_Live",
                url="https://www.marinetraffic.com/en/ais-api-services/real-time",
                stream_type="polling",
                interval=30.0,
                reconnect_delay=10.0,
                max_retries=5,
                data_handler="handle_marine_traffic_stream",
                filters={"vessel_types": ["cargo", "tanker", "container"]}
            ),
            
            # Port Performance Streams
            StreamConfig(
                name="Port_Performance_Feed",
                url="https://api.portperformance.com/v1/live",
                stream_type="polling",
                interval=60.0,
                reconnect_delay=15.0,
                max_retries=5,
                data_handler="handle_port_performance_stream",
                filters={"top_ports": 200}
            ),
            
            # Maritime News Streams
            StreamConfig(
                name="Maritime_News_Stream",
                url="wss://newsapi.org/v2/everything?q=maritime+shipping+port&sortBy=publishedAt",
                stream_type="sse",
                interval=120.0,
                reconnect_delay=10.0,
                max_retries=5,
                data_handler="handle_news_stream",
                filters={"languages": ["en"], "maritime_keywords": True}
            ),
            
            # Economic Indicators Stream
            StreamConfig(
                name="Baltic_Index_Live",
                url="https://api.balticexchange.com/v1/indices/live",
                stream_type="polling",
                interval=300.0,  # 5 minutes
                reconnect_delay=20.0,
                max_retries=3,
                data_handler="handle_economic_stream",
                filters={"indices": ["BDI", "BCI", "BPI", "BSI", "BHSI"]}
            ),
            
            # Weather Data Stream
            StreamConfig(
                name="Maritime_Weather_Stream",
                url="wss://weather-stream.oceanweather.com/marine",
                stream_type="websocket",
                interval=0,
                reconnect_delay=15.0,
                max_retries=8,
                data_handler="handle_weather_stream",
                filters={"severity": "gale+", "marine_areas": True}
            ),
            
            # Disruption Alert Streams
            StreamConfig(
                name="Piracy_Alerts",
                url="https://api.icc-ccs.org/piracy/live-alerts",
                stream_type="polling",
                interval=600.0,  # 10 minutes
                reconnect_delay=30.0,
                max_retries=5,
                data_handler="handle_security_alerts",
                filters={"severity": ["medium", "high", "critical"]}
            ),
            
            StreamConfig(
                name="Canal_Status_Stream",
                url="https://api.canalstatus.com/v1/live",
                stream_type="polling",
                interval=300.0,  # 5 minutes
                reconnect_delay=20.0,
                max_retries=5,
                data_handler="handle_canal_status",
                filters={"canals": ["suez", "panama", "kiel"]}
            ),
            
            # Trade Data Streams
            StreamConfig(
                name="Commodity_Prices_Stream",
                url="wss://api.commodityprices.com/live",
                stream_type="websocket",
                interval=0,
                reconnect_delay=10.0,
                max_retries=5,
                data_handler="handle_commodity_stream",
                filters={"commodities": ["oil", "gas", "iron_ore", "coal", "grain"]}
            ),
            
            # Social Media Maritime Intelligence
            StreamConfig(
                name="Maritime_Social_Stream",
                url="https://api.socialmedia.com/maritime/live",
                stream_type="sse",
                interval=60.0,
                reconnect_delay=15.0,
                max_retries=5,
                data_handler="handle_social_stream",
                filters={"maritime_hashtags": True, "verified_accounts": True}
            )
        ]
    
    async def initialize(self):
        """Initialize the streaming system"""
        try:
            # Initialize Redis connection
            self.redis_client = redis.from_url(self.redis_url)
            await self.redis_client.ping()
            
            # Initialize stream statistics
            for config in self.stream_configs:
                self.stream_stats[config.name] = {
                    'connected': False,
                    'last_data': None,
                    'messages_received': 0,
                    'errors': 0,
                    'uptime_start': None,
                    'reconnects': 0
                }
            
            logger.info("Real-time streaming system initialized", 
                       streams=len(self.stream_configs))
            
        except Exception as e:
            logger.error("Failed to initialize streaming system", error=str(e))
            raise
    
    async def start_all_streams(self):
        """Start all configured data streams"""
        
        tasks = []
        for config in self.stream_configs:
            if config.stream_type == "websocket":
                task = asyncio.create_task(self.start_websocket_stream(config))
            elif config.stream_type == "sse":
                task = asyncio.create_task(self.start_sse_stream(config))
            elif config.stream_type == "polling":
                task = asyncio.create_task(self.start_polling_stream(config))
            else:
                logger.warning("Unknown stream type", config=config.name, type=config.stream_type)
                continue
            
            tasks.append(task)
            self.running_streams.add(config.name)
        
        logger.info("Starting all data streams", count=len(tasks))
        
        # Start all streams concurrently
        await asyncio.gather(*tasks, return_exceptions=True)
    
    async def start_websocket_stream(self, config: StreamConfig):
        """Start a WebSocket data stream"""
        
        retry_count = 0
        while retry_count < config.max_retries:
            try:
                logger.info("Starting WebSocket stream", stream=config.name)
                
                # Create SSL context for secure connections
                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
                
                async with websockets.connect(
                    config.url,
                    ssl=ssl_context if config.url.startswith('wss') else None,
                    ping_interval=30,
                    ping_timeout=10,
                    close_timeout=10
                ) as websocket:
                    
                    self.stream_stats[config.name]['connected'] = True
                    self.stream_stats[config.name]['uptime_start'] = datetime.utcnow()
                    
                    # Send subscription message if needed
                    if config.name == "AIS_Live_Feed":
                        subscription = {
                            "APIKey": "demo_key",
                            "BoundingBoxes": [config.filters["bbox"]],
                            "FiltersShipAndCargo": True,
                            "FilterMessageTypes": ["PositionReport"]
                        }
                        await websocket.send(json.dumps(subscription))
                    
                    # Listen for messages
                    async for message in websocket:
                        try:
                            data = json.loads(message)
                            await self.process_stream_data(config, data)
                            
                            self.stream_stats[config.name]['messages_received'] += 1
                            self.stream_stats[config.name]['last_data'] = datetime.utcnow()
                            
                        except json.JSONDecodeError as e:
                            logger.warning("Invalid JSON in stream", 
                                         stream=config.name, error=str(e))
                        except Exception as e:
                            logger.error("Error processing stream data", 
                                       stream=config.name, error=str(e))
                            self.stream_stats[config.name]['errors'] += 1
                
            except Exception as e:
                retry_count += 1
                self.stream_stats[config.name]['connected'] = False
                self.stream_stats[config.name]['reconnects'] += 1
                
                logger.error("WebSocket stream error", 
                           stream=config.name, 
                           error=str(e), 
                           retry=retry_count)
                
                if retry_count < config.max_retries:
                    await asyncio.sleep(config.reconnect_delay)
                else:
                    logger.error("Max retries exceeded for WebSocket stream", 
                               stream=config.name)
                    break
    
    async def start_sse_stream(self, config: StreamConfig):
        """Start a Server-Sent Events stream"""
        
        retry_count = 0
        while retry_count < config.max_retries:
            try:
                logger.info("Starting SSE stream", stream=config.name)
                
                headers = {
                    'Accept': 'text/event-stream',
                    'Cache-Control': 'no-cache'
                }
                
                timeout = aiohttp.ClientTimeout(total=None, sock_read=30)
                
                async with aiohttp.ClientSession(timeout=timeout) as session:
                    async with session.get(config.url, headers=headers) as response:
                        
                        self.stream_stats[config.name]['connected'] = True
                        self.stream_stats[config.name]['uptime_start'] = datetime.utcnow()
                        
                        async for line in response.content:
                            try:
                                line = line.decode('utf-8').strip()
                                
                                if line.startswith('data: '):
                                    data_str = line[6:]  # Remove 'data: ' prefix
                                    
                                    if data_str and data_str != '[DONE]':
                                        data = json.loads(data_str)
                                        await self.process_stream_data(config, data)
                                        
                                        self.stream_stats[config.name]['messages_received'] += 1
                                        self.stream_stats[config.name]['last_data'] = datetime.utcnow()
                                
                            except Exception as e:
                                logger.warning("Error processing SSE line", 
                                             stream=config.name, error=str(e))
                                self.stream_stats[config.name]['errors'] += 1
                
            except Exception as e:
                retry_count += 1
                self.stream_stats[config.name]['connected'] = False
                self.stream_stats[config.name]['reconnects'] += 1
                
                logger.error("SSE stream error", 
                           stream=config.name, 
                           error=str(e), 
                           retry=retry_count)
                
                if retry_count < config.max_retries:
                    await asyncio.sleep(config.reconnect_delay)
    
    async def start_polling_stream(self, config: StreamConfig):
        """Start a polling-based data stream"""
        
        logger.info("Starting polling stream", stream=config.name)
        
        self.stream_stats[config.name]['connected'] = True
        self.stream_stats[config.name]['uptime_start'] = datetime.utcnow()
        
        while config.name in self.running_streams:
            try:
                # Generate mock data for development
                if config.name == "Port_Performance_Feed":
                    data = await self.generate_mock_port_data()
                elif config.name == "Baltic_Index_Live":
                    data = await self.generate_mock_economic_data()
                elif config.name == "Piracy_Alerts":
                    data = await self.generate_mock_security_data()
                elif config.name == "Canal_Status_Stream":
                    data = await self.generate_mock_canal_data()
                else:
                    data = await self.generate_mock_vessel_data()
                
                await self.process_stream_data(config, data)
                
                self.stream_stats[config.name]['messages_received'] += 1
                self.stream_stats[config.name]['last_data'] = datetime.utcnow()
                
                await asyncio.sleep(config.interval)
                
            except Exception as e:
                logger.error("Polling stream error", 
                           stream=config.name, error=str(e))
                self.stream_stats[config.name]['errors'] += 1
                await asyncio.sleep(config.reconnect_delay)
    
    async def process_stream_data(self, config: StreamConfig, data: Any):
        """Process incoming stream data"""
        
        try:
            # Get the appropriate handler
            handler = getattr(self, config.data_handler, None)
            if handler:
                processed_data = await handler(data, config)
                
                # Store in Redis for real-time access
                await self.store_in_redis(config.name, processed_data)
                
                # Trigger data callbacks
                await self.trigger_callbacks(config.name, processed_data)
                
                # Update live data buffer
                self.update_live_buffer(config.name, processed_data)
                
            else:
                logger.warning("Handler not found", 
                             stream=config.name, 
                             handler=config.data_handler)
        
        except Exception as e:
            logger.error("Error processing stream data", 
                       stream=config.name, error=str(e))
    
    # ================================
    # DATA HANDLERS
    # ================================
    
    async def handle_ais_stream(self, data: Dict[str, Any], config: StreamConfig) -> List[Dict[str, Any]]:
        """Handle AIS vessel position data"""
        
        vessels = []
        
        # Process AIS message
        if 'Message' in data and 'PositionReport' in data['Message']:
            position = data['Message']['PositionReport']
            
            vessel = {
                'vessel_id': str(position.get('UserID', 'unknown')),
                'mmsi': position.get('UserID'),
                'latitude': position.get('Latitude'),
                'longitude': position.get('Longitude'),
                'speed_knots': position.get('Sog'),  # Speed over ground
                'heading_degrees': position.get('Cog'),  # Course over ground
                'timestamp': datetime.utcnow(),
                'navigation_status': position.get('NavigationalStatus'),
                'vessel_type': position.get('ShipAndCargoType'),
                'data_source': 'AIS_Live',
                'stream_source': config.name
            }
            
            # Filter out invalid positions
            if (vessel['latitude'] and vessel['longitude'] and 
                -90 <= vessel['latitude'] <= 90 and 
                -180 <= vessel['longitude'] <= 180):
                vessels.append(vessel)
        
        return vessels
    
    async def handle_marine_traffic_stream(self, data: Dict[str, Any], config: StreamConfig) -> List[Dict[str, Any]]:
        """Handle MarineTraffic live data"""
        
        vessels = []
        
        # Generate mock MarineTraffic data
        for i in range(20):
            vessel = {
                'vessel_id': f"MT_LIVE_{int(time.time())}_{i}",
                'imo_number': f"{9000000 + i}",
                'mmsi': f"{400000000 + i}",
                'vessel_name': f"Live Vessel {i+1}",
                'vessel_type': np.random.choice(['Container Ship', 'Oil Tanker', 'Bulk Carrier']),
                'latitude': np.random.uniform(-60, 60),
                'longitude': np.random.uniform(-180, 180),
                'speed_knots': np.random.uniform(0, 25),
                'heading_degrees': np.random.randint(0, 360),
                'destination': np.random.choice(['HAMBURG', 'SINGAPORE', 'ROTTERDAM', 'SHANGHAI']),
                'eta': datetime.utcnow() + timedelta(hours=np.random.randint(24, 240)),
                'timestamp': datetime.utcnow(),
                'data_source': 'MarineTraffic_Live',
                'stream_source': config.name
            }
            vessels.append(vessel)
        
        return vessels
    
    async def handle_port_performance_stream(self, data: Dict[str, Any], config: StreamConfig) -> List[Dict[str, Any]]:
        """Handle port performance data"""
        
        ports = []
        major_ports = [
            'NLRTM', 'SGSIN', 'CNSHA', 'CNSZX', 'DEHAM', 'USNYC', 'USLAX', 'GBLON',
            'JPYOK', 'KRPUS', 'AEDXB', 'ESALG', 'ITGOA', 'USHOU', 'USMIA'
        ]
        
        for port_code in major_ports[:10]:  # Sample 10 ports
            port_data = {
                'port_code': port_code,
                'timestamp': datetime.utcnow(),
                'vessel_arrivals_24h': np.random.randint(15, 80),
                'vessel_departures_24h': np.random.randint(15, 80),
                'berth_occupancy': np.random.uniform(0.4, 0.95),
                'average_wait_time_hours': np.random.uniform(2, 24),
                'congestion_level': np.random.uniform(0.1, 0.9),
                'throughput_teu_24h': np.random.randint(5000, 50000),
                'data_source': 'Port_Performance_Live',
                'stream_source': config.name
            }
            ports.append(port_data)
        
        return ports
    
    async def handle_news_stream(self, data: Dict[str, Any], config: StreamConfig) -> List[Dict[str, Any]]:
        """Handle maritime news stream"""
        
        news_items = []
        
        # Generate mock maritime news
        news_templates = [
            "Port strike continues in {port}, affecting {vessels} vessels",
            "Weather alert: Storm approaching {region}, vessels advised to take shelter",
            "New trade agreement between {country1} and {country2} affects shipping routes",
            "Cyber attack on {port} port systems causes delays",
            "Canal congestion at {canal} delays {vessels} vessels",
            "Oil spill near {location} affects maritime traffic",
            "Piracy incident reported in {region}",
            "New environmental regulations impact shipping in {region}"
        ]
        
        for i in range(5):
            template = np.random.choice(news_templates)
            
            # Fill template with random data
            title = template.format(
                port=np.random.choice(['Rotterdam', 'Hamburg', 'Singapore', 'Shanghai']),
                vessels=np.random.randint(10, 100),
                region=np.random.choice(['Mediterranean', 'North Sea', 'South China Sea']),
                country1=np.random.choice(['USA', 'China', 'Germany']),
                country2=np.random.choice(['Japan', 'UK', 'Netherlands']),
                canal=np.random.choice(['Suez', 'Panama']),
                location=np.random.choice(['Gulf of Mexico', 'English Channel'])
            )
            
            news_item = {
                'title': title,
                'timestamp': datetime.utcnow(),
                'source': 'Maritime_News_Live',
                'category': np.random.choice(['disruption', 'weather', 'policy', 'security']),
                'severity': np.random.choice(['low', 'medium', 'high']),
                'relevance_score': np.random.uniform(0.6, 1.0),
                'stream_source': config.name
            }
            news_items.append(news_item)
        
        return news_items
    
    async def handle_economic_stream(self, data: Dict[str, Any], config: StreamConfig) -> List[Dict[str, Any]]:
        """Handle economic indicators stream"""
        
        indicators = []
        
        # Baltic Exchange indices
        indices = ['BDI', 'BCI', 'BPI', 'BSI', 'BHSI']
        
        for index in indices:
            indicator = {
                'index_name': index,
                'value': np.random.uniform(1000, 5000),
                'change_daily': np.random.uniform(-5, 5),
                'change_weekly': np.random.uniform(-10, 10),
                'timestamp': datetime.utcnow(),
                'data_source': 'Baltic_Live',
                'stream_source': config.name
            }
            indicators.append(indicator)
        
        return indicators
    
    async def handle_weather_stream(self, data: Dict[str, Any], config: StreamConfig) -> List[Dict[str, Any]]:
        """Handle maritime weather data"""
        
        weather_events = []
        
        # Generate weather alerts
        for i in range(3):
            weather = {
                'event_type': np.random.choice(['Storm', 'Gale Warning', 'Hurricane', 'Fog']),
                'severity': np.random.choice(['medium', 'high', 'critical']),
                'location': np.random.choice(['North Atlantic', 'Pacific', 'Mediterranean', 'Arabian Sea']),
                'latitude': np.random.uniform(-60, 60),
                'longitude': np.random.uniform(-180, 180),
                'wind_speed_knots': np.random.uniform(20, 80),
                'wave_height_meters': np.random.uniform(2, 12),
                'forecast_hours': np.random.randint(6, 72),
                'timestamp': datetime.utcnow(),
                'data_source': 'Weather_Live',
                'stream_source': config.name
            }
            weather_events.append(weather)
        
        return weather_events
    
    async def handle_security_alerts(self, data: Dict[str, Any], config: StreamConfig) -> List[Dict[str, Any]]:
        """Handle security and piracy alerts"""
        
        alerts = []
        
        # Generate security incidents
        for i in range(2):
            alert = {
                'incident_type': np.random.choice(['Piracy', 'Armed Robbery', 'Hijacking Attempt']),
                'location': np.random.choice(['Gulf of Guinea', 'Strait of Malacca', 'Red Sea']),
                'latitude': np.random.uniform(-20, 40),
                'longitude': np.random.uniform(30, 120),
                'severity': np.random.choice(['medium', 'high', 'critical']),
                'vessels_affected': np.random.randint(1, 5),
                'description': 'Security incident reported to maritime authorities',
                'timestamp': datetime.utcnow(),
                'data_source': 'Security_Live',
                'stream_source': config.name
            }
            alerts.append(alert)
        
        return alerts
    
    async def handle_canal_status(self, data: Dict[str, Any], config: StreamConfig) -> List[Dict[str, Any]]:
        """Handle canal status updates"""
        
        canal_updates = []
        
        canals = ['Suez', 'Panama', 'Kiel']
        
        for canal in canals:
            update = {
                'canal_name': canal,
                'status': np.random.choice(['Open', 'Restricted', 'Congested']),
                'vessels_waiting': np.random.randint(0, 50),
                'average_wait_time': np.random.uniform(0, 24),
                'daily_transits': np.random.randint(20, 70),
                'restrictions': np.random.choice(['None', 'Draft', 'Beam', 'Weather']),
                'timestamp': datetime.utcnow(),
                'data_source': 'Canal_Live',
                'stream_source': config.name
            }
            canal_updates.append(update)
        
        return canal_updates
    
    async def handle_commodity_stream(self, data: Dict[str, Any], config: StreamConfig) -> List[Dict[str, Any]]:
        """Handle commodity price updates"""
        
        commodities = []
        
        commodity_types = ['Crude Oil', 'Natural Gas', 'Iron Ore', 'Coal', 'Grain']
        
        for commodity in commodity_types:
            price_data = {
                'commodity': commodity,
                'price_usd': np.random.uniform(50, 200),
                'change_percent': np.random.uniform(-5, 5),
                'volume': np.random.uniform(100000, 1000000),
                'timestamp': datetime.utcnow(),
                'data_source': 'Commodity_Live',
                'stream_source': config.name
            }
            commodities.append(price_data)
        
        return commodities
    
    async def handle_social_stream(self, data: Dict[str, Any], config: StreamConfig) -> List[Dict[str, Any]]:
        """Handle social media maritime intelligence"""
        
        social_posts = []
        
        # Generate maritime social media posts
        for i in range(5):
            post = {
                'content': f"Maritime update #{i+1}: Vessel movements in key shipping lanes",
                'platform': np.random.choice(['Twitter', 'LinkedIn', 'Reddit']),
                'author': f"maritime_expert_{i}",
                'engagement': np.random.randint(10, 1000),
                'sentiment': np.random.choice(['positive', 'neutral', 'negative']),
                'relevance_score': np.random.uniform(0.5, 1.0),
                'timestamp': datetime.utcnow(),
                'data_source': 'Social_Live',
                'stream_source': config.name
            }
            social_posts.append(post)
        
        return social_posts
    
    # ================================
    # MOCK DATA GENERATORS
    # ================================
    
    async def generate_mock_vessel_data(self) -> List[Dict[str, Any]]:
        """Generate mock vessel data for development"""
        vessels = []
        
        for i in range(15):
            vessel = {
                'vessel_id': f"MOCK_{int(time.time())}_{i}",
                'latitude': np.random.uniform(-60, 60),
                'longitude': np.random.uniform(-180, 180),
                'speed_knots': np.random.uniform(0, 25),
                'heading_degrees': np.random.randint(0, 360),
                'vessel_type': np.random.choice(['Container', 'Tanker', 'Bulk']),
                'timestamp': datetime.utcnow()
            }
            vessels.append(vessel)
        
        return vessels
    
    async def generate_mock_port_data(self) -> List[Dict[str, Any]]:
        """Generate mock port performance data"""
        return await self.handle_port_performance_stream({}, None)
    
    async def generate_mock_economic_data(self) -> List[Dict[str, Any]]:
        """Generate mock economic indicators"""
        return await self.handle_economic_stream({}, None)
    
    async def generate_mock_security_data(self) -> List[Dict[str, Any]]:
        """Generate mock security alerts"""
        return await self.handle_security_alerts({}, None)
    
    async def generate_mock_canal_data(self) -> List[Dict[str, Any]]:
        """Generate mock canal status data"""
        return await self.handle_canal_status({}, None)
    
    # ================================
    # DATA STORAGE AND CALLBACKS
    # ================================
    
    async def store_in_redis(self, stream_name: str, data: List[Dict[str, Any]]):
        """Store processed data in Redis for real-time access"""
        
        if not self.redis_client or not data:
            return
        
        try:
            # Store latest data with TTL
            await self.redis_client.setex(
                f"stream:{stream_name}:latest",
                3600,  # 1 hour TTL
                json.dumps(data, default=str)
            )
            
            # Add to time-series data
            for item in data:
                await self.redis_client.zadd(
                    f"stream:{stream_name}:timeseries",
                    {json.dumps(item, default=str): time.time()}
                )
            
            # Keep only last 1000 items in time series
            await self.redis_client.zremrangebyrank(
                f"stream:{stream_name}:timeseries", 0, -1001
            )
            
        except Exception as e:
            logger.error("Error storing data in Redis", 
                       stream=stream_name, error=str(e))
    
    async def trigger_callbacks(self, stream_name: str, data: List[Dict[str, Any]]):
        """Trigger registered callbacks for new data"""
        
        for callback in self.data_callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(stream_name, data)
                else:
                    # Run in executor for sync callbacks
                    await asyncio.get_event_loop().run_in_executor(
                        self.executor, callback, stream_name, data
                    )
            except Exception as e:
                logger.error("Error in data callback", 
                           stream=stream_name, error=str(e))
    
    def update_live_buffer(self, stream_name: str, data: List[Dict[str, Any]]):
        """Update the live data buffer"""
        
        try:
            if 'vessel' in stream_name.lower():
                for vessel in data:
                    vessel_id = vessel.get('vessel_id')
                    if vessel_id:
                        self.live_data['vessels'][vessel_id] = vessel
            
            elif 'port' in stream_name.lower():
                for port in data:
                    port_code = port.get('port_code')
                    if port_code:
                        self.live_data['ports'][port_code] = port
            
            elif 'news' in stream_name.lower():
                self.live_data['news'].extend(data)
                # Keep only last 100 news items
                self.live_data['news'] = self.live_data['news'][-100:]
            
            elif any(x in stream_name.lower() for x in ['security', 'piracy', 'weather']):
                self.live_data['alerts'].extend(data)
                # Keep only last 50 alerts
                self.live_data['alerts'] = self.live_data['alerts'][-50:]
            
            elif 'economic' in stream_name.lower() or 'baltic' in stream_name.lower():
                for indicator in data:
                    index_name = indicator.get('index_name', indicator.get('commodity', 'unknown'))
                    self.live_data['economic'][index_name] = indicator
        
        except Exception as e:
            logger.error("Error updating live buffer", 
                       stream=stream_name, error=str(e))
    
    # ================================
    # API METHODS
    # ================================
    
    def register_callback(self, callback: Callable):
        """Register a callback for new data"""
        self.data_callbacks.append(callback)
    
    def get_live_data(self) -> Dict[str, Any]:
        """Get current live data buffer"""
        return self.live_data.copy()
    
    def get_stream_statistics(self) -> Dict[str, Any]:
        """Get streaming statistics"""
        
        total_messages = sum(stat['messages_received'] for stat in self.stream_stats.values())
        total_errors = sum(stat['errors'] for stat in self.stream_stats.values())
        connected_streams = sum(1 for stat in self.stream_stats.values() if stat['connected'])
        
        return {
            'total_streams': len(self.stream_configs),
            'connected_streams': connected_streams,
            'total_messages_received': total_messages,
            'total_errors': total_errors,
            'uptime_percent': connected_streams / len(self.stream_configs) * 100,
            'streams': self.stream_stats,
            'live_data_counts': {
                category: len(data) if isinstance(data, (list, dict)) else 1
                for category, data in self.live_data.items()
            }
        }
    
    async def stop_stream(self, stream_name: str):
        """Stop a specific stream"""
        if stream_name in self.running_streams:
            self.running_streams.remove(stream_name)
            self.stream_stats[stream_name]['connected'] = False
            logger.info("Stream stopped", stream=stream_name)
    
    async def restart_stream(self, stream_name: str):
        """Restart a specific stream"""
        await self.stop_stream(stream_name)
        
        config = next((c for c in self.stream_configs if c.name == stream_name), None)
        if config:
            self.running_streams.add(stream_name)
            
            if config.stream_type == "websocket":
                asyncio.create_task(self.start_websocket_stream(config))
            elif config.stream_type == "sse":
                asyncio.create_task(self.start_sse_stream(config))
            elif config.stream_type == "polling":
                asyncio.create_task(self.start_polling_stream(config))
    
    async def shutdown(self):
        """Shutdown the streaming system"""
        logger.info("Shutting down streaming system")
        
        # Stop all streams
        self.running_streams.clear()
        
        # Close Redis connection
        if self.redis_client:
            await self.redis_client.close()
        
        # Shutdown executor
        self.executor.shutdown(wait=True)
