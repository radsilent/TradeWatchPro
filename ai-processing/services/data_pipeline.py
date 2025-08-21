"""
Data Pipeline for TradeWatch AI Processing System
Handles real-time data ingestion, processing, and distribution
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import structlog
from services.database import DatabaseManager
from services.model_manager import ModelManager

logger = structlog.get_logger()

class DataPipeline:
    """Manages real-time data pipeline for AI processing"""
    
    def __init__(self, db_manager: DatabaseManager, model_manager: ModelManager):
        self.db_manager = db_manager
        self.model_manager = model_manager
        self.is_running = False
        self.processing_stats = {
            'vessels_processed': 0,
            'ports_processed': 0,
            'news_processed': 0,
            'predictions_made': 0,
            'disruptions_detected': 0,
            'last_processing_time': None,
            'errors': 0
        }
    
    async def initialize(self):
        """Initialize the data pipeline"""
        logger.info("Initializing data pipeline")
        self.is_running = True
    
    async def shutdown(self):
        """Shutdown the data pipeline"""
        logger.info("Shutting down data pipeline")
        self.is_running = False
    
    async def ingest_data(self, vessel_updates: List[Dict[str, Any]] = [],
                         port_updates: List[Dict[str, Any]] = [],
                         news_updates: List[Dict[str, Any]] = [],
                         weather_updates: List[Dict[str, Any]] = []) -> Dict[str, Any]:
        """Ingest real-time data from various sources"""
        
        try:
            results = {
                'vessels_ingested': 0,
                'ports_ingested': 0,
                'news_ingested': 0,
                'weather_ingested': 0,
                'predictions_triggered': 0,
                'disruptions_detected': 0,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Process vessel updates
            if vessel_updates:
                vessel_results = await self.process_vessel_updates(vessel_updates)
                results['vessels_ingested'] = vessel_results['processed']
                results['predictions_triggered'] += vessel_results.get('predictions_made', 0)
            
            # Process port updates
            if port_updates:
                port_results = await self.process_port_updates(port_updates)
                results['ports_ingested'] = port_results['processed']
            
            # Process news updates
            if news_updates:
                news_results = await self.process_news_updates(news_updates)
                results['news_ingested'] = news_results['processed']
                results['disruptions_detected'] += news_results.get('disruptions_detected', 0)
            
            # Process weather updates
            if weather_updates:
                weather_results = await self.process_weather_updates(weather_updates)
                results['weather_ingested'] = weather_results['processed']
            
            # Update statistics
            self.processing_stats['vessels_processed'] += results['vessels_ingested']
            self.processing_stats['ports_processed'] += results['ports_ingested']
            self.processing_stats['news_processed'] += results['news_ingested']
            self.processing_stats['predictions_made'] += results['predictions_triggered']
            self.processing_stats['disruptions_detected'] += results['disruptions_detected']
            self.processing_stats['last_processing_time'] = datetime.utcnow().isoformat()
            
            logger.info("Data ingestion completed", results=results)
            return results
            
        except Exception as e:
            self.processing_stats['errors'] += 1
            logger.error("Error in data ingestion", error=str(e))
            raise
    
    async def process_vessel_updates(self, vessel_updates: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process vessel position updates and trigger predictions"""
        
        processed = 0
        predictions_made = 0
        
        for vessel_data in vessel_updates:
            try:
                # Validate vessel data
                if not self.validate_vessel_data(vessel_data):
                    continue
                
                # Store vessel position
                await self.db_manager.insert_vessel_position(vessel_data)
                processed += 1
                
                # Check if vessel needs prediction update
                if await self.should_trigger_prediction(vessel_data['vessel_id']):
                    # Get vessel history
                    history = await self.db_manager.get_vessel_history(
                        vessel_data['vessel_id'], hours=24
                    )
                    
                    if len(history) >= 5:  # Minimum data points for prediction
                        # Trigger vessel movement prediction
                        prediction = await self.model_manager.predict_vessel_movements(
                            vessel_data=[history],
                            prediction_horizon=24
                        )
                        
                        if prediction:
                            predictions_made += 1
                            
                            # Store prediction in database
                            await self.store_prediction(prediction[0], vessel_data['vessel_id'])
                
            except Exception as e:
                logger.error("Error processing vessel update", 
                           vessel_id=vessel_data.get('vessel_id'), error=str(e))
                continue
        
        return {'processed': processed, 'predictions_made': predictions_made}
    
    async def process_port_updates(self, port_updates: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process port performance updates"""
        
        processed = 0
        
        for port_data in port_updates:
            try:
                # Validate port data
                if not self.validate_port_data(port_data):
                    continue
                
                # Store port performance data
                await self.db_manager.insert_port_performance(port_data)
                processed += 1
                
                # Check for port congestion alerts
                if port_data.get('congestion_level', 0) > 0.8:
                    await self.trigger_congestion_alert(port_data)
                
            except Exception as e:
                logger.error("Error processing port update", 
                           port_id=port_data.get('port_id'), error=str(e))
                continue
        
        return {'processed': processed}
    
    async def process_news_updates(self, news_updates: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process news updates and detect disruptions"""
        
        processed = 0
        disruptions_detected = 0
        
        try:
            # Filter relevant maritime news
            maritime_news = self.filter_maritime_news(news_updates)
            processed = len(maritime_news)
            
            if maritime_news:
                # Trigger disruption detection
                vessel_anomalies = await self.get_recent_vessel_anomalies()
                economic_indicators = await self.get_recent_economic_indicators()
                
                disruptions = await self.model_manager.detect_disruptions(
                    news_data=maritime_news,
                    vessel_anomalies=vessel_anomalies,
                    economic_indicators=economic_indicators
                )
                
                # Store detected disruptions
                for disruption in disruptions:
                    await self.store_disruption(disruption)
                    disruptions_detected += 1
                
        except Exception as e:
            logger.error("Error processing news updates", error=str(e))
        
        return {'processed': processed, 'disruptions_detected': disruptions_detected}
    
    async def process_weather_updates(self, weather_updates: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process weather updates"""
        
        processed = 0
        
        for weather_data in weather_updates:
            try:
                # Store weather data for use in predictions
                # This would be implemented based on your weather data schema
                processed += 1
                
            except Exception as e:
                logger.error("Error processing weather update", error=str(e))
                continue
        
        return {'processed': processed}
    
    async def process_real_time_data(self):
        """Main real-time processing loop"""
        
        if not self.is_running:
            return
        
        try:
            # Check for vessels needing prediction updates
            await self.process_pending_predictions()
            
            # Check for anomaly detection
            await self.detect_vessel_anomalies()
            
            # Update performance metrics
            await self.update_performance_metrics()
            
        except Exception as e:
            logger.error("Error in real-time processing", error=str(e))
            self.processing_stats['errors'] += 1
    
    async def process_pending_predictions(self):
        """Process vessels that need prediction updates"""
        
        # Get vessels with recent updates but no recent predictions
        query = """
        SELECT DISTINCT v.vessel_id, v.vessel_name
        FROM maritime.vessels v
        JOIN maritime.vessel_positions vp ON v.vessel_id = vp.vessel_id
        LEFT JOIN ai_models.predictions p ON v.vessel_id = p.vessel_id::uuid
            AND p.prediction_timestamp > NOW() - INTERVAL '1 hour'
        WHERE vp.timestamp > NOW() - INTERVAL '30 minutes'
          AND p.prediction_id IS NULL
        LIMIT 10
        """
        
        vessels_to_predict = await self.db_manager.execute_query(query)
        
        for vessel in vessels_to_predict:
            try:
                vessel_id = str(vessel['vessel_id'])
                
                # Get vessel history
                history = await self.db_manager.get_vessel_history(vessel_id, hours=24)
                
                if len(history) >= 5:
                    # Make prediction
                    prediction = await self.model_manager.predict_vessel_movements(
                        vessel_data=[history],
                        prediction_horizon=24
                    )
                    
                    if prediction:
                        await self.store_prediction(prediction[0], vessel_id)
                        self.processing_stats['predictions_made'] += 1
                
            except Exception as e:
                logger.error("Error in pending prediction processing", 
                           vessel_id=vessel.get('vessel_id'), error=str(e))
    
    async def detect_vessel_anomalies(self):
        """Detect vessel movement anomalies"""
        
        # Get recent vessel positions for anomaly detection
        query = """
        SELECT 
            vessel_id, latitude, longitude, speed_knots, heading_degrees, timestamp,
            LAG(latitude) OVER (PARTITION BY vessel_id ORDER BY timestamp) as prev_lat,
            LAG(longitude) OVER (PARTITION BY vessel_id ORDER BY timestamp) as prev_lon,
            LAG(speed_knots) OVER (PARTITION BY vessel_id ORDER BY timestamp) as prev_speed,
            LAG(timestamp) OVER (PARTITION BY vessel_id ORDER BY timestamp) as prev_timestamp
        FROM maritime.vessel_positions
        WHERE timestamp > NOW() - INTERVAL '2 hours'
        ORDER BY vessel_id, timestamp
        """
        
        positions = await self.db_manager.execute_query(query)
        anomalies = []
        
        for pos in positions:
            if pos['prev_lat'] is None:
                continue
            
            # Calculate distance and time difference
            distance = self.calculate_distance(
                pos['prev_lat'], pos['prev_lon'],
                pos['latitude'], pos['longitude']
            )
            
            time_diff = (pos['timestamp'] - pos['prev_timestamp']).total_seconds() / 3600
            
            if time_diff > 0:
                implied_speed = distance / time_diff
                
                # Check for speed anomalies
                if abs(implied_speed - pos['speed_knots']) > 10:  # Speed discrepancy > 10 knots
                    anomalies.append({
                        'vessel_id': str(pos['vessel_id']),
                        'type': 'speed_anomaly',
                        'severity': min(abs(implied_speed - pos['speed_knots']) / 20, 1.0),
                        'latitude': pos['latitude'],
                        'longitude': pos['longitude'],
                        'timestamp': pos['timestamp'].isoformat(),
                        'details': {
                            'reported_speed': pos['speed_knots'],
                            'implied_speed': implied_speed,
                            'discrepancy': abs(implied_speed - pos['speed_knots'])
                        }
                    })
        
        # Store anomalies for disruption detection
        if anomalies:
            logger.info("Vessel anomalies detected", count=len(anomalies))
            # This would trigger disruption detection with the anomalies
    
    def validate_vessel_data(self, vessel_data: Dict[str, Any]) -> bool:
        """Validate vessel data"""
        required_fields = ['vessel_id', 'latitude', 'longitude', 'timestamp']
        
        for field in required_fields:
            if field not in vessel_data:
                return False
        
        # Validate coordinate ranges
        if not (-90 <= vessel_data['latitude'] <= 90):
            return False
        if not (-180 <= vessel_data['longitude'] <= 180):
            return False
        
        # Validate speed if provided
        if 'speed' in vessel_data and vessel_data['speed'] < 0:
            return False
        
        return True
    
    def validate_port_data(self, port_data: Dict[str, Any]) -> bool:
        """Validate port data"""
        required_fields = ['port_id', 'date']
        
        for field in required_fields:
            if field not in port_data:
                return False
        
        return True
    
    def filter_maritime_news(self, news_updates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter news for maritime relevance"""
        
        maritime_keywords = [
            'port', 'ship', 'vessel', 'cargo', 'freight', 'maritime', 'shipping',
            'container', 'dock', 'harbor', 'canal', 'strait', 'trade route',
            'supply chain', 'logistics', 'import', 'export', 'customs',
            'tariff', 'trade war', 'embargo', 'sanction'
        ]
        
        maritime_news = []
        
        for news in news_updates:
            title = news.get('title', '').lower()
            content = news.get('content', news.get('description', '')).lower()
            
            # Check if news contains maritime keywords
            if any(keyword in title or keyword in content for keyword in maritime_keywords):
                maritime_news.append(news)
        
        return maritime_news
    
    async def should_trigger_prediction(self, vessel_id: str) -> bool:
        """Determine if vessel needs prediction update"""
        
        # Check when last prediction was made
        query = """
        SELECT prediction_timestamp
        FROM ai_models.predictions
        WHERE vessel_id = $1 AND prediction_type = 'vessel_movement'
        ORDER BY prediction_timestamp DESC
        LIMIT 1
        """
        
        last_prediction = await self.db_manager.execute_scalar(query, vessel_id)
        
        if last_prediction is None:
            return True  # No previous prediction
        
        # Trigger if last prediction is older than 2 hours
        time_since_prediction = datetime.utcnow() - last_prediction
        return time_since_prediction > timedelta(hours=2)
    
    async def get_recent_vessel_anomalies(self) -> List[Dict[str, Any]]:
        """Get recent vessel anomalies for disruption detection"""
        
        # This would query a vessel anomalies table or generate mock data
        # For now, return empty list
        return []
    
    async def get_recent_economic_indicators(self) -> List[Dict[str, Any]]:
        """Get recent economic indicators for disruption detection"""
        
        # This would query economic indicators or external APIs
        # For now, return mock data
        return [
            {
                'indicator': 'market_volatility',
                'value': 0.15,
                'region': 'Global',
                'timestamp': datetime.utcnow().isoformat()
            }
        ]
    
    async def store_prediction(self, prediction: Dict[str, Any], vessel_id: str):
        """Store prediction in database"""
        
        prediction_data = {
            'model_id': 'vessel_prediction_v1',  # Would get from model manager
            'prediction_type': 'vessel_movement',
            'input_features': {},  # Would include input features
            'output_prediction': prediction,
            'confidence_score': prediction.get('confidence_score'),
            'prediction_horizon_hours': prediction.get('prediction_horizon_hours', 24),
            'vessel_id': vessel_id,
            'prediction_timestamp': datetime.utcnow()
        }
        
        await self.db_manager.insert_prediction(prediction_data)
    
    async def store_disruption(self, disruption: Dict[str, Any]):
        """Store detected disruption in database"""
        
        disruption_data = {
            'event_type': disruption['event_type'],
            'title': f"AI-Detected {disruption['event_type'].title()} Disruption",
            'description': disruption['description'],
            'severity_level': self.map_severity_to_int(disruption['severity_level']),
            'category': disruption['event_type'],
            'start_date': datetime.utcnow(),
            'probability': disruption['probability'],
            'confidence_score': disruption['confidence_score'],
            'ai_generated': True,
            'source_type': 'AI_PREDICTION'
        }
        
        await self.db_manager.insert_disruption(disruption_data)
    
    def map_severity_to_int(self, severity: str) -> int:
        """Map severity string to integer"""
        mapping = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4, 'extreme': 5}
        return mapping.get(severity, 2)
    
    async def trigger_congestion_alert(self, port_data: Dict[str, Any]):
        """Trigger alert for port congestion"""
        
        logger.warning("Port congestion detected",
                      port_id=port_data['port_id'],
                      congestion_level=port_data['congestion_level'])
        
        # This would trigger alerts to stakeholders
    
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points in nautical miles"""
        
        from math import radians, sin, cos, sqrt, atan2
        
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        # Earth radius in nautical miles
        R = 3440.065
        distance = R * c
        
        return distance
    
    async def update_performance_metrics(self):
        """Update system performance metrics"""
        
        metrics = [
            {
                'metric_name': 'vessels_processed_rate',
                'metric_category': 'data_pipeline',
                'metric_value': self.processing_stats['vessels_processed'],
                'aggregation_period': 'hourly',
                'aggregation_timestamp': datetime.utcnow().replace(minute=0, second=0, microsecond=0)
            },
            {
                'metric_name': 'predictions_made_rate',
                'metric_category': 'ai_performance',
                'metric_value': self.processing_stats['predictions_made'],
                'aggregation_period': 'hourly',
                'aggregation_timestamp': datetime.utcnow().replace(minute=0, second=0, microsecond=0)
            },
            {
                'metric_name': 'pipeline_error_rate',
                'metric_category': 'system_health',
                'metric_value': self.processing_stats['errors'],
                'aggregation_period': 'hourly',
                'aggregation_timestamp': datetime.utcnow().replace(minute=0, second=0, microsecond=0)
            }
        ]
        
        for metric in metrics:
            await self.db_manager.insert_performance_metric(metric)
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get pipeline statistics"""
        return self.processing_stats.copy()
