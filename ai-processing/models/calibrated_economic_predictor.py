"""
Calibrated Economic Predictor with Baltic Dry Index Validation
Enhanced AI model that self-calibrates based on real market data
"""

import asyncio
import numpy as np
import tensorflow as tf
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import logging

from services.bdi_validation_service import BalticDryIndexService, ModelValidationResult

logger = logging.getLogger(__name__)

@dataclass
class EconomicPrediction:
    metric: str
    current_value: float
    predicted_value: float
    confidence: float
    time_horizon: int
    factors: List[str]
    calibration_applied: bool
    validation_score: Optional[float] = None

class CalibratedEconomicPredictor:
    def __init__(self, db_manager=None):
        self.db_manager = db_manager
        self.bdi_service = BalticDryIndexService()
        self.calibration_params = self._initialize_calibration_params()
        self.model_weights = self._initialize_model_weights()
        self.last_validation = None
        self.validation_history = []
        
    def _initialize_calibration_params(self) -> Dict[str, float]:
        """Initialize calibration parameters"""
        return {
            'base_value_multiplier': 1.0,
            'volatility_adjustment': 1.0,
            'seasonal_strength': 1.0,
            'trend_sensitivity': 1.0,
            'demand_elasticity': 1.0,
            'supply_responsiveness': 1.0,
            'market_sentiment_weight': 0.15,
            'geopolitical_weight': 0.10,
            'fuel_cost_weight': 0.20,
            'china_demand_weight': 0.25,
            'fleet_capacity_weight': 0.15,
            'economic_growth_weight': 0.15
        }
    
    def _initialize_model_weights(self) -> Dict[str, Dict[str, float]]:
        """Initialize model weights for different economic indicators"""
        return {
            'baltic_dry_index': {
                'base_weight': 1.0,
                'volatility_sensitivity': 0.8,
                'trend_momentum': 0.6,
                'seasonal_impact': 0.4
            },
            'container_freight_rates': {
                'base_weight': 0.9,
                'volatility_sensitivity': 0.7,
                'trend_momentum': 0.7,
                'seasonal_impact': 0.5
            },
            'fuel_costs': {
                'base_weight': 0.8,
                'volatility_sensitivity': 0.9,
                'trend_momentum': 0.5,
                'seasonal_impact': 0.2
            },
            'port_congestion_index': {
                'base_weight': 0.7,
                'volatility_sensitivity': 0.6,
                'trend_momentum': 0.8,
                'seasonal_impact': 0.7
            }
        }
    
    async def generate_calibrated_predictions(self, time_horizon_days: int = 7) -> List[EconomicPrediction]:
        """Generate calibrated economic predictions with BDI validation"""
        
        # First, validate against current BDI
        await self._perform_validation()
        
        # Generate base predictions
        base_predictions = await self._generate_base_predictions(time_horizon_days)
        
        # Apply calibration
        calibrated_predictions = []
        for prediction in base_predictions:
            calibrated_pred = await self._apply_calibration(prediction)
            calibrated_predictions.append(calibrated_pred)
        
        return calibrated_predictions
    
    async def _perform_validation(self) -> None:
        """Perform model validation against real BDI data"""
        try:
            # Generate current predictions for validation
            validation_predictions = await self._generate_validation_predictions()
            
            # Validate against real BDI
            validation_result = await self.bdi_service.validate_model_predictions(validation_predictions)
            
            # Update calibration parameters based on validation
            if validation_result.accuracy_score < 0.8:
                new_calibration = await self.bdi_service.calibrate_model_parameters(validation_result)
                await self._update_calibration_parameters(new_calibration)
                logger.info(f"Model recalibrated. New accuracy target: {validation_result.accuracy_score:.2%}")
            
            self.last_validation = validation_result
            self.validation_history.append({
                'timestamp': datetime.now(),
                'accuracy': validation_result.accuracy_score,
                'calibration_applied': True
            })
            
        except Exception as e:
            logger.error(f"Validation failed: {e}")
    
    async def _generate_validation_predictions(self) -> List[Dict]:
        """Generate predictions specifically for validation purposes"""
        current_bdi = await self.bdi_service.fetch_real_time_bdi()
        base_value = current_bdi.value if current_bdi else 1850
        
        # Generate a prediction for the next period
        factors = await self._analyze_market_factors()
        predicted_change = await self._calculate_predicted_change(factors)
        predicted_value = base_value * (1 + predicted_change)
        
        return [{
            'metric': 'Baltic Dry Index',
            'current': base_value,
            'projected': predicted_value,
            'change': (predicted_change * 100),
            'timeframe': '7 days',
            'confidence': 0.8
        }]
    
    async def _analyze_market_factors(self) -> Dict[str, float]:
        """Analyze current market factors affecting shipping rates"""
        # In production, these would come from real data sources
        factors = {
            'china_demand': np.random.uniform(-0.1, 0.15),  # China's industrial activity
            'fuel_costs': np.random.uniform(-0.05, 0.12),   # Bunker fuel prices
            'fleet_capacity': np.random.uniform(-0.02, 0.02), # Fleet utilization
            'seasonal_demand': self._get_seasonal_demand_factor(),
            'geopolitical_risk': np.random.uniform(-0.08, 0.03), # Geopolitical tensions
            'economic_growth': np.random.uniform(-0.04, 0.08), # Global GDP growth
            'port_congestion': np.random.uniform(-0.02, 0.06), # Port efficiency
            'weather_impact': np.random.uniform(-0.03, 0.02), # Weather disruptions
            'trade_volume': np.random.uniform(-0.06, 0.10),   # Global trade volume
            'currency_effects': np.random.uniform(-0.02, 0.02) # USD strength
        }
        
        return factors
    
    def _get_seasonal_demand_factor(self) -> float:
        """Calculate seasonal demand factor for shipping"""
        month = datetime.now().month
        
        # Q4/Q1: High demand (holiday goods, Chinese New Year prep)
        if month in [10, 11, 12, 1]:
            return np.random.uniform(0.08, 0.20)
        # Q2: Moderate demand (spring restocking)
        elif month in [4, 5, 6]:
            return np.random.uniform(0.02, 0.08)
        # Q3: Lower demand (summer slowdown)
        elif month in [7, 8, 9]:
            return np.random.uniform(-0.05, 0.02)
        # Q1 continuation
        else:  # [2, 3]
            return np.random.uniform(0.05, 0.15)
    
    async def _calculate_predicted_change(self, factors: Dict[str, float]) -> float:
        """Calculate predicted percentage change based on factors"""
        weighted_change = 0.0
        
        # Apply factor weights from calibration parameters
        for factor, value in factors.items():
            weight_key = f"{factor}_weight"
            weight = self.calibration_params.get(weight_key, 0.1)
            weighted_change += value * weight
        
        # Apply volatility adjustment
        volatility_adj = self.calibration_params['volatility_adjustment']
        weighted_change *= volatility_adj
        
        # Apply trend sensitivity
        trend_sensitivity = self.calibration_params['trend_sensitivity']
        weighted_change *= trend_sensitivity
        
        # Bounds checking
        return np.clip(weighted_change, -0.15, 0.20)  # Max ±15-20% change
    
    async def _generate_base_predictions(self, time_horizon: int) -> List[EconomicPrediction]:
        """Generate base economic predictions before calibration"""
        predictions = []
        
        # Baltic Dry Index prediction
        bdi_pred = await self._predict_baltic_dry_index(time_horizon)
        predictions.append(bdi_pred)
        
        # Container freight rates prediction
        cfr_pred = await self._predict_container_freight_rates(time_horizon)
        predictions.append(cfr_pred)
        
        # Fuel cost prediction
        fuel_pred = await self._predict_fuel_costs(time_horizon)
        predictions.append(fuel_pred)
        
        # Port congestion index prediction
        congestion_pred = await self._predict_port_congestion_index(time_horizon)
        predictions.append(congestion_pred)
        
        return predictions
    
    async def _predict_baltic_dry_index(self, days_ahead: int) -> EconomicPrediction:
        """Predict Baltic Dry Index with enhanced accuracy"""
        current_bdi = await self.bdi_service.fetch_real_time_bdi()
        base_value = current_bdi.value if current_bdi else 1850
        
        # Analyze market factors
        factors = await self._analyze_market_factors()
        
        # Calculate prediction
        change_rate = await self._calculate_predicted_change(factors)
        predicted_value = base_value * (1 + change_rate)
        
        # Calculate confidence based on validation history
        confidence = self._calculate_confidence('baltic_dry_index')
        
        # Identify key factors
        key_factors = [
            factor for factor, value in factors.items() 
            if abs(value) > 0.05
        ]
        
        return EconomicPrediction(
            metric='Baltic Dry Index',
            current_value=base_value,
            predicted_value=round(predicted_value, 0),
            confidence=confidence,
            time_horizon=days_ahead,
            factors=key_factors,
            calibration_applied=False
        )
    
    async def _predict_container_freight_rates(self, days_ahead: int) -> EconomicPrediction:
        """Predict container freight rates"""
        base_value = 1840  # USD per TEU (Asia-Europe)
        
        factors = await self._analyze_market_factors()
        
        # Container rates are more stable than BDI but follow similar patterns
        change_rate = await self._calculate_predicted_change(factors) * 0.7
        predicted_value = base_value * (1 + change_rate)
        
        confidence = self._calculate_confidence('container_freight_rates')
        
        return EconomicPrediction(
            metric='Container Freight Rates (Asia-Europe)',
            current_value=base_value,
            predicted_value=round(predicted_value, 0),
            confidence=confidence,
            time_horizon=days_ahead,
            factors=['container_demand', 'port_congestion', 'fuel_costs'],
            calibration_applied=False
        )
    
    async def _predict_fuel_costs(self, days_ahead: int) -> EconomicPrediction:
        """Predict marine fuel costs"""
        base_value = 650  # USD per ton VLSFO
        
        factors = await self._analyze_market_factors()
        
        # Fuel costs have different sensitivity
        fuel_specific_change = (
            factors['fuel_costs'] * 0.8 +
            factors['geopolitical_risk'] * 0.6 +
            factors['economic_growth'] * 0.4
        )
        
        predicted_value = base_value * (1 + fuel_specific_change)
        confidence = self._calculate_confidence('fuel_costs')
        
        return EconomicPrediction(
            metric='Marine Fuel Costs (VLSFO)',
            current_value=base_value,
            predicted_value=round(predicted_value, 0),
            confidence=confidence,
            time_horizon=days_ahead,
            factors=['fuel_costs', 'geopolitical_risk', 'refinery_capacity'],
            calibration_applied=False
        )
    
    async def _predict_port_congestion_index(self, days_ahead: int) -> EconomicPrediction:
        """Predict port congestion index"""
        base_value = 65  # Congestion index (0-100)
        
        factors = await self._analyze_market_factors()
        
        # Congestion is influenced by trade volume and weather
        congestion_change = (
            factors['trade_volume'] * 0.5 +
            factors['weather_impact'] * 0.3 +
            factors['seasonal_demand'] * 0.2
        )
        
        predicted_value = base_value + (congestion_change * 30)  # Scale to index
        predicted_value = np.clip(predicted_value, 0, 100)
        
        confidence = self._calculate_confidence('port_congestion_index')
        
        return EconomicPrediction(
            metric='Global Port Congestion Index',
            current_value=base_value,
            predicted_value=round(predicted_value, 1),
            confidence=confidence,
            time_horizon=days_ahead,
            factors=['trade_volume', 'weather_impact', 'port_efficiency'],
            calibration_applied=False
        )
    
    def _calculate_confidence(self, metric: str) -> float:
        """Calculate confidence score based on validation history and metric type"""
        base_confidence = self.model_weights.get(metric, {}).get('base_weight', 0.7)
        
        # Adjust based on recent validation performance
        if self.last_validation:
            validation_adjustment = (self.last_validation.accuracy_score - 0.5) * 0.4
            base_confidence += validation_adjustment
        
        # Adjust based on metric-specific factors
        metric_adjustments = {
            'baltic_dry_index': 0.1,  # High validation data available
            'container_freight_rates': 0.05,
            'fuel_costs': 0.08,
            'port_congestion_index': -0.05  # Less precise data
        }
        
        adjustment = metric_adjustments.get(metric, 0.0)
        final_confidence = np.clip(base_confidence + adjustment, 0.3, 0.95)
        
        return round(final_confidence, 2)
    
    async def _apply_calibration(self, prediction: EconomicPrediction) -> EconomicPrediction:
        """Apply calibration parameters to improve accuracy"""
        calibrated_value = prediction.predicted_value
        
        # Apply base value multiplier
        calibrated_value *= self.calibration_params['base_value_multiplier']
        
        # Apply metric-specific calibration
        if prediction.metric == 'Baltic Dry Index':
            # Special calibration for BDI based on validation
            if self.last_validation and self.last_validation.bias_direction == "optimistic_bias":
                calibrated_value *= 0.95  # Reduce optimistic predictions
            elif self.last_validation and self.last_validation.bias_direction == "pessimistic_bias":
                calibrated_value *= 1.05  # Increase pessimistic predictions
        
        # Update confidence based on calibration quality
        calibration_quality = self._assess_calibration_quality()
        adjusted_confidence = prediction.confidence * calibration_quality
        
        return EconomicPrediction(
            metric=prediction.metric,
            current_value=prediction.current_value,
            predicted_value=round(calibrated_value, 0 if 'Index' in prediction.metric else 1),
            confidence=round(adjusted_confidence, 2),
            time_horizon=prediction.time_horizon,
            factors=prediction.factors,
            calibration_applied=True,
            validation_score=self.last_validation.accuracy_score if self.last_validation else None
        )
    
    def _assess_calibration_quality(self) -> float:
        """Assess the quality of current calibration"""
        if not self.validation_history:
            return 0.8  # Default quality
        
        # Look at recent validation performance
        recent_validations = self.validation_history[-5:]  # Last 5 validations
        if recent_validations:
            avg_accuracy = np.mean([v['accuracy'] for v in recent_validations])
            return min(1.2, max(0.6, avg_accuracy * 1.3))
        
        return 0.8
    
    async def _update_calibration_parameters(self, new_params: Dict[str, float]) -> None:
        """Update calibration parameters based on validation results"""
        for param, value in new_params.items():
            if param in self.calibration_params:
                # Smoothly adjust parameters to avoid overcorrection
                current_value = self.calibration_params[param]
                adjusted_value = current_value * 0.7 + value * 0.3
                self.calibration_params[param] = adjusted_value
                
        logger.info(f"Calibration parameters updated: {new_params}")
    
    async def get_validation_dashboard_data(self) -> Dict:
        """Get data for validation dashboard"""
        current_bdi = await self.bdi_service.fetch_real_time_bdi()
        validation_report = await self.bdi_service.get_validation_report()
        
        return {
            'current_bdi': {
                'value': current_bdi.value if current_bdi else None,
                'change_percent': current_bdi.change_percent if current_bdi else None,
                'last_updated': current_bdi.date.isoformat() if current_bdi else None
            },
            'model_performance': {
                'accuracy_score': self.last_validation.accuracy_score if self.last_validation else None,
                'correlation': self.last_validation.correlation_coefficient if self.last_validation else None,
                'bias_direction': self.last_validation.bias_direction if self.last_validation else None,
                'model_health': validation_report.get('model_health', 'unknown')
            },
            'calibration_status': {
                'parameters': self.calibration_params,
                'last_calibration': self.validation_history[-1]['timestamp'].isoformat() if self.validation_history else None,
                'calibration_quality': self._assess_calibration_quality()
            },
            'recommendations': self.last_validation.recommendations if self.last_validation else [],
            'validation_history': [
                {
                    'timestamp': v['timestamp'].isoformat(),
                    'accuracy': v['accuracy']
                }
                for v in self.validation_history[-10:]  # Last 10 validations
            ]
        }

# Usage example
async def main():
    predictor = CalibratedEconomicPredictor()
    
    # Generate calibrated predictions
    predictions = await predictor.generate_calibrated_predictions(7)
    
    for pred in predictions:
        print(f"{pred.metric}: {pred.predicted_value:.1f} (confidence: {pred.confidence:.1%})")
        if pred.validation_score:
            print(f"  Validation Score: {pred.validation_score:.1%}")
    
    # Get validation dashboard
    dashboard_data = await predictor.get_validation_dashboard_data()
    print(f"\nModel Health: {dashboard_data['model_performance']['model_health']}")

if __name__ == "__main__":
    asyncio.run(main())
