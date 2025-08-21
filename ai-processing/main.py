"""
TradeWatch AI Processing System
Main FastAPI application for TensorFlow-based maritime intelligence
"""

import os
import logging
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from contextlib import asynccontextmanager

import tensorflow as tf
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
import structlog

from models.vessel_prediction import VesselMovementPredictor
from models.disruption_detection import DisruptionDetector
from models.economic_impact import EconomicImpactAssessor
from services.data_pipeline import DataPipeline
from services.model_manager import ModelManager
from services.database import DatabaseManager
from utils.config import get_settings
from utils.logging_config import setup_logging

# Setup structured logging
setup_logging()
logger = structlog.get_logger()

# Configuration
settings = get_settings()

# Global managers
model_manager = None
db_manager = None
data_pipeline = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global model_manager, db_manager, data_pipeline
    
    logger.info("Starting TradeWatch AI Processing System")
    
    # Initialize services
    db_manager = DatabaseManager(settings.database_url)
    await db_manager.initialize()
    
    model_manager = ModelManager()
    await model_manager.initialize()
    
    data_pipeline = DataPipeline(db_manager, model_manager)
    await data_pipeline.initialize()
    
    # Start background tasks
    asyncio.create_task(periodic_model_training())
    asyncio.create_task(real_time_processing())
    
    logger.info("AI Processing System initialized successfully")
    
    yield
    
    # Cleanup
    logger.info("Shutting down AI Processing System")
    if data_pipeline:
        await data_pipeline.shutdown()
    if db_manager:
        await db_manager.close()

# Initialize FastAPI app
app = FastAPI(
    title="TradeWatch AI Processing System",
    description="TensorFlow-powered maritime intelligence and prediction system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API
class VesselData(BaseModel):
    vessel_id: str
    imo_number: Optional[str] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    speed: Optional[float] = Field(None, ge=0)
    heading: Optional[int] = Field(None, ge=0, le=360)
    timestamp: datetime
    destination_port: Optional[str] = None

class DisruptionEvent(BaseModel):
    event_id: str
    event_type: str
    severity: str
    location: Dict[str, float]
    start_time: datetime
    description: str
    source: str

class PredictionRequest(BaseModel):
    vessel_data: List[VesselData]
    prediction_horizon_hours: int = Field(default=24, ge=1, le=168)
    include_weather: bool = True
    include_economic_factors: bool = True

class DisruptionDetectionRequest(BaseModel):
    news_data: List[Dict[str, Any]]
    vessel_anomalies: List[Dict[str, Any]]
    economic_indicators: List[Dict[str, Any]]
    region_filter: Optional[List[str]] = None

class PredictionResponse(BaseModel):
    vessel_id: str
    predicted_arrival: datetime
    confidence_score: float
    risk_factors: List[str]
    route_optimization: Dict[str, Any]

class DisruptionResponse(BaseModel):
    disruption_id: str
    event_type: str
    severity_level: float
    affected_region: Dict[str, Any]
    probability: float
    impact_assessment: Dict[str, Any]
    recommended_actions: List[str]

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for Docker"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "tensorflow_version": tf.__version__,
        "gpu_available": len(tf.config.list_physical_devices('GPU')) > 0,
        "models_loaded": model_manager.get_loaded_models() if model_manager else [],
        "database_connected": db_manager.is_connected() if db_manager else False
    }

# Model information endpoint
@app.get("/models/info")
async def get_model_info():
    """Get information about loaded models"""
    if not model_manager:
        raise HTTPException(status_code=503, detail="Model manager not initialized")
    
    return {
        "loaded_models": model_manager.get_loaded_models(),
        "model_versions": model_manager.get_model_versions(),
        "last_training": model_manager.get_last_training_times(),
        "performance_metrics": model_manager.get_performance_metrics()
    }

# Vessel movement prediction endpoint
@app.post("/predict/vessel-movement", response_model=List[PredictionResponse])
async def predict_vessel_movement(request: PredictionRequest):
    """Predict vessel movements and arrival times"""
    try:
        logger.info("Received vessel movement prediction request", 
                   vessel_count=len(request.vessel_data))
        
        if not model_manager:
            raise HTTPException(status_code=503, detail="Model manager not initialized")
        
        # Process predictions
        predictions = await model_manager.predict_vessel_movements(
            vessel_data=request.vessel_data,
            prediction_horizon=request.prediction_horizon_hours,
            include_weather=request.include_weather,
            include_economic_factors=request.include_economic_factors
        )
        
        logger.info("Vessel movement predictions completed", 
                   prediction_count=len(predictions))
        
        return predictions
        
    except Exception as e:
        logger.error("Error in vessel movement prediction", error=str(e))
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

