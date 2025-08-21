"""
Disruption Detection Model
Multi-modal AI system for detecting global trade disruptions
"""

import os
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import structlog
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime, timedelta
import re
import json
from transformers import AutoTokenizer, TFAutoModel

logger = structlog.get_logger()

class DisruptionDetector:
    """
    Multi-modal neural network for detecting trade disruptions
    Combines news sentiment, vessel anomalies, and economic indicators
    """
    
    def __init__(self, model_path: str = "/app/models/disruption_detection"):
        self.model_path = model_path
        self.model = None
        self.tokenizer = None
        self.text_encoder = None
        self.is_loaded = False
        
        # Model configuration
        self.max_sequence_length = 512
        self.news_embedding_dim = 768
        self.vessel_feature_dim = 20
        self.economic_feature_dim = 15
        
        # Disruption categories
        self.disruption_categories = [
            'weather', 'geopolitical', 'labor', 'cyber', 'infrastructure',
            'regulatory', 'economic', 'piracy', 'environmental', 'pandemic'
        ]
        
        # Severity levels
        self.severity_levels = ['low', 'medium', 'high', 'critical', 'extreme']
        
        # News keywords for different disruption types
        self.disruption_keywords = {
            'weather': ['storm', 'hurricane', 'typhoon', 'cyclone', 'flood', 'drought', 'ice'],
            'geopolitical': ['war', 'conflict', 'sanction', 'embargo', 'tension', 'dispute'],
            'labor': ['strike', 'protest', 'walkout', 'union', 'labor dispute'],
            'cyber': ['cyber', 'hack', 'malware', 'breach', 'attack', 'ransomware'],
            'infrastructure': ['bridge', 'canal', 'port closure', 'facility', 'construction'],
            'regulatory': ['regulation', 'policy', 'law', 'restriction', 'compliance'],
            'economic': ['recession', 'inflation', 'currency', 'trade war', 'tariff'],
            'piracy': ['piracy', 'hijack', 'robbery', 'theft', 'security'],
            'environmental': ['oil spill', 'pollution', 'contamination', 'disaster'],
            'pandemic': ['pandemic', 'outbreak', 'quarantine', 'lockdown', 'health']
        }
    
    def build_model(self) -> keras.Model:
        """Build the multi-modal disruption detection model"""
        
        # News text input
        news_input = layers.Input(shape=(self.news_embedding_dim,), name='news_embeddings')
        
        # Vessel anomaly input
        vessel_input = layers.Input(shape=(self.vessel_feature_dim,), name='vessel_features')
        
        # Economic indicator input
        economic_input = layers.Input(shape=(self.economic_feature_dim,), name='economic_features')
        
        # News processing branch
        news_dense1 = layers.Dense(512, activation='relu', name='news_dense1')(news_input)
        news_dropout1 = layers.Dropout(0.3)(news_dense1)
        news_dense2 = layers.Dense(256, activation='relu', name='news_dense2')(news_dropout1)
        news_dropout2 = layers.Dropout(0.2)(news_dense2)
        news_output = layers.Dense(128, activation='relu', name='news_features')(news_dropout2)
        
        # Vessel anomaly processing branch
        vessel_dense1 = layers.Dense(128, activation='relu', name='vessel_dense1')(vessel_input)
        vessel_dropout1 = layers.Dropout(0.3)(vessel_dense1)
        vessel_dense2 = layers.Dense(64, activation='relu', name='vessel_dense2')(vessel_dropout1)
        vessel_output = layers.Dense(32, activation='relu', name='vessel_features_out')(vessel_dense2)
        
        # Economic indicator processing branch
        economic_dense1 = layers.Dense(64, activation='relu', name='econ_dense1')(economic_input)
        economic_dropout1 = layers.Dropout(0.2)(economic_dense1)
        economic_output = layers.Dense(32, activation='relu', name='econ_features')(economic_dropout1)
        
        # Attention mechanism for multi-modal fusion
        # Create attention weights for each modality
        attention_input = layers.Concatenate()([news_output, vessel_output, economic_output])
        attention_weights = layers.Dense(3, activation='softmax', name='modality_attention')(attention_input)
        
        # Apply attention weights
        news_weighted = layers.Multiply()([news_output, 
                                         layers.Lambda(lambda x: tf.expand_dims(x[:, 0], axis=1))(attention_weights)])
        vessel_weighted = layers.Multiply()([vessel_output,
                                           layers.Lambda(lambda x: tf.expand_dims(x[:, 1], axis=1))(attention_weights)])
        economic_weighted = layers.Multiply()([economic_output,
                                             layers.Lambda(lambda x: tf.expand_dims(x[:, 2], axis=1))(attention_weights)])
        
        # Fuse all modalities
        fused_features = layers.Concatenate()([news_weighted, vessel_weighted, economic_weighted])
        
        # Deep fusion layers
        fusion_dense1 = layers.Dense(256, activation='relu', name='fusion_dense1')(fused_features)
        fusion_dropout1 = layers.Dropout(0.4)(fusion_dense1)
        
        fusion_dense2 = layers.Dense(128, activation='relu', name='fusion_dense2')(fusion_dropout1)
        fusion_dropout2 = layers.Dropout(0.3)(fusion_dense2)
        
        fusion_dense3 = layers.Dense(64, activation='relu', name='fusion_dense3')(fusion_dropout2)
        
        # Output layers
        # Disruption probability
        disruption_prob = layers.Dense(1, activation='sigmoid', name='disruption_probability')(fusion_dense3)
        
        # Disruption category classification
        category_output = layers.Dense(
            len(self.disruption_categories),
            activation='softmax',
            name='disruption_category'
        )(fusion_dense3)
        
        # Severity level classification
        severity_output = layers.Dense(
            len(self.severity_levels),
            activation='softmax',
            name='severity_level'
        )(fusion_dense3)
        
        # Time to impact (hours)
        time_to_impact = layers.Dense(1, activation='relu', name='time_to_impact')(fusion_dense3)
        
        # Impact duration (hours)
        impact_duration = layers.Dense(1, activation='relu', name='impact_duration')(fusion_dense3)
        
        # Confidence score
        confidence_score = layers.Dense(1, activation='sigmoid', name='confidence_score')(fusion_dense3)
        
        # Affected regions (multi-label classification for major regions)
        regions = ['North America', 'Europe', 'Asia Pacific', 'Middle East', 'Africa', 'South America']
        affected_regions = layers.Dense(
            len(regions),
            activation='sigmoid',
            name='affected_regions'
        )(fusion_dense3)
        
        # Create model
        model = keras.Model(
            inputs=[news_input, vessel_input, economic_input],
            outputs=[
                disruption_prob, category_output, severity_output,
                time_to_impact, impact_duration, confidence_score, affected_regions
            ],
            name='disruption_detector'
        )
        
        # Compile model
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss={
                'disruption_probability': 'binary_crossentropy',
                'disruption_category': 'categorical_crossentropy',
                'severity_level': 'categorical_crossentropy',
                'time_to_impact': 'mse',
                'impact_duration': 'mse',
                'confidence_score': 'binary_crossentropy',
                'affected_regions': 'binary_crossentropy'
            },
            loss_weights={
                'disruption_probability': 1.0,
                'disruption_category': 0.8,
                'severity_level': 0.8,
                'time_to_impact': 0.3,
                'impact_duration': 0.3,
                'confidence_score': 0.4,
                'affected_regions': 0.6
            },
            metrics={
                'disruption_probability': ['accuracy', 'precision', 'recall'],
                'disruption_category': ['accuracy', 'top_k_categorical_accuracy'],
                'severity_level': ['accuracy'],
                'time_to_impact': ['mae'],
                'impact_duration': ['mae'],
                'confidence_score': ['accuracy'],
                'affected_regions': ['binary_accuracy']
            }
        )
        
        return model
    
    def preprocess_news_data(self, news_data: List[Dict[str, Any]]) -> np.ndarray:
        """Preprocess news articles and extract embeddings"""
        
        if not news_data:
            return np.zeros((1, self.news_embedding_dim))
        
        # Combine all news articles
        combined_text = ""
        total_sentiment_score = 0
        keyword_scores = {category: 0 for category in self.disruption_categories}
        
        for article in news_data:
            title = article.get('title', '')
            content = article.get('content', article.get('description', ''))
            text = f"{title} {content}".lower()
            
            combined_text += text + " "
            
            # Calculate keyword-based scores
            for category, keywords in self.disruption_keywords.items():
                for keyword in keywords:
                    keyword_scores[category] += text.count(keyword)
            
            # Basic sentiment scoring (would use proper NLP model in production)
            negative_words = ['crisis', 'disaster', 'emergency', 'danger', 'threat', 'risk']
            sentiment_score = sum(text.count(word) for word in negative_words)
            total_sentiment_score += sentiment_score
        
        # Normalize keyword scores
        max_keywords = max(keyword_scores.values()) if keyword_scores.values() else 1
        normalized_keywords = [score / max_keywords for score in keyword_scores.values()]
        
        # Create feature vector (simplified - would use transformer embeddings in production)
        features = np.array([
            total_sentiment_score / len(news_data),  # Average sentiment
            len(news_data),  # Number of articles
            len(combined_text) / len(news_data),  # Average article length
            *normalized_keywords  # Keyword scores for each category
        ])
        
        # Pad to embedding dimension
        if len(features) < self.news_embedding_dim:
            padding = np.zeros(self.news_embedding_dim - len(features))
            features = np.concatenate([features, padding])
        else:
            features = features[:self.news_embedding_dim]
        
        return features.reshape(1, -1)
    
    def preprocess_vessel_data(self, vessel_anomalies: List[Dict[str, Any]]) -> np.ndarray:
        """Preprocess vessel anomaly data"""
        
        if not vessel_anomalies:
            return np.zeros((1, self.vessel_feature_dim))
        
        # Extract vessel anomaly features
        features = []
        
        # Count different types of anomalies
        route_deviations = len([a for a in vessel_anomalies if a.get('type') == 'route_deviation'])
        speed_anomalies = len([a for a in vessel_anomalies if a.get('type') == 'speed_anomaly'])
        destination_changes = len([a for a in vessel_anomalies if a.get('type') == 'destination_change'])
        communication_losses = len([a for a in vessel_anomalies if a.get('type') == 'communication_loss'])
        
        # Calculate severity scores
        avg_severity = np.mean([a.get('severity', 0.5) for a in vessel_anomalies])
        max_severity = np.max([a.get('severity', 0.5) for a in vessel_anomalies])
        
        # Geographic clustering of anomalies
        latitudes = [a.get('latitude', 0) for a in vessel_anomalies if a.get('latitude')]
        longitudes = [a.get('longitude', 0) for a in vessel_anomalies if a.get('longitude')]
        
        geographic_spread = 0
        if latitudes and longitudes:
            geographic_spread = np.std(latitudes) + np.std(longitudes)
        
        # Time-based features
        timestamps = [a.get('timestamp') for a in vessel_anomalies if a.get('timestamp')]
        time_span_hours = 0
        if len(timestamps) > 1:
            timestamps = [pd.to_datetime(t) for t in timestamps]
            time_span_hours = (max(timestamps) - min(timestamps)).total_seconds() / 3600
        
        # Vessel type distribution
        vessel_types = [a.get('vessel_type', 'unknown') for a in vessel_anomalies]
        unique_vessel_types = len(set(vessel_types))
        
        features = [
            len(vessel_anomalies),  # Total anomalies
            route_deviations / len(vessel_anomalies) if vessel_anomalies else 0,
            speed_anomalies / len(vessel_anomalies) if vessel_anomalies else 0,
            destination_changes / len(vessel_anomalies) if vessel_anomalies else 0,
            communication_losses / len(vessel_anomalies) if vessel_anomalies else 0,
            avg_severity,
            max_severity,
            geographic_spread,
            time_span_hours / 24.0,  # Convert to days
            unique_vessel_types,
            # Additional derived features
            np.mean([a.get('confidence', 0.5) for a in vessel_anomalies]),
            len([a for a in vessel_anomalies if a.get('severity', 0) > 0.7]),  # High severity count
            len(set([a.get('vessel_id') for a in vessel_anomalies])),  # Unique vessels
            geographic_spread * len(vessel_anomalies),  # Impact area
            1.0 if any(a.get('type') == 'emergency' for a in vessel_anomalies) else 0.0,
            # Padding for remaining features
            0.0, 0.0, 0.0, 0.0, 0.0
        ]
        
        return np.array(features[:self.vessel_feature_dim]).reshape(1, -1)
    
    def preprocess_economic_data(self, economic_indicators: List[Dict[str, Any]]) -> np.ndarray:
        """Preprocess economic indicator data"""
        
        if not economic_indicators:
            return np.zeros((1, self.economic_feature_dim))
        
        # Extract economic features
        features = []
        
        # Market indicators
        market_volatility = np.mean([ind.get('volatility', 0.5) for ind in economic_indicators])
        commodity_price_change = np.mean([ind.get('price_change', 0) for ind in economic_indicators])
        currency_fluctuation = np.mean([ind.get('currency_change', 0) for ind in economic_indicators])
        
        # Trade indicators
        trade_volume_change = np.mean([ind.get('volume_change', 0) for ind in economic_indicators])
        freight_rate_change = np.mean([ind.get('freight_rate_change', 0) for ind in economic_indicators])
        
        # Sentiment indicators
        economic_sentiment = np.mean([ind.get('sentiment_score', 0.5) for ind in economic_indicators])
        policy_uncertainty = np.mean([ind.get('policy_uncertainty', 0.5) for ind in economic_indicators])
        
        # Regional indicators
        regions_affected = len(set([ind.get('region') for ind in economic_indicators if ind.get('region')]))
        
        features = [
            market_volatility,
            commodity_price_change,
            currency_fluctuation,
            trade_volume_change,
            freight_rate_change,
            economic_sentiment,
            policy_uncertainty,
            regions_affected / 6.0,  # Normalize by max regions
            len(economic_indicators),
            np.std([ind.get('volatility', 0.5) for ind in economic_indicators]),
            np.max([ind.get('volatility', 0.5) for ind in economic_indicators]),
            # Additional features
            abs(commodity_price_change),  # Absolute price change
            abs(currency_fluctuation),   # Absolute currency change
            1.0 if any(ind.get('alert_level', 'low') == 'high' for ind in economic_indicators) else 0.0,
            np.mean([ind.get('impact_score', 0.5) for ind in economic_indicators])
        ]
        
        return np.array(features[:self.economic_feature_dim]).reshape(1, -1)
    
    async def detect_disruptions(self, news_data: List[Dict[str, Any]],
                               vessel_anomalies: List[Dict[str, Any]],
                               economic_indicators: List[Dict[str, Any]],
                               region_filter: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Detect potential trade disruptions"""
        
        if not self.is_loaded:
            await self.load_model()
        
        try:
            # Preprocess inputs
            news_features = self.preprocess_news_data(news_data)
            vessel_features = self.preprocess_vessel_data(vessel_anomalies)
            economic_features = self.preprocess_economic_data(economic_indicators)
            
            # Make prediction
            predictions = self.model.predict([news_features, vessel_features, economic_features])
            
            (disruption_prob, category_pred, severity_pred, 
             time_to_impact_pred, duration_pred, confidence_pred, regions_pred) = predictions
            
            results = []
            
            # Extract predictions
            prob = float(disruption_prob[0][0])
            
            # Only return disruptions with significant probability
            if prob > 0.3:  # Threshold for detection
                # Get category with highest probability
                category_idx = np.argmax(category_pred[0])
                category = self.disruption_categories[category_idx]
                category_confidence = float(category_pred[0][category_idx])
                
                # Get severity level
                severity_idx = np.argmax(severity_pred[0])
                severity = self.severity_levels[severity_idx]
                severity_confidence = float(severity_pred[0][severity_idx])
                
                # Get affected regions
                regions = ['North America', 'Europe', 'Asia Pacific', 'Middle East', 'Africa', 'South America']
                affected_regions = []
                for i, region_prob in enumerate(regions_pred[0]):
                    if region_prob > 0.5:  # Threshold for region impact
                        affected_regions.append({
                            'region': regions[i],
                            'impact_probability': float(region_prob)
                        })
                
                # Apply region filter if specified
                if region_filter:
                    affected_regions = [r for r in affected_regions if r['region'] in region_filter]
                    if not affected_regions:
                        return []  # No disruptions in filtered regions
                
                # Generate disruption description
                description = self.generate_description(category, severity, news_data, vessel_anomalies)
                
                disruption = {
                    'disruption_id': f"ai_disruption_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                    'event_type': category,
                    'severity_level': severity,
                    'probability': prob,
                    'confidence_score': float(confidence_pred[0][0]),
                    'predicted_impact_hours': float(time_to_impact_pred[0][0]),
                    'predicted_duration_hours': float(duration_pred[0][0]),
                    'affected_regions': affected_regions,
                    'description': description,
                    'detection_timestamp': datetime.utcnow().isoformat(),
                    'data_sources': {
                        'news_articles': len(news_data),
                        'vessel_anomalies': len(vessel_anomalies),
                        'economic_indicators': len(economic_indicators)
                    },
                    'recommended_actions': self.generate_recommendations(category, severity),
                    'ai_generated': True
                }
                
                results.append(disruption)
                
                logger.info("Disruption detected",
                           disruption_id=disruption['disruption_id'],
                           category=category,
                           severity=severity,
                           probability=prob)
            
            return results
            
        except Exception as e:
            logger.error("Error in disruption detection", error=str(e))
            raise
    
    def generate_description(self, category: str, severity: str, 
                           news_data: List[Dict], vessel_anomalies: List[Dict]) -> str:
        """Generate human-readable disruption description"""
        
        # Start with basic template
        description = f"AI-detected {severity} {category} disruption based on "
        
        sources = []
        if news_data:
            sources.append(f"{len(news_data)} news articles")
        if vessel_anomalies:
            sources.append(f"{len(vessel_anomalies)} vessel anomalies")
        
        description += " and ".join(sources)
        
        # Add specific details based on category
        if category == 'weather' and news_data:
            weather_keywords = ['storm', 'hurricane', 'typhoon', 'flood']
            for article in news_data[:3]:  # Check first 3 articles
                title = article.get('title', '').lower()
                for keyword in weather_keywords:
                    if keyword in title:
                        description += f". Weather event detected: {keyword}"
                        break
        
        elif category == 'geopolitical' and news_data:
            geo_keywords = ['sanction', 'embargo', 'conflict', 'tension']
            for article in news_data[:3]:
                title = article.get('title', '').lower()
                for keyword in geo_keywords:
                    if keyword in title:
                        description += f". Geopolitical event: {keyword}"
                        break
        
        # Add vessel anomaly details
        if vessel_anomalies:
            anomaly_types = set([a.get('type') for a in vessel_anomalies])
            if anomaly_types:
                description += f". Vessel anomalies include: {', '.join(anomaly_types)}"
        
        return description
    
    def generate_recommendations(self, category: str, severity: str) -> List[str]:
        """Generate recommended actions based on disruption type and severity"""
        
        base_recommendations = [
            "Monitor affected trade routes closely",
            "Review contingency plans",
            "Assess supply chain vulnerabilities"
        ]
        
        if severity in ['high', 'critical', 'extreme']:
            base_recommendations.extend([
                "Consider alternative routing",
                "Increase inventory buffers",
                "Communicate with stakeholders"
            ])
        
        # Category-specific recommendations
        category_specific = {
            'weather': [
                "Monitor weather forecasts",
                "Prepare for port closures",
                "Review vessel positioning"
            ],
            'geopolitical': [
                "Monitor political developments",
                "Review trade compliance",
                "Assess sanction impacts"
            ],
            'cyber': [
                "Enhance cybersecurity measures",
                "Review system backups",
                "Monitor for additional threats"
            ],
            'labor': [
                "Monitor labor negotiations",
                "Identify alternative ports",
                "Assess impact on operations"
            ]
        }
        
        if category in category_specific:
            base_recommendations.extend(category_specific[category])
        
        return base_recommendations
    
    async def train(self, training_data: pd.DataFrame, validation_data: pd.DataFrame,
                   epochs: int = 50, batch_size: int = 16) -> Dict[str, Any]:
        """Train the disruption detection model"""
        
        logger.info("Starting disruption detection model training",
                   train_samples=len(training_data),
                   val_samples=len(validation_data))
        
        # Build model if not exists
        if self.model is None:
            self.model = self.build_model()
        
        # Prepare training data (would implement based on your data format)
        X_train = self.prepare_training_data(training_data)
        X_val = self.prepare_training_data(validation_data)
        
        # Callbacks
        callbacks = [
            keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=10,
                restore_best_weights=True
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=1e-7
            ),
            keras.callbacks.ModelCheckpoint(
                filepath=os.path.join(self.model_path, 'best_disruption_model.h5'),
                monitor='val_loss',
                save_best_only=True
            )
        ]
        
        # Train model
        history = self.model.fit(
            X_train['inputs'],
            X_train['outputs'],
            validation_data=(X_val['inputs'], X_val['outputs']),
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks,
            verbose=1
        )
        
        # Save model
        await self.save_model()
        
        # Return training metrics
        final_metrics = {
            'final_train_loss': float(history.history['loss'][-1]),
            'final_val_loss': float(history.history['val_loss'][-1]),
            'best_val_loss': float(min(history.history['val_loss'])),
            'epochs_trained': len(history.history['loss']),
            'training_time': datetime.utcnow().isoformat()
        }
        
        logger.info("Disruption detection model training completed", metrics=final_metrics)
        return final_metrics
    
    def prepare_training_data(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Prepare data for training"""
        # Mock implementation - would be based on your specific data format
        return {
            'inputs': [
                np.random.randn(len(data), self.news_embedding_dim),
                np.random.randn(len(data), self.vessel_feature_dim),
                np.random.randn(len(data), self.economic_feature_dim)
            ],
            'outputs': [
                np.random.randint(0, 2, (len(data), 1)),  # disruption_probability
                np.random.randn(len(data), len(self.disruption_categories)),  # category
                np.random.randn(len(data), len(self.severity_levels)),  # severity
                np.random.randn(len(data), 1),  # time_to_impact
                np.random.randn(len(data), 1),  # impact_duration
                np.random.randint(0, 2, (len(data), 1)),  # confidence_score
                np.random.randint(0, 2, (len(data), 6))   # affected_regions
            ]
        }
    
    async def load_model(self):
        """Load trained model"""
        try:
            model_file = os.path.join(self.model_path, 'disruption_detection_model.h5')
            if os.path.exists(model_file):
                self.model = keras.models.load_model(model_file)
                logger.info("Disruption detection model loaded", path=model_file)
            else:
                # Build new model if no saved model exists
                self.model = self.build_model()
                logger.info("Built new disruption detection model")
            
            self.is_loaded = True
            
        except Exception as e:
            logger.error("Error loading disruption detection model", error=str(e))
            raise
    
    async def save_model(self):
        """Save trained model"""
        try:
            os.makedirs(self.model_path, exist_ok=True)
            
            model_file = os.path.join(self.model_path, 'disruption_detection_model.h5')
            self.model.save(model_file)
            
            # Save metadata
            metadata = {
                'model_type': 'disruption_detector',
                'categories': self.disruption_categories,
                'severity_levels': self.severity_levels,
                'news_embedding_dim': self.news_embedding_dim,
                'vessel_feature_dim': self.vessel_feature_dim,
                'economic_feature_dim': self.economic_feature_dim,
                'saved_at': datetime.utcnow().isoformat()
            }
            
            metadata_file = os.path.join(self.model_path, 'metadata.json')
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info("Disruption detection model saved", path=model_file)
            
        except Exception as e:
            logger.error("Error saving disruption detection model", error=str(e))
            raise
