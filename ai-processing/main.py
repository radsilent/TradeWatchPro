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
from models.location_aware_predictions import LocationAwarePredictor
from models.calibrated_economic_predictor import CalibratedEconomicPredictor
from services.bdi_validation_service import BalticDryIndexService
from models.economic_impact import EconomicImpactAssessor
from services.data_pipeline import DataPipeline
from services.model_manager import ModelManager
from services.database import DatabaseManager
from services.data_ingestion_service import DataIngestionService
from scrapers.real_time_streamer import RealTimeDataStreamer
from scrapers.maritime_data_scraper import MaritimeDataScraper
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
data_ingestion_service = None
real_time_streamer = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global model_manager, db_manager, data_pipeline, data_ingestion_service, real_time_streamer
    
    logger.info("Starting TradeWatch AI Processing System with Real-Time Streaming")
    
    # Initialize core services
    db_manager = DatabaseManager(settings.database_url)
    await db_manager.initialize()
    
    model_manager = ModelManager()
    await model_manager.initialize()
    
    data_pipeline = DataPipeline(db_manager, model_manager)
    location_predictor = LocationAwarePredictor(db_manager)
    economic_predictor = CalibratedEconomicPredictor(db_manager)
    bdi_service = BalticDryIndexService()
    await data_pipeline.initialize()
    
    # Initialize enhanced data ingestion service
    data_ingestion_service = DataIngestionService(db_manager, model_manager)
    await data_ingestion_service.initialize()
    
    # Initialize real-time streaming
    real_time_streamer = RealTimeDataStreamer()
    await real_time_streamer.initialize()
    
    # Start background tasks
    asyncio.create_task(periodic_model_training())
    asyncio.create_task(real_time_processing())
    asyncio.create_task(start_real_time_streaming())
    asyncio.create_task(batch_data_scraping())
    
    logger.info("AI Processing System with Real-Time Streaming initialized successfully")
    
    yield
    
    # Cleanup
    logger.info("Shutting down AI Processing System")
    if data_ingestion_service:
        await data_ingestion_service.shutdown()
    if real_time_streamer:
        await real_time_streamer.shutdown()
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
        
        # Add streaming analytics if available
        if data_ingestion_service:
            analytics["ingestion_stats"] = data_ingestion_service.get_ingestion_statistics()
        
        if real_time_streamer:
            analytics["streaming_stats"] = real_time_streamer.get_stream_statistics()
        
        return analytics
        
    except Exception as e:
        logger.error("Error retrieving analytics", error=str(e))
        raise HTTPException(status_code=500, detail=f"Analytics error: {str(e)}")

