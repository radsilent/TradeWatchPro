"""
Model Manager for TradeWatch AI Processing System
Manages loading, training, and inference of TensorFlow models
"""

import os
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
import structlog
from models.vessel_prediction import VesselMovementPredictor
from models.disruption_detection import DisruptionDetector

logger = structlog.get_logger()

class ModelManager:
    """Manages AI models for the TradeWatch system"""
    
    def __init__(self, model_base_path: str = "/app/models"):
        self.model_base_path = model_base_path
        self.models = {}
        self.model_metadata = {}
        self.is_initialized = False
    
    async def initialize(self):
        """Initialize and load all models"""
        try:
            logger.info("Initializing AI model manager")
            
            # Initialize vessel movement predictor
            vessel_model_path = os.path.join(self.model_base_path, "vessel_prediction")
            self.models['vessel_prediction'] = VesselMovementPredictor(vessel_model_path)
            await self.models['vessel_prediction'].load_model()
            
            # Initialize disruption detector
            disruption_model_path = os.path.join(self.model_base_path, "disruption_detection")
            self.models['disruption_detection'] = DisruptionDetector(disruption_model_path)
            await self.models['disruption_detection'].load_model()
            
            self.is_initialized = True
            logger.info("AI model manager initialized successfully", 
                       models_loaded=list(self.models.keys()))
            
        except Exception as e:
            logger.error("Failed to initialize model manager", error=str(e))
            raise
    
    def get_loaded_models(self) -> List[str]:
        """Get list of loaded model names"""
        return [name for name, model in self.models.items() if model.is_loaded]
    
    def get_model_versions(self) -> Dict[str, str]:
        """Get version information for all models"""
        return {name: "v1.0" for name in self.models.keys()}  # Simplified
    
    def get_last_training_times(self) -> Dict[str, Optional[str]]:
        """Get last training times for all models"""
        return {name: None for name in self.models.keys()}  # Would be implemented
    
    def get_performance_metrics(self) -> Dict[str, Dict[str, Any]]:
        """Get performance metrics for all models"""
        return {
            name: {
                "accuracy": 0.85,
                "precision": 0.82,
                "recall": 0.88,
                "f1_score": 0.85
            } for name in self.models.keys()
        }  # Would be calculated from actual metrics
    
    async def predict_vessel_movements(self, vessel_data: List[Dict[str, Any]],
                                     prediction_horizon: int = 24,
                                     include_weather: bool = True,
                                     include_economic_factors: bool = True) -> List[Dict[str, Any]]:
        """Predict vessel movements using the vessel prediction model"""
        
        if 'vessel_prediction' not in self.models:
            raise RuntimeError("Vessel prediction model not loaded")
        
        try:
            predictions = []
            
            for vessel_sequence in vessel_data:
                prediction = await self.models['vessel_prediction'].predict(
                    vessel_data=vessel_sequence,
                    prediction_horizon_hours=prediction_horizon
                )
                predictions.append(prediction)
            
            logger.info("Vessel movement predictions completed", 
                       count=len(predictions))
            return predictions
            
        except Exception as e:
            logger.error("Error in vessel movement prediction", error=str(e))
            raise
    
    async def detect_disruptions(self, news_data: List[Dict[str, Any]],
                               vessel_anomalies: List[Dict[str, Any]],
                               economic_indicators: List[Dict[str, Any]],
                               region_filter: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Detect trade disruptions using the disruption detection model"""
        
        if 'disruption_detection' not in self.models:
            raise RuntimeError("Disruption detection model not loaded")
        
        try:
            disruptions = await self.models['disruption_detection'].detect_disruptions(
                news_data=news_data,
                vessel_anomalies=vessel_anomalies,
                economic_indicators=economic_indicators,
                region_filter=region_filter
            )
            
            logger.info("Disruption detection completed", 
                       disruptions_found=len(disruptions))
            return disruptions
            
        except Exception as e:
            logger.error("Error in disruption detection", error=str(e))
            raise
    
    async def assess_economic_impact(self, disruption_id: str,
                                   affected_routes: List[str],
                                   duration_days: int) -> Dict[str, Any]:
        """Assess economic impact of disruptions"""
        
        # This would use a dedicated economic impact model
        # For now, return mock assessment
        impact_assessment = {
            'disruption_id': disruption_id,
            'affected_routes': affected_routes,
            'duration_days': duration_days,
            'estimated_impact': {
                'cargo_delayed_tons': duration_days * 10000,
                'vessels_affected': len(affected_routes) * 5,
                'additional_costs_usd': duration_days * 1000000,
                'recovery_time_days': max(duration_days * 0.5, 1)
            },
            'confidence_score': 0.75,
            'calculation_timestamp': datetime.utcnow().isoformat()
        }
        
        logger.info("Economic impact assessment completed", 
                   disruption_id=disruption_id)
        return impact_assessment
    
    async def train_models(self, model_type: str = "all", force_retrain: bool = False):
        """Train or retrain models"""
        
        try:
            logger.info("Starting model training", model_type=model_type, force_retrain=force_retrain)
            
            if model_type == "all" or model_type == "vessel_prediction":
                await self.train_vessel_prediction_model(force_retrain)
            
            if model_type == "all" or model_type == "disruption_detection":
                await self.train_disruption_detection_model(force_retrain)
            
            logger.info("Model training completed", model_type=model_type)
            
        except Exception as e:
            logger.error("Error in model training", model_type=model_type, error=str(e))
            raise
    
    async def train_vessel_prediction_model(self, force_retrain: bool = False):
        """Train the vessel movement prediction model"""
        
        if 'vessel_prediction' not in self.models:
            return
        
        try:
            # This would load real training data
            # For now, using mock data
            import pandas as pd
            import numpy as np
            
            # Generate mock training data
            train_data = pd.DataFrame({
                'vessel_id': np.random.choice(['V001', 'V002', 'V003'], 1000),
                'timestamp': pd.date_range('2024-01-01', periods=1000, freq='H'),
                'latitude': np.random.uniform(-90, 90, 1000),
                'longitude': np.random.uniform(-180, 180, 1000),
                'speed': np.random.uniform(0, 25, 1000)
            })
            
            val_data = train_data.sample(200)
            
            # Train model
            metrics = await self.models['vessel_prediction'].train(
                training_data=train_data,
                validation_data=val_data,
                epochs=10,  # Reduced for demo
                batch_size=32
            )
            
            logger.info("Vessel prediction model training completed", metrics=metrics)
            
        except Exception as e:
            logger.error("Error training vessel prediction model", error=str(e))
            raise
    
    async def train_disruption_detection_model(self, force_retrain: bool = False):
        """Train the disruption detection model"""
        
        if 'disruption_detection' not in self.models:
            return
        
        try:
            # This would load real training data
            # For now, using mock data
            import pandas as pd
            import numpy as np
            
            # Generate mock training data
            train_data = pd.DataFrame({
                'news_text': ['Sample news ' + str(i) for i in range(500)],
                'disruption_type': np.random.choice(['weather', 'geopolitical', 'labor'], 500),
                'severity': np.random.choice(['low', 'medium', 'high'], 500),
                'timestamp': pd.date_range('2024-01-01', periods=500, freq='D')
            })
            
            val_data = train_data.sample(100)
            
            # Train model
            metrics = await self.models['disruption_detection'].train(
                training_data=train_data,
                validation_data=val_data,
                epochs=10,  # Reduced for demo
                batch_size=16
            )
            
            logger.info("Disruption detection model training completed", metrics=metrics)
            
        except Exception as e:
            logger.error("Error training disruption detection model", error=str(e))
            raise
