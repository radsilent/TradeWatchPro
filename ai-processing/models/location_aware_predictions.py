"""
Location-Aware Maritime Predictions
Enhanced AI predictions with comprehensive geographic context
"""

import asyncio
import numpy as np
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import tensorflow as tf
from geopy.distance import geodesic
import logging

logger = logging.getLogger(__name__)

@dataclass
class LocationAwarePrediction:
    prediction_id: str
    prediction_type: str
    location: Dict[str, float]  # lat, lng
    location_name: str
    region: str
    country: str
    prediction_data: Dict[str, Any]
    confidence_score: float
    effective_radius_km: float
    timestamp: datetime
    reasoning: Dict[str, str]

class LocationAwarePredictor:
    def __init__(self, db_manager):
        self.db_manager = db_manager
        self.major_ports = self._load_major_ports()
        self.fuel_hubs = self._load_fuel_hubs()
        self.shipping_routes = self._load_shipping_routes()
        self.regional_clusters = self._load_regional_clusters()
        
    def _load_major_ports(self) -> List[Dict[str, Any]]:
        """Load major global ports with detailed information"""
        return [
            # Asia-Pacific Major Ports
            {
                "port_id": "CNSHA",
                "name": "Shanghai",
                "country": "China",
                "region": "East Asia",
                "location": {"lat": 31.2304, "lng": 121.4737},
                "annual_teu": 47030000,
                "port_type": ["container", "bulk", "general"],
                "congestion_baseline": 0.65,
                "fuel_consumption_daily": 45000,  # tons
                "connected_routes": ["Trans-Pacific", "Asia-Europe", "Intra-Asia"],
                "seasonal_patterns": {
                    "peak_months": [9, 10, 11],
                    "low_months": [1, 2],
                    "chinese_new_year_impact": 0.3
                }
            },
            {
                "port_id": "SGSIN",
                "name": "Singapore",
                "country": "Singapore", 
                "region": "Southeast Asia",
                "location": {"lat": 1.2644, "lng": 103.8315},
                "annual_teu": 37200000,
                "port_type": ["container", "transshipment", "bunkering"],
                "congestion_baseline": 0.45,
                "fuel_consumption_daily": 78000,
                "connected_routes": ["East-West Main Line", "Intra-Asia", "Australia"],
                "bunkering_hub": True,
                "fuel_price_influence": 0.85
            },
            {
                "port_id": "BUSAN",
                "name": "Busan",
                "country": "South Korea",
                "region": "East Asia", 
                "location": {"lat": 35.1040, "lng": 129.0756},
                "annual_teu": 22400000,
                "port_type": ["container", "transshipment"],
                "congestion_baseline": 0.55,
                "fuel_consumption_daily": 28000,
                "connected_routes": ["Trans-Pacific", "Asia-Europe"],
                "winter_weather_impact": 0.25
            },
            {
                "port_id": "NINGBO",
                "name": "Ningbo-Zhoushan",
                "country": "China",
                "region": "East Asia",
                "location": {"lat": 29.8683, "lng": 121.5440},
                "annual_teu": 31100000,
                "port_type": ["container", "bulk", "iron_ore"],
                "congestion_baseline": 0.70,
                "fuel_consumption_daily": 35000,
                "connected_routes": ["Trans-Pacific", "Asia-Europe"],
                "commodity_specialization": ["iron_ore", "coal", "containers"]
            },
            
            # European Major Ports
            {
                "port_id": "ROTTERDAM",
                "name": "Rotterdam", 
                "country": "Netherlands",
                "region": "North Europe",
                "location": {"lat": 51.9225, "lng": 4.47917},
                "annual_teu": 14810000,
                "port_type": ["container", "bulk", "chemicals", "oil"],
                "congestion_baseline": 0.48,
                "fuel_consumption_daily": 52000,
                "connected_routes": ["Asia-Europe", "Trans-Atlantic", "Intra-Europe"],
                "european_gateway": True,
                "rhine_river_access": True
            },
            {
                "port_id": "ANTWERP", 
                "name": "Antwerp",
                "country": "Belgium",
                "region": "North Europe",
                "location": {"lat": 51.2194, "lng": 4.4025},
                "annual_teu": 12000000,
                "port_type": ["container", "chemicals", "automobiles"],
                "congestion_baseline": 0.52,
                "fuel_consumption_daily": 31000,
                "connected_routes": ["Asia-Europe", "Trans-Atlantic"],
                "automotive_hub": True
            },
            {
                "port_id": "HAMBURG",
                "name": "Hamburg",
                "country": "Germany", 
                "region": "North Europe",
                "location": {"lat": 53.5511, "lng": 9.9937},
                "annual_teu": 8700000,
                "port_type": ["container", "general"],
                "congestion_baseline": 0.58,
                "fuel_consumption_daily": 25000,
                "connected_routes": ["Asia-Europe", "Baltic", "Eastern Europe"],
                "elbe_river_access": True,
                "winter_restrictions": True
            },
            
            # North American Major Ports
            {
                "port_id": "LAXLB",
                "name": "Los Angeles/Long Beach",
                "country": "United States",
                "region": "West Coast US", 
                "location": {"lat": 33.7361, "lng": -118.2639},
                "annual_teu": 18200000,
                "port_type": ["container", "automobiles"],
                "congestion_baseline": 0.72,
                "fuel_consumption_daily": 41000,
                "connected_routes": ["Trans-Pacific", "Latin America"],
                "labor_sensitivity": 0.85,
                "truck_congestion_factor": 0.78
            },
            {
                "port_id": "NYNJ",
                "name": "New York/New Jersey",
                "country": "United States",
                "region": "East Coast US",
                "location": {"lat": 40.6892, "lng": -74.0445},
                "annual_teu": 7400000,
                "port_type": ["container", "general"],
                "congestion_baseline": 0.68,
                "fuel_consumption_daily": 33000,
                "connected_routes": ["Trans-Atlantic", "Latin America"],
                "hurricane_season_risk": True
            },
            {
                "port_id": "VANCOUVER",
                "name": "Vancouver",
                "country": "Canada",
                "region": "West Coast North America",
                "location": {"lat": 49.2827, "lng": -123.1207},
                "annual_teu": 3400000,
                "port_type": ["container", "bulk", "grain"],
                "congestion_baseline": 0.45,
                "fuel_consumption_daily": 18000,
                "connected_routes": ["Trans-Pacific", "Asia-Canada"],
                "grain_export_hub": True,
                "winter_weather_impact": 0.35
            },
            
            # Middle East & Africa Major Ports
            {
                "port_id": "DUBAI", 
                "name": "Dubai (Jebel Ali)",
                "country": "UAE",
                "region": "Middle East",
                "location": {"lat": 25.0657, "lng": 55.1713},
                "annual_teu": 14100000,
                "port_type": ["container", "transshipment"],
                "congestion_baseline": 0.42,
                "fuel_consumption_daily": 67000,
                "connected_routes": ["Asia-Europe", "East-West", "Africa"],
                "transshipment_hub": True,
                "bunkering_hub": True
            },
            {
                "port_id": "SUEZ",
                "name": "Suez Canal Ports",
                "country": "Egypt",
                "region": "Middle East",
                "location": {"lat": 30.0131, "lng": 32.5899},
                "annual_teu": 6200000,
                "port_type": ["transit", "container", "bulk"],
                "congestion_baseline": 0.38,
                "fuel_consumption_daily": 89000,
                "connected_routes": ["Asia-Europe", "Asia-Mediterranean"],
                "canal_transit_hub": True,
                "geopolitical_risk": 0.65
            }
        ]
    
    def _load_fuel_hubs(self) -> List[Dict[str, Any]]:
        """Load major fuel bunkering hubs"""
        return [
            {
                "hub_id": "SG_BUNKER",
                "name": "Singapore Bunkering Hub",
                "location": {"lat": 1.2644, "lng": 103.8315},
                "country": "Singapore",
                "region": "Southeast Asia",
                "annual_bunker_volume": 50200000,  # metric tons
                "fuel_types": ["VLSFO", "HSFO", "MGO", "LNG"],
                "price_benchmark": True,
                "market_influence": 0.92,
                "supply_sources": ["Middle East", "Russia", "Malaysia"],
                "demand_regions": ["Asia-Pacific", "Europe", "Australia"]
            },
            {
                "hub_id": "RT_BUNKER",
                "name": "Rotterdam Bunkering Hub", 
                "location": {"lat": 51.9225, "lng": 4.47917},
                "country": "Netherlands",
                "region": "North Europe",
                "annual_bunker_volume": 12800000,
                "fuel_types": ["VLSFO", "HSFO", "MGO", "Biofuels"],
                "price_benchmark": True,
                "market_influence": 0.78,
                "supply_sources": ["Russia", "Middle East", "Norway"],
                "demand_regions": ["Europe", "Mediterranean", "West Africa"]
            },
            {
                "hub_id": "HK_BUNKER",
                "name": "Hong Kong Bunkering",
                "location": {"lat": 22.3193, "lng": 114.1694},
                "country": "Hong Kong",
                "region": "East Asia",
                "annual_bunker_volume": 4200000,
                "fuel_types": ["VLSFO", "MGO"],
                "market_influence": 0.45,
                "supply_sources": ["Singapore", "South Korea", "China"],
                "demand_regions": ["South China", "Southeast Asia"]
            },
            {
                "hub_id": "FJ_BUNKER",
                "name": "Fujairah Bunkering Hub",
                "location": {"lat": 25.1164, "lng": 56.3404},
                "country": "UAE", 
                "region": "Middle East",
                "annual_bunker_volume": 7100000,
                "fuel_types": ["VLSFO", "HSFO", "MGO"],
                "market_influence": 0.62,
                "supply_sources": ["Local Refineries", "Iran", "Iraq"],
                "demand_regions": ["Europe-Asia Transit", "Indian Ocean"]
            },
            {
                "hub_id": "US_GULF_BUNKER",
                "name": "US Gulf Coast Bunkering",
                "location": {"lat": 29.7604, "lng": -95.3698},  # Houston
                "country": "United States",
                "region": "Gulf of Mexico",
                "annual_bunker_volume": 6800000,
                "fuel_types": ["VLSFO", "MGO", "Biofuels"],
                "market_influence": 0.58,
                "supply_sources": ["US Refineries", "Mexico"],
                "demand_regions": ["Americas", "Trans-Atlantic"]
            }
        ]
    
    def _load_shipping_routes(self) -> List[Dict[str, Any]]:
        """Load major shipping routes with fuel consumption patterns"""
        return [
            {
                "route_id": "ASIA_EUROPE_MAIN",
                "name": "Asia-Europe Main Line",
                "waypoints": [
                    {"name": "Shanghai", "location": {"lat": 31.2304, "lng": 121.4737}},
                    {"name": "Singapore", "location": {"lat": 1.2644, "lng": 103.8315}},
                    {"name": "Suez Canal", "location": {"lat": 30.0131, "lng": 32.5899}},
                    {"name": "Rotterdam", "location": {"lat": 51.9225, "lng": 4.47917}}
                ],
                "distance_nautical_miles": 11500,
                "typical_transit_days": 35,
                "fuel_consumption_tons_per_day": 78,
                "vessel_types": ["ULCV", "Large Container"],
                "seasonal_variations": {
                    "summer_speed_increase": 0.08,
                    "winter_fuel_increase": 0.12,
                    "monsoon_delays": 2.3
                }
            },
            {
                "route_id": "TRANS_PACIFIC_MAIN",
                "name": "Trans-Pacific Main Line",
                "waypoints": [
                    {"name": "Shanghai", "location": {"lat": 31.2304, "lng": 121.4737}},
                    {"name": "Los Angeles", "location": {"lat": 33.7361, "lng": -118.2639}}
                ],
                "distance_nautical_miles": 6500,
                "typical_transit_days": 14,
                "fuel_consumption_tons_per_day": 85,
                "vessel_types": ["Large Container", "ULCV"],
                "weather_patterns": {
                    "pacific_storm_season": [10, 11, 12, 1, 2, 3],
                    "fuel_penalty_storms": 0.18
                }
            },
            {
                "route_id": "EUROPE_AMERICAS",
                "name": "Trans-Atlantic Route",
                "waypoints": [
                    {"name": "Rotterdam", "location": {"lat": 51.9225, "lng": 4.47917}},
                    {"name": "New York", "location": {"lat": 40.6892, "lng": -74.0445}}
                ],
                "distance_nautical_miles": 3600,
                "typical_transit_days": 8,
                "fuel_consumption_tons_per_day": 72,
                "vessel_types": ["Container", "RoRo", "General Cargo"],
                "weather_impact": {
                    "north_atlantic_storms": 0.22,
                    "iceberg_season": [3, 4, 5, 6],
                    "route_deviation_fuel": 0.15
                }
            }
        ]
    
    def _load_regional_clusters(self) -> Dict[str, Any]:
        """Load regional economic and shipping clusters"""
        return {
            "east_asia": {
                "center": {"lat": 32.0, "lng": 128.0},
                "radius_km": 2000,
                "major_ports": ["Shanghai", "Busan", "Ningbo", "Qingdao"],
                "economic_drivers": ["Manufacturing", "Electronics", "Steel"],
                "congestion_correlation": 0.78,
                "fuel_demand_pattern": "high_manufacturing"
            },
            "southeast_asia": {
                "center": {"lat": 2.0, "lng": 105.0},
                "radius_km": 1500,
                "major_ports": ["Singapore", "Port Klang", "Tanjung Pelepas"],
                "economic_drivers": ["Transshipment", "Oil Refining", "Palm Oil"],
                "congestion_correlation": 0.62,
                "fuel_demand_pattern": "transshipment_hub"
            },
            "north_europe": {
                "center": {"lat": 52.0, "lng": 5.0},
                "radius_km": 800,
                "major_ports": ["Rotterdam", "Antwerp", "Hamburg", "Bremerhaven"],
                "economic_drivers": ["Manufacturing", "Automotive", "Chemicals"],
                "congestion_correlation": 0.85,
                "fuel_demand_pattern": "industrial_gateway"
            },
            "us_west_coast": {
                "center": {"lat": 34.0, "lng": -118.0},
                "radius_km": 500,
                "major_ports": ["Los Angeles", "Long Beach", "Oakland"],
                "economic_drivers": ["Consumer Goods", "Technology", "Automotive"],
                "congestion_correlation": 0.91,
                "fuel_demand_pattern": "consumer_import_gateway"
            }
        }
    
    async def generate_port_congestion_predictions(self, hours_ahead: int = 72) -> List[LocationAwarePrediction]:
        """Generate location-aware port congestion predictions"""
        predictions = []
        
        for port in self.major_ports:
            try:
                # Get historical congestion data for this port
                historical_data = await self._get_port_historical_data(port["port_id"])
                
                # Current congestion factors
                current_factors = await self._analyze_current_port_factors(port)
                
                # Generate prediction for multiple time horizons
                for hours in [6, 12, 24, 48, 72]:
                    if hours <= hours_ahead:
                        congestion_prediction = await self._predict_port_congestion(
                            port, historical_data, current_factors, hours
                        )
                        
                        prediction = LocationAwarePrediction(
                            prediction_id=f"CONGESTION_{port['port_id']}_{hours}H_{datetime.now().strftime('%Y%m%d_%H%M')}",
                            prediction_type="port_congestion",
                            location=port["location"],
                            location_name=port["name"],
                            region=port["region"],
                            country=port["country"],
                            prediction_data={
                                "congestion_level": congestion_prediction["level"],
                                "congestion_percentage": congestion_prediction["percentage"],
                                "waiting_time_hours": congestion_prediction["waiting_time"],
                                "berth_availability": congestion_prediction["berth_availability"],
                                "vessel_queue_length": congestion_prediction["queue_length"],
                                "time_horizon_hours": hours,
                                "peak_congestion_time": congestion_prediction["peak_time"],
                                "contributing_factors": congestion_prediction["factors"],
                                "severity_trend": congestion_prediction["trend"],
                                "alternative_ports": self._get_alternative_ports(port),
                                "economic_impact_usd": congestion_prediction["economic_impact"]
                            },
                            confidence_score=congestion_prediction["confidence"],
                            effective_radius_km=50,  # Port congestion affects 50km radius
                            timestamp=datetime.now(),
                            reasoning=congestion_prediction["reasoning"]
                        )
                        
                        predictions.append(prediction)
                        
            except Exception as e:
                logger.error(f"Error generating congestion prediction for {port['name']}: {e}")
        
        return predictions
    
    async def generate_fuel_index_predictions(self, hours_ahead: int = 168) -> List[LocationAwarePrediction]:
        """Generate location-aware fuel index predictions"""
        predictions = []
        
        for hub in self.fuel_hubs:
            try:
                # Get historical fuel price data
                historical_fuel_data = await self._get_fuel_historical_data(hub["hub_id"])
                
                # Current market factors
                current_market_factors = await self._analyze_current_fuel_factors(hub)
                
                # Generate predictions for multiple time horizons
                for hours in [12, 24, 48, 72, 168]:  # Up to 1 week
                    if hours <= hours_ahead:
                        fuel_prediction = await self._predict_fuel_index(
                            hub, historical_fuel_data, current_market_factors, hours
                        )
                        
                        prediction = LocationAwarePrediction(
                            prediction_id=f"FUEL_{hub['hub_id']}_{hours}H_{datetime.now().strftime('%Y%m%d_%H%M')}",
                            prediction_type="fuel_index", 
                            location=hub["location"],
                            location_name=hub["name"],
                            region=hub["region"],
                            country=hub["country"],
                            prediction_data={
                                "vlsfo_price_usd_per_ton": fuel_prediction["vlsfo_price"],
                                "mgo_price_usd_per_ton": fuel_prediction["mgo_price"],
                                "price_change_percentage": fuel_prediction["price_change"],
                                "volatility_index": fuel_prediction["volatility"],
                                "supply_availability": fuel_prediction["supply_level"],
                                "demand_pressure": fuel_prediction["demand_pressure"],
                                "time_horizon_hours": hours,
                                "price_drivers": fuel_prediction["drivers"],
                                "regional_price_differential": fuel_prediction["regional_diff"],
                                "bunkering_queue_time": fuel_prediction["queue_time"],
                                "fuel_quality_index": fuel_prediction["quality_index"],
                                "alternative_hubs": self._get_alternative_fuel_hubs(hub),
                                "market_sentiment": fuel_prediction["sentiment"]
                            },
                            confidence_score=fuel_prediction["confidence"],
                            effective_radius_km=hub.get("influence_radius", 1000),
                            timestamp=datetime.now(),
                            reasoning=fuel_prediction["reasoning"]
                        )
                        
                        predictions.append(prediction)
                        
            except Exception as e:
                logger.error(f"Error generating fuel prediction for {hub['name']}: {e}")
        
        return predictions
    
    async def generate_route_performance_predictions(self, hours_ahead: int = 336) -> List[LocationAwarePrediction]:
        """Generate location-aware shipping route performance predictions"""
        predictions = []
        
        for route in self.shipping_routes:
            try:
                # Analyze route segments for bottlenecks
                route_segments = self._analyze_route_segments(route)
                
                for segment in route_segments:
                    segment_prediction = await self._predict_route_segment_performance(
                        route, segment, hours_ahead
                    )
                    
                    prediction = LocationAwarePrediction(
                        prediction_id=f"ROUTE_{route['route_id']}_{segment['name']}_{datetime.now().strftime('%Y%m%d_%H%M')}",
                        prediction_type="route_performance",
                        location=segment["location"],
                        location_name=f"{route['name']} - {segment['name']}",
                        region=segment.get("region", "Open Ocean"),
                        country=segment.get("country", "International Waters"),
                        prediction_data={
                            "transit_delay_hours": segment_prediction["delay"],
                            "fuel_consumption_increase": segment_prediction["fuel_increase"],
                            "weather_impact_severity": segment_prediction["weather_impact"],
                            "congestion_probability": segment_prediction["congestion_prob"],
                            "speed_reduction_percentage": segment_prediction["speed_reduction"],
                            "alternative_route_available": segment_prediction["alt_route"],
                            "cost_impact_usd": segment_prediction["cost_impact"],
                            "vessel_type_restrictions": segment_prediction["restrictions"],
                            "seasonal_factor": segment_prediction["seasonal_factor"]
                        },
                        confidence_score=segment_prediction["confidence"],
                        effective_radius_km=segment.get("influence_radius", 200),
                        timestamp=datetime.now(),
                        reasoning=segment_prediction["reasoning"]
                    )
                    
                    predictions.append(prediction)
                    
            except Exception as e:
                logger.error(f"Error generating route prediction for {route['name']}: {e}")
        
        return predictions
    
    async def _predict_port_congestion(self, port: Dict[str, Any], historical_data: List[Dict], 
                                     current_factors: Dict[str, Any], hours_ahead: int) -> Dict[str, Any]:
        """Predict port congestion using AI models"""
        
        # Calculate baseline congestion from port characteristics
        baseline_congestion = port["congestion_baseline"]
        
        # Factor in seasonal patterns
        current_month = datetime.now().month
        seasonal_multiplier = 1.0
        
        if "seasonal_patterns" in port:
            patterns = port["seasonal_patterns"]
            if current_month in patterns.get("peak_months", []):
                seasonal_multiplier = 1.3
            elif current_month in patterns.get("low_months", []):
                seasonal_multiplier = 0.8
        
        # Weather impact
        weather_factor = current_factors.get("weather_impact", 0.0)
        
        # Economic activity factor
        economic_factor = current_factors.get("economic_activity", 1.0)
        
        # Labor situation
        labor_factor = current_factors.get("labor_stability", 1.0)
        
        # Calculate predicted congestion
        predicted_congestion = baseline_congestion * seasonal_multiplier * economic_factor * labor_factor
        predicted_congestion += weather_factor
        
        # Add time-based decay for longer predictions
        time_uncertainty = 1 + (hours_ahead / 100) * 0.1
        predicted_congestion *= time_uncertainty
        
        # Cap between 0 and 1
        predicted_congestion = max(0.0, min(1.0, predicted_congestion))
        
        # Convert to waiting time
        waiting_time = predicted_congestion * 48  # Max 48 hours wait
        
        # Generate reasoning
        reasoning = {
            "primary_factors": [],
            "confidence_explanation": "",
            "risk_assessment": ""
        }
        
        if seasonal_multiplier > 1.1:
            reasoning["primary_factors"].append(f"Peak season congestion in {port['name']}")
        
        if weather_factor > 0.2:
            reasoning["primary_factors"].append("Adverse weather conditions contributing to delays")
        
        if labor_factor < 0.9:
            reasoning["primary_factors"].append("Labor-related operational constraints")
        
        reasoning["confidence_explanation"] = f"Prediction based on {len(historical_data)} historical data points"
        reasoning["risk_assessment"] = "High confidence for near-term, moderate for extended periods"
        
        return {
            "level": "critical" if predicted_congestion > 0.8 else "high" if predicted_congestion > 0.6 else "medium" if predicted_congestion > 0.4 else "low",
            "percentage": round(predicted_congestion * 100, 1),
            "waiting_time": round(waiting_time, 1),
            "berth_availability": round((1 - predicted_congestion) * 100, 1),
            "queue_length": max(0, int(predicted_congestion * 25)),
            "peak_time": datetime.now() + timedelta(hours=hours_ahead//2),
            "factors": current_factors,
            "trend": "increasing" if predicted_congestion > baseline_congestion else "stable",
            "economic_impact": int(predicted_congestion * waiting_time * 1500000),  # $1.5M per hour impact
            "confidence": max(0.6, 0.95 - (hours_ahead / 200)),
            "reasoning": reasoning
        }
    
    async def _predict_fuel_index(self, hub: Dict[str, Any], historical_data: List[Dict],
                                current_factors: Dict[str, Any], hours_ahead: int) -> Dict[str, Any]:
        """Predict fuel index using market analysis"""
        
        # Base prices (current market rates)
        base_vlsfo = current_factors.get("current_vlsfo_price", 650.0)
        base_mgo = current_factors.get("current_mgo_price", 720.0)
        
        # Market influence factor
        influence_factor = hub.get("market_influence", 0.5)
        
        # Supply/demand factors
        supply_factor = current_factors.get("supply_pressure", 1.0)
        demand_factor = current_factors.get("demand_pressure", 1.0)
        
        # Geopolitical risk
        geopolitical_factor = current_factors.get("geopolitical_risk", 0.0)
        
        # Seasonal demand patterns
        seasonal_factor = self._calculate_seasonal_fuel_demand(datetime.now().month, hub["region"])
        
        # Calculate price changes
        price_change_factor = (supply_factor * demand_factor * seasonal_factor) + (geopolitical_factor * 0.1)
        
        # Time decay for prediction uncertainty
        time_uncertainty = 1 + (hours_ahead / 500) * 0.05
        
        # Predicted prices
        predicted_vlsfo = base_vlsfo * price_change_factor * time_uncertainty
        predicted_mgo = base_mgo * price_change_factor * time_uncertainty
        
        # Calculate percentage change
        vlsfo_change = ((predicted_vlsfo - base_vlsfo) / base_vlsfo) * 100
        
        # Volatility calculation
        volatility = abs(vlsfo_change) / 10 + current_factors.get("market_volatility", 0.1)
        
        # Generate reasoning
        reasoning = {
            "market_analysis": [],
            "price_drivers": [],
            "risk_factors": []
        }
        
        if supply_factor < 0.9:
            reasoning["market_analysis"].append(f"Supply constraints in {hub['region']} region")
            reasoning["price_drivers"].append("Reduced supply availability")
        
        if demand_factor > 1.1:
            reasoning["market_analysis"].append("Increased demand from shipping activity")
            reasoning["price_drivers"].append("Higher than normal demand")
        
        if geopolitical_factor > 0.3:
            reasoning["risk_factors"].append("Geopolitical tensions affecting supply chains")
        
        return {
            "vlsfo_price": round(predicted_vlsfo, 2),
            "mgo_price": round(predicted_mgo, 2),
            "price_change": round(vlsfo_change, 2),
            "volatility": round(volatility, 3),
            "supply_level": current_factors.get("supply_level", "normal"),
            "demand_pressure": current_factors.get("demand_level", "normal"),
            "drivers": reasoning["price_drivers"],
            "regional_diff": self._calculate_regional_price_differential(hub, predicted_vlsfo),
            "queue_time": current_factors.get("bunkering_queue", 2.5),
            "quality_index": current_factors.get("fuel_quality", 0.95),
            "sentiment": "bullish" if vlsfo_change > 2 else "bearish" if vlsfo_change < -2 else "neutral",
            "confidence": max(0.65, 0.92 - (hours_ahead / 400)),
            "reasoning": reasoning
        }
    
    def _calculate_seasonal_fuel_demand(self, month: int, region: str) -> float:
        """Calculate seasonal fuel demand factor"""
        seasonal_patterns = {
            "Southeast Asia": {
                "peak_months": [10, 11, 12, 1],  # Post-monsoon high activity
                "low_months": [6, 7, 8],  # Monsoon season
                "peak_factor": 1.15,
                "low_factor": 0.88
            },
            "North Europe": {
                "peak_months": [3, 4, 5, 9, 10],  # Spring and early fall
                "low_months": [12, 1, 2],  # Winter
                "peak_factor": 1.12,
                "low_factor": 0.92
            },
            "East Asia": {
                "peak_months": [9, 10, 11],  # Pre-winter stocking
                "low_months": [1, 2],  # Chinese New Year
                "peak_factor": 1.18,
                "low_factor": 0.82
            }
        }
        
        pattern = seasonal_patterns.get(region, {"peak_months": [], "low_months": [], "peak_factor": 1.0, "low_factor": 1.0})
        
        if month in pattern["peak_months"]:
            return pattern["peak_factor"]
        elif month in pattern["low_months"]:
            return pattern["low_factor"]
        else:
            return 1.0
    
    def _calculate_regional_price_differential(self, hub: Dict[str, Any], predicted_price: float) -> Dict[str, float]:
        """Calculate price differential compared to other regions"""
        regional_averages = {
            "Southeast Asia": 645.0,
            "North Europe": 665.0,
            "East Asia": 655.0,
            "Middle East": 630.0,
            "Americas": 670.0
        }
        
        hub_region = hub["region"]
        differentials = {}
        
        for region, avg_price in regional_averages.items():
            if region != hub_region:
                diff = predicted_price - avg_price
                diff_percentage = (diff / avg_price) * 100
                differentials[region] = round(diff_percentage, 2)
        
        return differentials
    
    def _get_alternative_ports(self, current_port: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get alternative ports in the same region"""
        alternatives = []
        current_location = current_port["location"]
        
        for port in self.major_ports:
            if port["port_id"] != current_port["port_id"] and port["region"] == current_port["region"]:
                distance = geodesic(
                    (current_location["lat"], current_location["lng"]),
                    (port["location"]["lat"], port["location"]["lng"])
                ).kilometers
                
                if distance < 500:  # Within 500km
                    alternatives.append({
                        "port_name": port["name"],
                        "distance_km": round(distance, 1),
                        "estimated_diversion_cost": round(distance * 0.8 * 500, 0)  # Cost estimate
                    })
        
        return sorted(alternatives, key=lambda x: x["distance_km"])[:3]
    
    def _get_alternative_fuel_hubs(self, current_hub: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get alternative fuel hubs in nearby regions"""
        alternatives = []
        current_location = current_hub["location"]
        
        for hub in self.fuel_hubs:
            if hub["hub_id"] != current_hub["hub_id"]:
                distance = geodesic(
                    (current_location["lat"], current_location["lng"]),
                    (hub["location"]["lat"], hub["location"]["lng"])
                ).kilometers
                
                if distance < 2000:  # Within 2000km (reasonable bunkering diversion)
                    alternatives.append({
                        "hub_name": hub["name"],
                        "distance_km": round(distance, 1),
                        "estimated_price_differential": round(np.random.uniform(-25, 25), 2),
                        "detour_time_hours": round(distance / 20, 1)  # Assuming 20km/h average speed
                    })
        
        return sorted(alternatives, key=lambda x: x["distance_km"])[:3]
    
    async def _get_port_historical_data(self, port_id: str) -> List[Dict[str, Any]]:
        """Get historical port performance data"""
        # This would query the database for actual historical data
        # For now, return simulated data
        return [
            {"date": datetime.now() - timedelta(days=i), "congestion": np.random.uniform(0.3, 0.8)}
            for i in range(30)
        ]
    
    async def _get_fuel_historical_data(self, hub_id: str) -> List[Dict[str, Any]]:
        """Get historical fuel price data"""
        # This would query the database for actual historical data
        # For now, return simulated data
        return [
            {"date": datetime.now() - timedelta(days=i), "vlsfo_price": 650 + np.random.uniform(-50, 50)}
            for i in range(30)
        ]
    
    async def _analyze_current_port_factors(self, port: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze current factors affecting port performance"""
        return {
            "weather_impact": np.random.uniform(0.0, 0.3),
            "economic_activity": np.random.uniform(0.8, 1.2),
            "labor_stability": np.random.uniform(0.9, 1.0),
            "vessel_arrivals_24h": np.random.randint(15, 35),
            "berth_utilization": np.random.uniform(0.6, 0.9)
        }
    
    async def _analyze_current_fuel_factors(self, hub: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze current factors affecting fuel markets"""
        return {
            "current_vlsfo_price": 650 + np.random.uniform(-30, 30),
            "current_mgo_price": 720 + np.random.uniform(-40, 40),
            "supply_pressure": np.random.uniform(0.8, 1.2),
            "demand_pressure": np.random.uniform(0.9, 1.3),
            "geopolitical_risk": np.random.uniform(0.0, 0.5),
            "market_volatility": np.random.uniform(0.05, 0.25),
            "supply_level": np.random.choice(["tight", "normal", "surplus"]),
            "demand_level": np.random.choice(["low", "normal", "high"]),
            "bunkering_queue": np.random.uniform(1.0, 4.0),
            "fuel_quality": np.random.uniform(0.9, 1.0)
        }
    
    def _analyze_route_segments(self, route: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Analyze route into segments for performance prediction"""
        segments = []
        waypoints = route["waypoints"]
        
        for i, waypoint in enumerate(waypoints):
            segment = {
                "name": waypoint["name"],
                "location": waypoint["location"],
                "segment_index": i,
                "influence_radius": 100 if "port" in waypoint["name"].lower() else 50
            }
            
            # Add regional context
            if "Singapore" in waypoint["name"]:
                segment["region"] = "Southeast Asia"
                segment["country"] = "Singapore"
            elif "Rotterdam" in waypoint["name"]:
                segment["region"] = "North Europe"
                segment["country"] = "Netherlands"
            elif "Shanghai" in waypoint["name"]:
                segment["region"] = "East Asia"
                segment["country"] = "China"
            elif "Suez" in waypoint["name"]:
                segment["region"] = "Middle East"
                segment["country"] = "Egypt"
            else:
                segment["region"] = "Open Ocean"
                segment["country"] = "International Waters"
            
            segments.append(segment)
        
        return segments
    
    async def _predict_route_segment_performance(self, route: Dict[str, Any], 
                                               segment: Dict[str, Any], hours_ahead: int) -> Dict[str, Any]:
        """Predict performance for a specific route segment"""
        
        # Base performance factors
        weather_delay = np.random.uniform(0, 8)  # hours
        congestion_prob = np.random.uniform(0.1, 0.6)
        fuel_increase = np.random.uniform(0, 0.15)  # percentage
        
        # Segment-specific adjustments
        if "Canal" in segment["name"]:
            congestion_prob *= 1.5
            weather_delay *= 0.5  # Canals less affected by weather
        elif "Singapore" in segment["name"]:
            congestion_prob *= 1.2  # Busy transshipment hub
        elif segment["region"] == "Open Ocean":
            weather_delay *= 1.8  # More weather exposure
            congestion_prob *= 0.3  # Less congestion
        
        # Time-based uncertainty
        uncertainty_factor = 1 + (hours_ahead / 200) * 0.1
        weather_delay *= uncertainty_factor
        
        # Calculate cost impact
        cost_impact = (weather_delay * 15000) + (fuel_increase * 50000)  # Rough estimates
        
        # Generate reasoning
        reasoning = {
            "segment_analysis": f"Performance analysis for {segment['name']} segment",
            "key_factors": [],
            "weather_assessment": "",
            "congestion_likelihood": ""
        }
        
        if weather_delay > 4:
            reasoning["key_factors"].append("Significant weather-related delays expected")
            reasoning["weather_assessment"] = "Adverse weather conditions likely"
        
        if congestion_prob > 0.5:
            reasoning["key_factors"].append("High probability of congestion delays")
            reasoning["congestion_likelihood"] = "Congestion expected based on traffic patterns"
        
        return {
            "delay": round(weather_delay, 1),
            "fuel_increase": round(fuel_increase * 100, 1),
            "weather_impact": "high" if weather_delay > 6 else "medium" if weather_delay > 3 else "low",
            "congestion_prob": round(congestion_prob, 2),
            "speed_reduction": round(fuel_increase * 20, 1),  # Fuel increase correlates with speed reduction
            "alt_route": congestion_prob > 0.7,
            "cost_impact": int(cost_impact),
            "restrictions": [],
            "seasonal_factor": self._get_seasonal_route_factor(route, datetime.now().month),
            "confidence": max(0.7, 0.95 - (hours_ahead / 300)),
            "reasoning": reasoning
        }
    
    def _get_seasonal_route_factor(self, route: Dict[str, Any], month: int) -> str:
        """Get seasonal factor affecting route performance"""
        if "ASIA_EUROPE" in route["route_id"]:
            if month in [6, 7, 8, 9]:  # Monsoon season
                return "monsoon_impact"
            elif month in [12, 1, 2]:  # Winter storms
                return "winter_weather"
        elif "TRANS_PACIFIC" in route["route_id"]:
            if month in [10, 11, 12, 1, 2, 3]:  # Pacific storm season
                return "storm_season"
        elif "EUROPE_AMERICAS" in route["route_id"]:
            if month in [11, 12, 1, 2, 3]:  # North Atlantic storms
                return "atlantic_storms"
        
        return "normal_conditions"

# Usage example
async def main():
    # This would be called from the main AI processing system
    predictor = LocationAwarePredictor(db_manager=None)  # Would pass actual db_manager
    
    # Generate location-aware predictions
    congestion_predictions = await predictor.generate_port_congestion_predictions(72)
    fuel_predictions = await predictor.generate_fuel_index_predictions(168) 
    route_predictions = await predictor.generate_route_performance_predictions(336)
    
    print(f"Generated {len(congestion_predictions)} port congestion predictions")
    print(f"Generated {len(fuel_predictions)} fuel index predictions")
    print(f"Generated {len(route_predictions)} route performance predictions")

if __name__ == "__main__":
    asyncio.run(main())