# Real-time data endpoints
# Location-aware prediction endpoints
@app.get("/predictions/port-congestion")
async def get_port_congestion_predictions(hours_ahead: int = 72):
    """Get location-aware port congestion predictions"""
    try:
        predictions = await location_predictor.generate_port_congestion_predictions(hours_ahead)
        return {
            "predictions": [
                {
                    "prediction_id": p.prediction_id,
                    "location": p.location,
                    "location_name": p.location_name,
                    "region": p.region,
                    "country": p.country,
                    "prediction_data": p.prediction_data,
                    "confidence_score": p.confidence_score,
                    "effective_radius_km": p.effective_radius_km,
                    "reasoning": p.reasoning
                }
                for p in predictions
            ],
            "total_predictions": len(predictions),
            "hours_ahead": hours_ahead,
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error("Error generating port congestion predictions", error=str(e))
        raise HTTPException(status_code=500, detail=f"Prediction generation failed: {str(e)}")

@app.get("/predictions/fuel-index")
async def get_fuel_index_predictions(hours_ahead: int = 168):
    """Get location-aware fuel index predictions"""
    try:
        predictions = await location_predictor.generate_fuel_index_predictions(hours_ahead)
        return {
            "predictions": [
                {
                    "prediction_id": p.prediction_id,
                    "location": p.location,
                    "location_name": p.location_name,
                    "region": p.region,
                    "country": p.country,
                    "prediction_data": p.prediction_data,
                    "confidence_score": p.confidence_score,
                    "effective_radius_km": p.effective_radius_km,
                    "reasoning": p.reasoning
                }
                for p in predictions
            ],
            "total_predictions": len(predictions),
            "hours_ahead": hours_ahead,
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error("Error generating fuel index predictions", error=str(e))
        raise HTTPException(status_code=500, detail=f"Prediction generation failed: {str(e)}")

@app.get("/predictions/route-performance")
async def get_route_performance_predictions(hours_ahead: int = 336):
    """Get location-aware route performance predictions"""
    try:
        predictions = await location_predictor.generate_route_performance_predictions(hours_ahead)
        return {
            "predictions": [
                {
                    "prediction_id": p.prediction_id,
                    "location": p.location,
                    "location_name": p.location_name,
                    "region": p.region,
                    "country": p.country,
                    "prediction_data": p.prediction_data,
                    "confidence_score": p.confidence_score,
                    "effective_radius_km": p.effective_radius_km,
                    "reasoning": p.reasoning
                }
                for p in predictions
            ],
            "total_predictions": len(predictions),
            "hours_ahead": hours_ahead,
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error("Error generating route performance predictions", error=str(e))
        raise HTTPException(status_code=500, detail=f"Prediction generation failed: {str(e)}")

# Baltic Dry Index validation and calibrated predictions
@app.get("/validation/bdi-current")
async def get_current_bdi():
    """Get current Baltic Dry Index data"""
    try:
        current_bdi = await bdi_service.fetch_real_time_bdi()
        return {
            "bdi": {
                "value": current_bdi.value,
                "change": current_bdi.change,
                "change_percent": current_bdi.change_percent,
                "date": current_bdi.date.isoformat(),
                "source": current_bdi.source
            },
            "market_status": "high_volatility" if abs(current_bdi.change_percent) > 3 else "normal",
            "last_updated": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error("Error fetching current BDI", error=str(e))
        raise HTTPException(status_code=500, detail=f"BDI fetch failed: {str(e)}")

@app.get("/validation/model-accuracy")
async def get_model_validation():
    """Get comprehensive model validation report"""
    try:
        validation_report = await bdi_service.get_validation_report()
        return {
            "validation_report": validation_report,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "active"
        }
    except Exception as e:
        logger.error("Error generating validation report", error=str(e))
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")

@app.get("/predictions/economic-calibrated")
async def get_calibrated_economic_predictions(days_ahead: int = 7):
    """Get calibrated economic predictions with BDI validation"""
    try:
        predictions = await economic_predictor.generate_calibrated_predictions(days_ahead)
        return {
            "predictions": [
                {
                    "metric": p.metric,
                    "current_value": p.current_value,
                    "predicted_value": p.predicted_value,
                    "confidence": p.confidence,
                    "time_horizon_days": p.time_horizon,
                    "key_factors": p.factors,
                    "calibration_applied": p.calibration_applied,
                    "validation_score": p.validation_score
                }
                for p in predictions
            ],
            "total_predictions": len(predictions),
            "time_horizon": days_ahead,
            "calibration_status": "active",
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error("Error generating calibrated predictions", error=str(e))
        raise HTTPException(status_code=500, detail=f"Calibrated prediction failed: {str(e)}")

@app.get("/validation/dashboard")
async def get_validation_dashboard():
    """Get comprehensive validation dashboard data"""
    try:
        dashboard_data = await economic_predictor.get_validation_dashboard_data()
        return {
            "dashboard": dashboard_data,
            "status": "operational",
            "last_updated": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error("Error getting validation dashboard", error=str(e))
        raise HTTPException(status_code=500, detail=f"Dashboard generation failed: {str(e)}")

@app.post("/validation/recalibrate")
async def trigger_model_recalibration():
    """Manually trigger model recalibration"""
    try:
        # Force a validation and recalibration
        validation_predictions = await economic_predictor._generate_validation_predictions()
        validation_result = await bdi_service.validate_model_predictions(validation_predictions)
        
        # Apply recalibration
        new_calibration = await bdi_service.calibrate_model_parameters(validation_result)
        await economic_predictor._update_calibration_parameters(new_calibration)
        
        return {
            "status": "recalibration_complete",
            "new_accuracy": validation_result.accuracy_score,
            "calibration_parameters": new_calibration,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error("Error during recalibration", error=str(e))
        raise HTTPException(status_code=500, detail=f"Recalibration failed: {str(e)}")

@app.get("/streaming/live-data")
async def get_live_streaming_data():
    """Get current live streaming data"""
    try:
        if not real_time_streamer:
            raise HTTPException(status_code=503, detail="Real-time streamer not initialized")
        
        live_data = real_time_streamer.get_live_data()
        
        return {
            "live_data": live_data,
            "timestamp": datetime.utcnow(),
            "data_counts": {
                category: len(data) if isinstance(data, (list, dict)) else 1
                for category, data in live_data.items()
            }
        }
        
    except Exception as e:
        logger.error("Error retrieving live data", error=str(e))
        raise HTTPException(status_code=500, detail=f"Live data error: {str(e)}")

@app.get("/streaming/statistics")
async def get_streaming_statistics():
    """Get detailed streaming statistics"""
    try:
        if not data_ingestion_service:
            raise HTTPException(status_code=503, detail="Data ingestion service not initialized")
        
        stats = data_ingestion_service.get_ingestion_statistics()
        
        return {
            "ingestion_statistics": stats,
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error("Error retrieving streaming statistics", error=str(e))
        raise HTTPException(status_code=500, detail=f"Statistics error: {str(e)}")

@app.post("/streaming/restart-stream")
async def restart_stream(stream_name: str):
    """Restart a specific data stream"""
    try:
        if not real_time_streamer:
            raise HTTPException(status_code=503, detail="Real-time streamer not initialized")
        
        await real_time_streamer.restart_stream(stream_name)
        
        return {
            "message": f"Stream {stream_name} restarted successfully",
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error("Error restarting stream", stream=stream_name, error=str(e))
        raise HTTPException(status_code=500, detail=f"Stream restart error: {str(e)}")

@app.get("/data/recent-vessels")
async def get_recent_vessels(limit: int = 100):
    """Get recent vessel data for real-time display"""
    try:
        if not db_manager:
            raise HTTPException(status_code=503, detail="Database not initialized")
        
        query = """
        SELECT vessel_id, latitude, longitude, speed_knots, heading_degrees, 
               timestamp, data_source
        FROM maritime.vessel_positions 
        WHERE timestamp > NOW() - INTERVAL '1 hour'
        ORDER BY timestamp DESC 
        LIMIT $1
        """
        
        vessels = await db_manager.execute_query(query, limit)
        
        return {
            "vessels": vessels,
            "count": len(vessels),
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error("Error retrieving recent vessels", error=str(e))
        raise HTTPException(status_code=500, detail=f"Vessels data error: {str(e)}")

@app.get("/data/active-alerts")
async def get_active_alerts(severity: str = "all"):
    """Get active alerts and disruptions"""
    try:
        if not db_manager:
            raise HTTPException(status_code=503, detail="Database not initialized")
        
        # Build query based on severity filter
        if severity == "all":
            query = """
            SELECT disruption_id, event_type, title, severity_level, 
                   start_date, probability, confidence_score, ai_generated
            FROM maritime.trade_disruptions 
            WHERE status = 'active' 
               AND (end_date IS NULL OR end_date > NOW())
            ORDER BY severity_level DESC, start_date DESC 
            LIMIT 50
            """
            alerts = await db_manager.execute_query(query)
        else:
            severity_map = {'low': 1, 'medium': 2, 'high': 3, 'critical': 4}
            severity_level = severity_map.get(severity, 2)
            
            query = """
            SELECT disruption_id, event_type, title, severity_level, 
                   start_date, probability, confidence_score, ai_generated
            FROM maritime.trade_disruptions 
            WHERE status = 'active' 
               AND severity_level >= $1
               AND (end_date IS NULL OR end_date > NOW())
            ORDER BY severity_level DESC, start_date DESC 
            LIMIT 50
            """
            alerts = await db_manager.execute_query(query, severity_level)
        
        return {
            "alerts": alerts,
            "count": len(alerts),
            "filter": severity,
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error("Error retrieving active alerts", error=str(e))
        raise HTTPException(status_code=500, detail=f"Alerts data error: {str(e)}")

@app.post("/training/trigger-immediate")
async def trigger_immediate_training(model_type: str = "all"):
    """Trigger immediate model training"""
    try:
        if not model_manager:
            raise HTTPException(status_code=503, detail="Model manager not initialized")
        
        # Start training in background
        asyncio.create_task(model_manager.train_models(model_type=model_type, force_retrain=True))
        
        return {
            "message": f"Immediate training triggered for {model_type} models",
            "timestamp": datetime.utcnow(),
            "model_type": model_type
        }
        
    except Exception as e:
        logger.error("Error triggering immediate training", error=str(e))
        raise HTTPException(status_code=500, detail=f"Training trigger error: {str(e)}")

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

async def start_real_time_streaming():
    """Start real-time data streaming"""
    while True:
        try:
            logger.info("Starting real-time data streaming")
            
            if data_ingestion_service:
                await data_ingestion_service.start_real_time_ingestion()
            
            # Keep streaming running
            await asyncio.sleep(3600)  # Check hourly
            
        except Exception as e:
            logger.error("Error in real-time streaming", error=str(e))
            # Wait 10 minutes before retrying
            await asyncio.sleep(10 * 60)

async def batch_data_scraping():
    """Batch data scraping task"""
    while True:
        try:
            logger.info("Starting batch data scraping")
            
            # Initialize and run batch scraper
            batch_scraper = MaritimeDataScraper()
            await batch_scraper.initialize()
            
            # Scrape data from all sources
            scraped_data = await batch_scraper.scrape_all_sources()
            
            # Process scraped data through ingestion service
            if data_ingestion_service and scraped_data:
                for category, data_items in scraped_data.items():
                    if data_items:
                        await data_ingestion_service.process_real_time_data(
                            f"batch_{category}", data_items
                        )
            
            await batch_scraper.close()
            
            # Wait 2 hours before next scraping cycle
            await asyncio.sleep(2 * 60 * 60)
            
        except Exception as e:
            logger.error("Error in batch data scraping", error=str(e))
            # Wait 30 minutes before retrying
            await asyncio.sleep(30 * 60)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_config=None  # Use our custom logging
    )
