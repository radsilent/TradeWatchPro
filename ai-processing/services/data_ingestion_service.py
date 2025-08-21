"""
Data Ingestion Service for TradeWatch
Orchestrates real-time streaming, batch processing, and AI training
"""

import asyncio
import structlog
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from services.database import DatabaseManager
from services.model_manager import ModelManager
from scrapers.real_time_streamer import RealTimeDataStreamer
from scrapers.maritime_data_scraper import MaritimeDataScraper
import json

logger = structlog.get_logger()

class DataIngestionService:
    """Comprehensive data ingestion and processing service"""
    
    def __init__(self, db_manager: DatabaseManager, model_manager: ModelManager):
        self.db_manager = db_manager
        self.model_manager = model_manager
        self.real_time_streamer = RealTimeDataStreamer()
        self.batch_scraper = MaritimeDataScraper()
        
        # Processing statistics
        self.ingestion_stats = {
            'total_vessels_processed': 0,
            'total_ports_processed': 0,
            'total_disruptions_detected': 0,
            'total_predictions_made': 0,
            'last_batch_process': None,
            'real_time_messages': 0,
            'ai_training_runs': 0,
            'data_quality_score': 0.0,
            'processing_errors': 0
        }
        
        # Data buffers for batch processing
        self.batch_buffers = {
            'vessels': [],
            'ports': [],
            'disruptions': [],
            'economic': [],
            'weather': [],
            'news': []
        }
        
        # AI training queue
        self.training_queue = []
        self.training_in_progress = False
        
        # Data quality thresholds
        self.quality_thresholds = {
            'vessel_position_accuracy': 0.95,
            'timestamp_freshness_minutes': 30,
            'coordinate_validity': 0.99,
            'duplicate_rate_threshold': 0.1,
            'missing_data_threshold': 0.05
        }
    
    async def initialize(self):
        """Initialize the data ingestion service"""
        
        logger.info("Initializing Data Ingestion Service")
        
        try:
            # Initialize real-time streamer
            await self.real_time_streamer.initialize()
            
            # Initialize batch scraper
            await self.batch_scraper.initialize()
            
            # Register callbacks for real-time data
            self.real_time_streamer.register_callback(self.process_real_time_data)
            
            # Start background tasks
            asyncio.create_task(self.batch_processing_loop())
            asyncio.create_task(self.ai_training_loop())
            asyncio.create_task(self.data_quality_monitoring())
            asyncio.create_task(self.performance_optimization())
            
            logger.info("Data Ingestion Service initialized successfully")
            
        except Exception as e:
            logger.error("Failed to initialize Data Ingestion Service", error=str(e))
            raise
    
    async def start_real_time_ingestion(self):
        """Start real-time data streaming"""
        
        logger.info("Starting real-time data ingestion")
        
        # Start all real-time streams
        await self.real_time_streamer.start_all_streams()
    
    async def process_real_time_data(self, stream_name: str, data: List[Dict[str, Any]]):
        """Process incoming real-time data"""
        
        try:
            self.ingestion_stats['real_time_messages'] += len(data)
            
            # Data validation and cleaning
            cleaned_data = await self.validate_and_clean_data(data, stream_name)
            
            if not cleaned_data:
                return
            
            # Store in database
            await self.store_real_time_data(stream_name, cleaned_data)
            
            # Add to batch buffers for AI processing
            self.add_to_batch_buffers(stream_name, cleaned_data)
            
            # Trigger immediate AI processing for critical events
            await self.check_for_critical_events(stream_name, cleaned_data)
            
            # Update processing statistics
            await self.update_processing_stats(stream_name, cleaned_data)
            
            logger.debug("Real-time data processed", 
                        stream=stream_name, 
                        items=len(cleaned_data))
            
        except Exception as e:
            self.ingestion_stats['processing_errors'] += 1
            logger.error("Error processing real-time data", 
                       stream=stream_name, error=str(e))
    
    async def validate_and_clean_data(self, data: List[Dict[str, Any]], 
                                    stream_name: str) -> List[Dict[str, Any]]:
        """Validate and clean incoming data"""
        
        cleaned_data = []
        
        for item in data:
            try:
                # Basic validation
                if not item or not isinstance(item, dict):
                    continue
                
                # Vessel data validation
                if 'vessel' in stream_name.lower():
                    if self.validate_vessel_data(item):
                        cleaned_item = self.clean_vessel_data(item)
                        if cleaned_item:
                            cleaned_data.append(cleaned_item)
                
                # Port data validation
                elif 'port' in stream_name.lower():
                    if self.validate_port_data(item):
                        cleaned_item = self.clean_port_data(item)
                        if cleaned_item:
                            cleaned_data.append(cleaned_item)
                
                # News data validation
                elif 'news' in stream_name.lower():
                    if self.validate_news_data(item):
                        cleaned_item = self.clean_news_data(item)
                        if cleaned_item:
                            cleaned_data.append(cleaned_item)
                
                # Economic data validation
                elif any(x in stream_name.lower() for x in ['economic', 'baltic', 'commodity']):
                    if self.validate_economic_data(item):
                        cleaned_item = self.clean_economic_data(item)
                        if cleaned_item:
                            cleaned_data.append(cleaned_item)
                
                # Weather/alert data validation
                elif any(x in stream_name.lower() for x in ['weather', 'security', 'alert']):
                    if self.validate_alert_data(item):
                        cleaned_item = self.clean_alert_data(item)
                        if cleaned_item:
                            cleaned_data.append(cleaned_item)
                
                else:
                    # Generic validation
                    cleaned_data.append(item)
                    
            except Exception as e:
                logger.warning("Error validating data item", 
                             stream=stream_name, error=str(e))
                continue
        
        return cleaned_data
    
    def validate_vessel_data(self, item: Dict[str, Any]) -> bool:
        """Validate vessel data"""
        
        # Check required fields
        required_fields = ['latitude', 'longitude', 'timestamp']
        if not all(field in item for field in required_fields):
            return False
        
        # Validate coordinates
        lat = item.get('latitude')
        lon = item.get('longitude')
        
        if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
            return False
        
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            return False
        
        # Validate speed if present
        speed = item.get('speed_knots')
        if speed is not None and (not isinstance(speed, (int, float)) or speed < 0 or speed > 50):
            return False
        
        # Validate timestamp freshness
        timestamp = item.get('timestamp')
        if isinstance(timestamp, str):
            try:
                timestamp = pd.to_datetime(timestamp)
            except:
                return False
        
        if isinstance(timestamp, datetime):
            age_minutes = (datetime.utcnow() - timestamp).total_seconds() / 60
            if age_minutes > self.quality_thresholds['timestamp_freshness_minutes']:
                return False
        
        return True
    
    def clean_vessel_data(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Clean and standardize vessel data"""
        
        try:
            cleaned = {
                'vessel_id': str(item.get('vessel_id', item.get('mmsi', 'unknown'))),
                'mmsi': item.get('mmsi'),
                'imo_number': item.get('imo_number'),
                'vessel_name': item.get('vessel_name', '').strip(),
                'vessel_type': item.get('vessel_type', '').strip(),
                'latitude': float(item['latitude']),
                'longitude': float(item['longitude']),
                'speed_knots': float(item.get('speed_knots', 0)) if item.get('speed_knots') is not None else None,
                'heading_degrees': int(item.get('heading_degrees', 0)) if item.get('heading_degrees') is not None else None,
                'timestamp': pd.to_datetime(item['timestamp']) if isinstance(item['timestamp'], str) else item['timestamp'],
                'data_source': item.get('data_source', item.get('stream_source', 'unknown')),
                'data_quality_score': self.calculate_vessel_quality_score(item),
                'processed_at': datetime.utcnow()
            }
            
            # Add derived fields
            cleaned['position_hash'] = hash(f"{cleaned['latitude']:.4f},{cleaned['longitude']:.4f}")
            
            return cleaned
            
        except Exception as e:
            logger.warning("Error cleaning vessel data", error=str(e))
            return None
    
    def validate_port_data(self, item: Dict[str, Any]) -> bool:
        """Validate port performance data"""
        
        required_fields = ['timestamp']
        if not all(field in item for field in required_fields):
            return False
        
        # Validate numeric fields
        numeric_fields = ['berth_occupancy', 'congestion_level', 'vessel_arrivals_24h']
        for field in numeric_fields:
            if field in item:
                value = item[field]
                if not isinstance(value, (int, float)) or value < 0:
                    return False
        
        return True
    
    def clean_port_data(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Clean and standardize port data"""
        
        try:
            cleaned = {
                'port_code': item.get('port_code', 'unknown').upper(),
                'port_name': item.get('port_name', '').strip(),
                'timestamp': pd.to_datetime(item['timestamp']) if isinstance(item['timestamp'], str) else item['timestamp'],
                'vessel_arrivals_24h': int(item.get('vessel_arrivals_24h', 0)),
                'vessel_departures_24h': int(item.get('vessel_departures_24h', 0)),
                'berth_occupancy': float(item.get('berth_occupancy', 0)),
                'congestion_level': float(item.get('congestion_level', 0)),
                'average_wait_time_hours': float(item.get('average_wait_time_hours', 0)),
                'throughput_teu_24h': int(item.get('throughput_teu_24h', 0)),
                'data_source': item.get('data_source', item.get('stream_source', 'unknown')),
                'data_quality_score': self.calculate_port_quality_score(item),
                'processed_at': datetime.utcnow()
            }
            
            return cleaned
            
        except Exception as e:
            logger.warning("Error cleaning port data", error=str(e))
            return None
    
    def validate_news_data(self, item: Dict[str, Any]) -> bool:
        """Validate news data"""
        
        required_fields = ['title', 'timestamp']
        if not all(field in item for field in required_fields):
            return False
        
        # Check title length
        title = item.get('title', '')
        if len(title.strip()) < 10:
            return False
        
        return True
    
    def clean_news_data(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Clean and standardize news data"""
        
        try:
            cleaned = {
                'title': item['title'].strip(),
                'content': item.get('content', item.get('description', '')).strip(),
                'timestamp': pd.to_datetime(item['timestamp']) if isinstance(item['timestamp'], str) else item['timestamp'],
                'source': item.get('source', 'unknown'),
                'category': item.get('category', 'general'),
                'severity': item.get('severity', 'low'),
                'relevance_score': float(item.get('relevance_score', 0.5)),
                'sentiment': item.get('sentiment', 'neutral'),
                'data_source': item.get('data_source', item.get('stream_source', 'unknown')),
                'processed_at': datetime.utcnow()
            }
            
            # Extract keywords for AI processing
            cleaned['keywords'] = self.extract_maritime_keywords(cleaned['title'] + ' ' + cleaned['content'])
            
            return cleaned
            
        except Exception as e:
            logger.warning("Error cleaning news data", error=str(e))
            return None
    
    def validate_economic_data(self, item: Dict[str, Any]) -> bool:
        """Validate economic indicator data"""
        
        required_fields = ['timestamp']
        if not all(field in item for field in required_fields):
            return False
        
        # Validate numeric values
        if 'value' in item:
            if not isinstance(item['value'], (int, float)):
                return False
        
        return True
    
    def clean_economic_data(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Clean and standardize economic data"""
        
        try:
            cleaned = {
                'indicator_name': item.get('index_name', item.get('commodity', 'unknown')),
                'value': float(item.get('value', item.get('price_usd', 0))),
                'change_daily': float(item.get('change_daily', item.get('change_percent', 0))),
                'change_weekly': float(item.get('change_weekly', 0)),
                'timestamp': pd.to_datetime(item['timestamp']) if isinstance(item['timestamp'], str) else item['timestamp'],
                'unit': item.get('unit', 'index'),
                'data_source': item.get('data_source', item.get('stream_source', 'unknown')),
                'processed_at': datetime.utcnow()
            }
            
            return cleaned
            
        except Exception as e:
            logger.warning("Error cleaning economic data", error=str(e))
            return None
    
    def validate_alert_data(self, item: Dict[str, Any]) -> bool:
        """Validate alert/weather data"""
        
        required_fields = ['timestamp']
        if not all(field in item for field in required_fields):
            return False
        
        return True
    
    def clean_alert_data(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Clean and standardize alert data"""
        
        try:
            cleaned = {
                'alert_type': item.get('event_type', item.get('incident_type', 'unknown')),
                'severity': item.get('severity', 'medium'),
                'location': item.get('location', 'unknown'),
                'latitude': float(item.get('latitude', 0)) if item.get('latitude') else None,
                'longitude': float(item.get('longitude', 0)) if item.get('longitude') else None,
                'description': item.get('description', item.get('title', '')),
                'timestamp': pd.to_datetime(item['timestamp']) if isinstance(item['timestamp'], str) else item['timestamp'],
                'data_source': item.get('data_source', item.get('stream_source', 'unknown')),
                'processed_at': datetime.utcnow()
            }
            
            return cleaned
            
        except Exception as e:
            logger.warning("Error cleaning alert data", error=str(e))
            return None
    
    def calculate_vessel_quality_score(self, item: Dict[str, Any]) -> float:
        """Calculate data quality score for vessel data"""
        
        score = 1.0
        
        # Penalize for missing optional fields
        optional_fields = ['vessel_name', 'vessel_type', 'speed_knots', 'heading_degrees']
        missing_fields = sum(1 for field in optional_fields if not item.get(field))
        score -= (missing_fields / len(optional_fields)) * 0.2
        
        # Bonus for additional data
        if item.get('imo_number'):
            score += 0.1
        if item.get('destination'):
            score += 0.1
        
        return max(0.0, min(1.0, score))
    
    def calculate_port_quality_score(self, item: Dict[str, Any]) -> float:
        """Calculate data quality score for port data"""
        
        score = 1.0
        
        # Check for realistic values
        berth_occupancy = item.get('berth_occupancy', 0)
        if berth_occupancy > 1.0:
            score -= 0.2
        
        congestion = item.get('congestion_level', 0)
        if congestion > 1.0:
            score -= 0.2
        
        return max(0.0, min(1.0, score))
    
    def extract_maritime_keywords(self, text: str) -> List[str]:
        """Extract maritime-relevant keywords from text"""
        
        maritime_keywords = [
            'port', 'vessel', 'ship', 'cargo', 'container', 'tanker', 'freight',
            'maritime', 'shipping', 'dock', 'berth', 'canal', 'strait', 'route',
            'disruption', 'delay', 'strike', 'storm', 'piracy', 'embargo',
            'tariff', 'trade', 'import', 'export', 'customs', 'logistics'
        ]
        
        text_lower = text.lower()
        found_keywords = [keyword for keyword in maritime_keywords if keyword in text_lower]
        
        return found_keywords
    
    async def store_real_time_data(self, stream_name: str, data: List[Dict[str, Any]]):
        """Store real-time data in database"""
        
        try:
            if 'vessel' in stream_name.lower():
                for vessel in data:
                    await self.db_manager.insert_vessel_position(vessel)
                    self.ingestion_stats['total_vessels_processed'] += 1
            
            elif 'port' in stream_name.lower():
                for port in data:
                    await self.db_manager.insert_port_performance(port)
                    self.ingestion_stats['total_ports_processed'] += 1
            
            elif 'news' in stream_name.lower():
                # Store news as potential disruptions
                for news_item in data:
                    if news_item.get('severity', 'low') in ['high', 'critical']:
                        disruption_data = self.convert_news_to_disruption(news_item)
                        if disruption_data:
                            await self.db_manager.insert_disruption(disruption_data)
                            self.ingestion_stats['total_disruptions_detected'] += 1
            
            # Store all data types in analytics tables for trending
            await self.store_analytics_data(stream_name, data)
            
        except Exception as e:
            logger.error("Error storing real-time data", 
                       stream=stream_name, error=str(e))
    
    def convert_news_to_disruption(self, news_item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Convert high-severity news to disruption event"""
        
        try:
            severity_map = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
            
            disruption = {
                'event_type': news_item.get('category', 'news_alert'),
                'title': news_item['title'],
                'description': news_item.get('content', ''),
                'severity_level': severity_map.get(news_item.get('severity', 'medium'), 2),
                'category': news_item.get('category', 'general'),
                'start_date': news_item['timestamp'],
                'probability': min(news_item.get('relevance_score', 0.5) + 0.3, 1.0),
                'confidence_score': news_item.get('relevance_score', 0.5),
                'ai_generated': True,
                'source_type': 'NEWS_STREAM',
                'source_url': news_item.get('link', '')
            }
            
            return disruption
            
        except Exception as e:
            logger.warning("Error converting news to disruption", error=str(e))
            return None
    
    async def store_analytics_data(self, stream_name: str, data: List[Dict[str, Any]]):
        """Store data for analytics and trending"""
        
        try:
            # Create performance metrics
            timestamp = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
            
            metric = {
                'metric_name': f'{stream_name}_data_rate',
                'metric_category': 'data_ingestion',
                'metric_value': len(data),
                'metric_unit': 'items/hour',
                'aggregation_period': 'hourly',
                'aggregation_timestamp': timestamp,
                'dimensions': {'stream': stream_name, 'data_type': 'real_time'}
            }
            
            await self.db_manager.insert_performance_metric(metric)
            
        except Exception as e:
            logger.warning("Error storing analytics data", error=str(e))
    
    def add_to_batch_buffers(self, stream_name: str, data: List[Dict[str, Any]]):
        """Add data to batch processing buffers"""
        
        try:
            if 'vessel' in stream_name.lower():
                self.batch_buffers['vessels'].extend(data)
                # Keep buffer size manageable
                if len(self.batch_buffers['vessels']) > 1000:
                    self.batch_buffers['vessels'] = self.batch_buffers['vessels'][-1000:]
            
            elif 'port' in stream_name.lower():
                self.batch_buffers['ports'].extend(data)
                if len(self.batch_buffers['ports']) > 500:
                    self.batch_buffers['ports'] = self.batch_buffers['ports'][-500:]
            
            elif 'news' in stream_name.lower():
                self.batch_buffers['news'].extend(data)
                if len(self.batch_buffers['news']) > 200:
                    self.batch_buffers['news'] = self.batch_buffers['news'][-200:]
            
            elif any(x in stream_name.lower() for x in ['economic', 'baltic']):
                self.batch_buffers['economic'].extend(data)
                if len(self.batch_buffers['economic']) > 200:
                    self.batch_buffers['economic'] = self.batch_buffers['economic'][-200:]
            
            elif any(x in stream_name.lower() for x in ['weather', 'security']):
                self.batch_buffers['weather'].extend(data)
                if len(self.batch_buffers['weather']) > 100:
                    self.batch_buffers['weather'] = self.batch_buffers['weather'][-100:]
                    
        except Exception as e:
            logger.warning("Error adding to batch buffers", error=str(e))
    
    async def check_for_critical_events(self, stream_name: str, data: List[Dict[str, Any]]):
        """Check for critical events requiring immediate AI processing"""
        
        try:
            critical_events = []
            
            for item in data:
                # Check for high-severity alerts
                if item.get('severity') in ['high', 'critical']:
                    critical_events.append(item)
                
                # Check for significant vessel anomalies
                if 'vessel' in stream_name.lower():
                    speed = item.get('speed_knots', 0)
                    if speed > 30:  # Unusually high speed
                        critical_events.append(item)
                
                # Check for port congestion
                if 'port' in stream_name.lower():
                    congestion = item.get('congestion_level', 0)
                    if congestion > 0.8:  # High congestion
                        critical_events.append(item)
            
            if critical_events:
                # Trigger immediate AI analysis
                await self.process_critical_events(critical_events)
                
        except Exception as e:
            logger.error("Error checking for critical events", error=str(e))
    
    async def process_critical_events(self, events: List[Dict[str, Any]]):
        """Process critical events with immediate AI analysis"""
        
        try:
            logger.warning("Critical events detected", count=len(events))
            
            # Use AI models for immediate analysis
            if len(events) >= 3:  # Enough data for disruption detection
                disruptions = await self.model_manager.detect_disruptions(
                    news_data=[e for e in events if 'news' in str(e.get('data_source', ''))],
                    vessel_anomalies=[e for e in events if 'vessel' in str(e.get('data_source', ''))],
                    economic_indicators=[e for e in events if 'economic' in str(e.get('data_source', ''))]
                )
                
                # Store detected disruptions
                for disruption in disruptions:
                    disruption_data = {
                        'event_type': disruption['event_type'],
                        'title': f"AI-Detected Critical Event: {disruption['event_type']}",
                        'description': disruption['description'],
                        'severity_level': 4,  # Critical
                        'category': 'ai_critical_detection',
                        'start_date': datetime.utcnow(),
                        'probability': disruption['probability'],
                        'confidence_score': disruption['confidence_score'],
                        'ai_generated': True,
                        'source_type': 'CRITICAL_AI_DETECTION'
                    }
                    
                    await self.db_manager.insert_disruption(disruption_data)
                    self.ingestion_stats['total_disruptions_detected'] += 1
                    
                    logger.critical("Critical disruption detected by AI", 
                                  type=disruption['event_type'],
                                  confidence=disruption['confidence_score'])
            
        except Exception as e:
            logger.error("Error processing critical events", error=str(e))
    
    async def batch_processing_loop(self):
        """Background loop for batch data processing"""
        
        while True:
            try:
                await asyncio.sleep(300)  # Process every 5 minutes
                
                if any(len(buffer) > 50 for buffer in self.batch_buffers.values()):
                    await self.process_batch_data()
                    
            except Exception as e:
                logger.error("Error in batch processing loop", error=str(e))
                await asyncio.sleep(60)  # Wait before retry
    
    async def process_batch_data(self):
        """Process accumulated batch data"""
        
        try:
            logger.info("Processing batch data", 
                       buffers={k: len(v) for k, v in self.batch_buffers.items()})
            
            # Process vessel predictions if enough vessel data
            if len(self.batch_buffers['vessels']) >= 20:
                await self.process_vessel_predictions()
            
            # Process disruption detection if enough mixed data
            if (len(self.batch_buffers['news']) >= 5 and 
                len(self.batch_buffers['vessels']) >= 10):
                await self.process_disruption_detection()
            
            # Clear processed buffers
            for buffer in self.batch_buffers.values():
                buffer.clear()
            
            self.ingestion_stats['last_batch_process'] = datetime.utcnow()
            
        except Exception as e:
            logger.error("Error processing batch data", error=str(e))
    
    async def process_vessel_predictions(self):
        """Process vessel movement predictions"""
        
        try:
            # Group vessels by vessel_id
            vessel_groups = {}
            for vessel in self.batch_buffers['vessels']:
                vessel_id = vessel.get('vessel_id')
                if vessel_id:
                    if vessel_id not in vessel_groups:
                        vessel_groups[vessel_id] = []
                    vessel_groups[vessel_id].append(vessel)
            
            # Make predictions for vessels with sufficient history
            predictions_made = 0
            for vessel_id, vessel_history in vessel_groups.items():
                if len(vessel_history) >= 5:  # Minimum history
                    # Sort by timestamp
                    vessel_history.sort(key=lambda x: x['timestamp'])
                    
                    # Make prediction
                    prediction = await self.model_manager.predict_vessel_movements(
                        vessel_data=[vessel_history],
                        prediction_horizon=24
                    )
                    
                    if prediction:
                        # Store prediction
                        prediction_data = {
                            'model_id': 'vessel_prediction_batch',
                            'prediction_type': 'vessel_movement',
                            'input_features': {'vessel_history_length': len(vessel_history)},
                            'output_prediction': prediction[0],
                            'confidence_score': prediction[0].get('confidence_score'),
                            'vessel_id': vessel_id,
                            'prediction_timestamp': datetime.utcnow()
                        }
                        
                        await self.db_manager.insert_prediction(prediction_data)
                        predictions_made += 1
            
            self.ingestion_stats['total_predictions_made'] += predictions_made
            logger.info("Vessel predictions completed", predictions=predictions_made)
            
        except Exception as e:
            logger.error("Error processing vessel predictions", error=str(e))
    
    async def process_disruption_detection(self):
        """Process disruption detection on batch data"""
        
        try:
            # Prepare data for disruption detection
            news_data = self.batch_buffers['news'][-20:]  # Recent news
            
            # Create vessel anomalies from vessel data
            vessel_anomalies = []
            for vessel in self.batch_buffers['vessels'][-50:]:
                speed = vessel.get('speed_knots', 0)
                if speed > 25 or speed == 0:  # Potential anomaly
                    anomaly = {
                        'vessel_id': vessel['vessel_id'],
                        'type': 'speed_anomaly' if speed > 25 else 'stopped_vessel',
                        'severity': 0.7 if speed > 25 else 0.3,
                        'latitude': vessel['latitude'],
                        'longitude': vessel['longitude'],
                        'timestamp': vessel['timestamp']
                    }
                    vessel_anomalies.append(anomaly)
            
            # Use economic data if available
            economic_data = self.batch_buffers['economic'][-10:]
            
            # Run disruption detection
            disruptions = await self.model_manager.detect_disruptions(
                news_data=news_data,
                vessel_anomalies=vessel_anomalies,
                economic_indicators=economic_data
            )
            
            # Store detected disruptions
            disruptions_stored = 0
            for disruption in disruptions:
                disruption_data = {
                    'event_type': disruption['event_type'],
                    'title': f"AI-Detected: {disruption['event_type'].title()} Event",
                    'description': disruption['description'],
                    'severity_level': self.severity_to_int(disruption['severity_level']),
                    'category': 'ai_batch_detection',
                    'start_date': datetime.utcnow(),
                    'probability': disruption['probability'],
                    'confidence_score': disruption['confidence_score'],
                    'ai_generated': True,
                    'source_type': 'BATCH_AI_DETECTION'
                }
                
                await self.db_manager.insert_disruption(disruption_data)
                disruptions_stored += 1
            
            self.ingestion_stats['total_disruptions_detected'] += disruptions_stored
            logger.info("Disruption detection completed", disruptions=disruptions_stored)
            
        except Exception as e:
            logger.error("Error processing disruption detection", error=str(e))
    
    def severity_to_int(self, severity: str) -> int:
        """Convert severity string to integer"""
        mapping = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4, 'extreme': 5}
        return mapping.get(severity, 2)
    
    async def ai_training_loop(self):
        """Background loop for AI model training"""
        
        while True:
            try:
                await asyncio.sleep(3600)  # Check every hour
                
                if not self.training_in_progress:
                    await self.check_training_requirements()
                    
            except Exception as e:
                logger.error("Error in AI training loop", error=str(e))
                await asyncio.sleep(1800)  # Wait before retry
    
    async def check_training_requirements(self):
        """Check if AI models need retraining"""
        
        try:
            # Check data volume for training
            vessel_count = await self.db_manager.execute_scalar(
                "SELECT COUNT(*) FROM maritime.vessel_positions WHERE timestamp > NOW() - INTERVAL '24 hours'"
            )
            
            disruption_count = await self.db_manager.execute_scalar(
                "SELECT COUNT(*) FROM maritime.trade_disruptions WHERE created_at > NOW() - INTERVAL '7 days'"
            )
            
            # Trigger training if enough new data
            if vessel_count > 1000 or disruption_count > 50:
                await self.trigger_ai_training()
                
        except Exception as e:
            logger.error("Error checking training requirements", error=str(e))
    
    async def trigger_ai_training(self):
        """Trigger AI model training"""
        
        try:
            self.training_in_progress = True
            logger.info("Starting AI model training")
            
            # Train models with recent data
            await self.model_manager.train_models(model_type="all", force_retrain=False)
            
            self.ingestion_stats['ai_training_runs'] += 1
            logger.info("AI model training completed")
            
        except Exception as e:
            logger.error("Error during AI training", error=str(e))
        finally:
            self.training_in_progress = False
    
    async def data_quality_monitoring(self):
        """Monitor data quality metrics"""
        
        while True:
            try:
                await asyncio.sleep(600)  # Check every 10 minutes
                
                quality_score = await self.calculate_overall_quality_score()
                self.ingestion_stats['data_quality_score'] = quality_score
                
                if quality_score < 0.8:
                    logger.warning("Data quality below threshold", score=quality_score)
                    
            except Exception as e:
                logger.error("Error in data quality monitoring", error=str(e))
                await asyncio.sleep(300)
    
    async def calculate_overall_quality_score(self) -> float:
        """Calculate overall data quality score"""
        
        try:
            # Check recent vessel data quality
            recent_vessels = await self.db_manager.execute_query("""
                SELECT AVG(CASE WHEN latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180 THEN 1 ELSE 0 END) as coord_validity,
                       COUNT(*) as total_records
                FROM maritime.vessel_positions 
                WHERE timestamp > NOW() - INTERVAL '1 hour'
            """)
            
            if recent_vessels and recent_vessels[0]['total_records'] > 0:
                coord_validity = recent_vessels[0]['coord_validity'] or 0
                
                # Calculate timestamp freshness
                fresh_data = await self.db_manager.execute_scalar("""
                    SELECT COUNT(*) FROM maritime.vessel_positions 
                    WHERE timestamp > NOW() - INTERVAL '30 minutes'
                """)
                
                total_data = recent_vessels[0]['total_records']
                freshness_score = fresh_data / total_data if total_data > 0 else 0
                
                # Combine metrics
                overall_score = (coord_validity * 0.4 + freshness_score * 0.6)
                return min(1.0, max(0.0, overall_score))
            
            return 0.5  # Default score when no data
            
        except Exception as e:
            logger.error("Error calculating quality score", error=str(e))
            return 0.0
    
    async def performance_optimization(self):
        """Optimize performance based on load"""
        
        while True:
            try:
                await asyncio.sleep(1800)  # Check every 30 minutes
                
                # Monitor processing rates
                current_rate = self.ingestion_stats['real_time_messages']
                
                # Adjust buffer sizes based on load
                if current_rate > 1000:  # High load
                    # Reduce buffer sizes
                    for buffer in self.batch_buffers.values():
                        if len(buffer) > 200:
                            buffer[:] = buffer[-200:]
                    
                    logger.info("Reduced buffer sizes due to high load", rate=current_rate)
                
                # Reset message counter
                self.ingestion_stats['real_time_messages'] = 0
                
            except Exception as e:
                logger.error("Error in performance optimization", error=str(e))
                await asyncio.sleep(900)
    
    async def update_processing_stats(self, stream_name: str, data: List[Dict[str, Any]]):
        """Update processing statistics"""
        
        try:
            # Update stream-specific stats
            await self.db_manager.insert_performance_metric({
                'metric_name': f'{stream_name}_processing_rate',
                'metric_category': 'real_time_processing',
                'metric_value': len(data),
                'aggregation_period': 'realtime',
                'aggregation_timestamp': datetime.utcnow()
            })
            
        except Exception as e:
            logger.warning("Error updating processing stats", error=str(e))
    
    def get_ingestion_statistics(self) -> Dict[str, Any]:
        """Get comprehensive ingestion statistics"""
        
        stats = self.ingestion_stats.copy()
        
        # Add real-time streaming stats
        stream_stats = self.real_time_streamer.get_stream_statistics()
        stats['streaming'] = stream_stats
        
        # Add buffer status
        stats['buffer_status'] = {
            category: len(buffer) for category, buffer in self.batch_buffers.items()
        }
        
        # Add system health
        stats['system_health'] = {
            'training_in_progress': self.training_in_progress,
            'connected_streams': stream_stats.get('connected_streams', 0),
            'total_streams': stream_stats.get('total_streams', 0),
            'uptime_percent': stream_stats.get('uptime_percent', 0)
        }
        
        return stats
    
    async def shutdown(self):
        """Shutdown the data ingestion service"""
        
        logger.info("Shutting down Data Ingestion Service")
        
        try:
            # Stop real-time streaming
            await self.real_time_streamer.shutdown()
            
            # Close batch scraper
            await self.batch_scraper.close()
            
            # Process remaining batch data
            if any(len(buffer) > 0 for buffer in self.batch_buffers.values()):
                await self.process_batch_data()
            
            logger.info("Data Ingestion Service shutdown complete")
            
        except Exception as e:
            logger.error("Error during shutdown", error=str(e))