# Disruption detection endpoint
@app.post("/detect/disruptions", response_model=List[DisruptionResponse])
async def detect_disruptions(request: DisruptionDetectionRequest):
    """Detect potential trade disruptions using multi-modal AI"""
    try:
        logger.info("Received disruption detection request")
        
        if not model_manager:
            raise HTTPException(status_code=503, detail="Model manager not initialized")
        
        # Process disruption detection
        disruptions = await model_manager.detect_disruptions(
            news_data=request.news_data,
            vessel_anomalies=request.vessel_anomalies,
            economic_indicators=request.economic_indicators,
            region_filter=request.region_filter
        )
        
        logger.info("Disruption detection completed", 
                   disruption_count=len(disruptions))
        
        return disruptions
        
    except Exception as e:
        logger.error("Error in disruption detection", error=str(e))
        raise HTTPException(status_code=500, detail=f"Detection error: {str(e)}")

# Economic impact assessment endpoint
@app.post("/assess/economic-impact")
async def assess_economic_impact(
    disruption_id: str,
    affected_routes: List[str],
    duration_days: int = Field(..., ge=1, le=365)
):
    """Assess economic impact of trade disruptions"""
    try:
        logger.info("Received economic impact assessment request", 
                   disruption_id=disruption_id)
        
        if not model_manager:
            raise HTTPException(status_code=503, detail="Model manager not initialized")
        
        # Process economic impact assessment
        impact_assessment = await model_manager.assess_economic_impact(
            disruption_id=disruption_id,
            affected_routes=affected_routes,
            duration_days=duration_days
        )
        
        logger.info("Economic impact assessment completed", 
                   disruption_id=disruption_id)
        
        return impact_assessment
        
    except Exception as e:
        logger.error("Error in economic impact assessment", error=str(e))
        raise HTTPException(status_code=500, detail=f"Assessment error: {str(e)}")

# Model training endpoint
@app.post("/models/train")
async def trigger_model_training(
    background_tasks: BackgroundTasks,
    model_type: str = "all",
    force_retrain: bool = False
):
    """Trigger model training/retraining"""
    try:
        logger.info("Triggering model training", model_type=model_type)
        
        if not model_manager:
            raise HTTPException(status_code=503, detail="Model manager not initialized")
        
        # Add training task to background
        background_tasks.add_task(
            model_manager.train_models,
            model_type=model_type,
            force_retrain=force_retrain
        )
        
        return {
            "message": f"Training initiated for {model_type} models",
            "timestamp": datetime.utcnow(),
            "force_retrain": force_retrain
        }
        
    except Exception as e:
        logger.error("Error triggering model training", error=str(e))
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")

# Real-time data ingestion endpoint
@app.post("/data/ingest")
async def ingest_real_time_data(
    vessel_updates: List[VesselData] = [],
    port_updates: List[Dict[str, Any]] = [],
    news_updates: List[Dict[str, Any]] = [],
    weather_updates: List[Dict[str, Any]] = []
):
    """Ingest real-time data for processing"""
    try:
        logger.info("Received real-time data ingestion request",
                   vessels=len(vessel_updates),
                   ports=len(port_updates),
                   news=len(news_updates),
                   weather=len(weather_updates))
        
        if not data_pipeline:
            raise HTTPException(status_code=503, detail="Data pipeline not initialized")
        
        # Process data ingestion
        result = await data_pipeline.ingest_data(
            vessel_updates=vessel_updates,
            port_updates=port_updates,
            news_updates=news_updates,
            weather_updates=weather_updates
        )
        
        return result
        
    except Exception as e:
        logger.error("Error in data ingestion", error=str(e))
        raise HTTPException(status_code=500, detail=f"Ingestion error: {str(e)}")

# Analytics endpoint
@app.get("/analytics/performance")
async def get_performance_analytics():
    """Get system performance analytics"""
    try:
        if not model_manager or not data_pipeline:
            raise HTTPException(status_code=503, detail="Services not initialized")
        
        analytics = {
            "model_performance": model_manager.get_performance_metrics(),
            "data_pipeline_stats": data_pipeline.get_statistics(),
            "system_resources": {
                "gpu_memory": tf.config.experimental.get_memory_info('GPU:0') if tf.config.list_physical_devices('GPU') else None,
                "tensorflow_version": tf.__version__
            },
            "timestamp": datetime.utcnow()
        }
        
        return analytics
        
    except Exception as e:
        logger.error("Error retrieving analytics", error=str(e))
        raise HTTPException(status_code=500, detail=f"Analytics error: {str(e)}")

# Background tasks
async def periodic_model_training():
    """Periodic model training task"""
    while True:
        try:
            logger.info("Starting periodic model training")
            
            if model_manager:
                await model_manager.train_models(model_type="all", force_retrain=False)
            
            # Wait 24 hours before next training
            await asyncio.sleep(24 * 60 * 60)
            
        except Exception as e:
            logger.error("Error in periodic model training", error=str(e))
            # Wait 1 hour before retrying
            await asyncio.sleep(60 * 60)

async def real_time_processing():
    """Real-time data processing task"""
    while True:
        try:
            if data_pipeline:
                await data_pipeline.process_real_time_data()
            
            # Process every 30 seconds
            await asyncio.sleep(30)
            
        except Exception as e:
            logger.error("Error in real-time processing", error=str(e))
            # Wait 5 minutes before retrying
            await asyncio.sleep(5 * 60)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_config=None  # Use our custom logging
    )
