"""
Vessel Movement Prediction Model
Advanced TensorFlow model for predicting vessel movements and arrival times
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
import joblib

logger = structlog.get_logger()

class VesselMovementPredictor:
    """
    Advanced neural network model for predicting vessel movements
    Uses attention mechanisms and multi-modal inputs
    """
    
    def __init__(self, model_path: str = "/app/models/vessel_prediction"):
        self.model_path = model_path
        self.model = None
        self.scaler = None
        self.feature_names = None
        self.is_loaded = False
        
        # Model configuration
        self.sequence_length = 24  # 24 hours of historical data
        self.prediction_horizon = 48  # Predict up to 48 hours ahead
        self.feature_dim = 15  # Number of features per timestep
        
        # Feature engineering parameters
        self.feature_config = {
            'position_features': ['latitude', 'longitude', 'speed', 'heading'],
            'temporal_features': ['hour', 'day_of_week', 'month'],
            'environmental_features': ['wind_speed', 'wave_height', 'current_speed'],
            'route_features': ['distance_to_port', 'route_efficiency', 'traffic_density'],
            'vessel_features': ['vessel_type_encoded', 'gross_tonnage_scaled']
        }
    
    def build_model(self) -> keras.Model:
        """Build the vessel movement prediction model"""
        
        # Input layers
        sequence_input = layers.Input(
            shape=(self.sequence_length, self.feature_dim),
            name='sequence_input'
        )
        
        vessel_features = layers.Input(
            shape=(10,),  # Static vessel features
            name='vessel_features'
        )
        
        environmental_input = layers.Input(
            shape=(5,),  # Current environmental conditions
            name='environmental_input'
        )
        
        # Sequence processing with LSTM and attention
        lstm_out = layers.LSTM(
            128, 
            return_sequences=True,
            dropout=0.2,
            recurrent_dropout=0.2,
            name='vessel_lstm'
        )(sequence_input)
        
        # Multi-head attention mechanism
        attention_out = layers.MultiHeadAttention(
            num_heads=8,
            key_dim=64,
            dropout=0.1,
            name='temporal_attention'
        )(lstm_out, lstm_out)
        
        # Global average pooling
        sequence_features = layers.GlobalAveragePooling1D()(attention_out)
        
        # Process vessel features
        vessel_dense = layers.Dense(64, activation='relu')(vessel_features)
        vessel_dropout = layers.Dropout(0.3)(vessel_dense)
        
        # Process environmental features
        env_dense = layers.Dense(32, activation='relu')(environmental_input)
        env_dropout = layers.Dropout(0.2)(env_dense)
        
        # Combine all features
        combined = layers.Concatenate()([
            sequence_features, 
            vessel_dropout, 
            env_dropout
        ])
        
        # Deep prediction layers
        dense1 = layers.Dense(256, activation='relu')(combined)
        dropout1 = layers.Dropout(0.3)(dense1)
        
        dense2 = layers.Dense(128, activation='relu')(dropout1)
        dropout2 = layers.Dropout(0.2)(dense2)
        
        dense3 = layers.Dense(64, activation='relu')(dropout2)
        
        # Output layers for different predictions
        # Position prediction (lat, lon for each hour in prediction horizon)
        position_output = layers.Dense(
            self.prediction_horizon * 2,
            activation='linear',
            name='position_prediction'
        )(dense3)
        
        # Arrival time prediction (hours to destination)
        arrival_output = layers.Dense(
            1, 
            activation='relu',
            name='arrival_time'
        )(dense3)
        
        # Confidence/uncertainty estimation
        confidence_output = layers.Dense(
            1,
            activation='sigmoid',
            name='confidence_score'
        )(dense3)
        
        # Risk factors (probability of delays, weather impact, etc.)
        risk_output = layers.Dense(
            5,
            activation='sigmoid',
            name='risk_factors'
        )(dense3)
        
        # Create model
        model = keras.Model(
            inputs=[sequence_input, vessel_features, environmental_input],
            outputs=[position_output, arrival_output, confidence_output, risk_output],
            name='vessel_movement_predictor'
        )
        
        # Compile with custom loss functions
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss={
                'position_prediction': self.position_loss,
                'arrival_time': 'mse',
                'confidence_score': 'binary_crossentropy',
                'risk_factors': 'binary_crossentropy'
            },
            loss_weights={
                'position_prediction': 1.0,
                'arrival_time': 0.5,
                'confidence_score': 0.3,
                'risk_factors': 0.2
            },
            metrics={
                'position_prediction': ['mae'],
                'arrival_time': ['mae', 'mse'],
                'confidence_score': ['accuracy'],
                'risk_factors': ['binary_accuracy']
            }
        )
        
        return model
    
    @staticmethod
    def position_loss(y_true, y_pred):
        """Custom loss function for position prediction"""
        # Reshape to (batch_size, timesteps, 2)
        y_true_reshaped = tf.reshape(y_true, (-1, 48, 2))
        y_pred_reshaped = tf.reshape(y_pred, (-1, 48, 2))
        
        # Calculate haversine distance loss
        lat1, lon1 = y_true_reshaped[:, :, 0], y_true_reshaped[:, :, 1]
        lat2, lon2 = y_pred_reshaped[:, :, 0], y_pred_reshaped[:, :, 1]
        
        # Convert to radians
        lat1_r = tf.convert_to_tensor(lat1 * np.pi / 180.0)
        lon1_r = tf.convert_to_tensor(lon1 * np.pi / 180.0)
        lat2_r = tf.convert_to_tensor(lat2 * np.pi / 180.0)
        lon2_r = tf.convert_to_tensor(lon2 * np.pi / 180.0)
        
        # Haversine formula
        dlat = lat2_r - lat1_r
        dlon = lon2_r - lon1_r
        
        a = tf.sin(dlat/2)**2 + tf.cos(lat1_r) * tf.cos(lat2_r) * tf.sin(dlon/2)**2
        c = 2 * tf.asin(tf.sqrt(a))
        
        # Earth radius in nautical miles
        R = 3440.065
        distance = R * c
        
        return tf.reduce_mean(distance)
    
    def preprocess_data(self, vessel_data: List[Dict[str, Any]]) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Preprocess vessel data for prediction"""
        
        # Convert to DataFrame for easier processing
        df = pd.DataFrame(vessel_data)
        
        # Sort by timestamp
        df = df.sort_values('timestamp')
        
        # Feature engineering
        df['hour'] = pd.to_datetime(df['timestamp']).dt.hour
        df['day_of_week'] = pd.to_datetime(df['timestamp']).dt.dayofweek
        df['month'] = pd.to_datetime(df['timestamp']).dt.month
        
        # Calculate derived features
        df['speed_change'] = df['speed'].diff()
        df['heading_change'] = df['heading'].diff()
        
        # Normalize coordinates relative to start position
        df['lat_relative'] = df['latitude'] - df['latitude'].iloc[0]
        df['lon_relative'] = df['longitude'] - df['longitude'].iloc[0]
        
        # Environmental features (mock for now - would come from weather APIs)
        df['wind_speed'] = np.random.normal(10, 5, len(df))
        df['wave_height'] = np.random.normal(2, 1, len(df))
        df['current_speed'] = np.random.normal(1, 0.5, len(df))
        
        # Route features (calculated based on destination)
        df['distance_to_port'] = np.sqrt(
            (df['latitude'] - df['latitude'].iloc[-1])**2 + 
            (df['longitude'] - df['longitude'].iloc[-1])**2
        )
        df['route_efficiency'] = 1.0 / (1.0 + df['distance_to_port'])
        df['traffic_density'] = np.random.normal(0.5, 0.2, len(df))
        
        # Vessel features
        vessel_type_mapping = {
            'cargo': 1, 'tanker': 2, 'container': 3, 
            'passenger': 4, 'other': 5
        }
        df['vessel_type_encoded'] = df.get('vessel_type', 'other').map(
            lambda x: vessel_type_mapping.get(x, 5)
        )
        df['gross_tonnage_scaled'] = df.get('gross_tonnage', 50000) / 100000.0
        
        # Select features for sequence
        sequence_features = [
            'lat_relative', 'lon_relative', 'speed', 'heading',
            'hour', 'day_of_week', 'month',
            'wind_speed', 'wave_height', 'current_speed',
            'distance_to_port', 'route_efficiency', 'traffic_density',
            'speed_change', 'heading_change'
        ]
        
        # Create sequence data
        sequence_data = df[sequence_features].fillna(0).values
        
        # Pad or truncate to sequence_length
        if len(sequence_data) < self.sequence_length:
            # Pad with zeros
            padding = np.zeros((self.sequence_length - len(sequence_data), self.feature_dim))
            sequence_data = np.vstack([padding, sequence_data])
        else:
            # Take last sequence_length points
            sequence_data = sequence_data[-self.sequence_length:]
        
        # Vessel features (static)
        vessel_features = np.array([
            df['vessel_type_encoded'].iloc[-1],
            df['gross_tonnage_scaled'].iloc[-1],
            df['speed'].mean(),
            df['speed'].std(),
            len(df),  # Data points available
            df['distance_to_port'].iloc[0],  # Initial distance
            df['route_efficiency'].mean(),
            df['heading_change'].abs().mean(),
            df['speed_change'].abs().mean(),
            1.0  # Placeholder for vessel reliability score
        ])
        
        # Environmental features (current conditions)
        environmental_features = np.array([
            df['wind_speed'].iloc[-1],
            df['wave_height'].iloc[-1],
            df['current_speed'].iloc[-1],
            df['traffic_density'].iloc[-1],
            df['hour'].iloc[-1] / 24.0  # Normalized hour
        ])
        
        return (
            sequence_data.reshape(1, self.sequence_length, self.feature_dim),
            vessel_features.reshape(1, -1),
            environmental_features.reshape(1, -1)
        )
    
    async def predict(self, vessel_data: List[Dict[str, Any]], 
                     prediction_horizon_hours: int = 24) -> Dict[str, Any]:
        """Make vessel movement prediction"""
        
        if not self.is_loaded:
            await self.load_model()
        
        try:
            # Preprocess input data
            sequence_data, vessel_features, env_features = self.preprocess_data(vessel_data)
            
            # Make prediction
            predictions = self.model.predict([sequence_data, vessel_features, env_features])
            
            position_pred, arrival_pred, confidence_pred, risk_pred = predictions
            
            # Process position predictions
            positions = position_pred[0].reshape(-1, 2)
            predicted_positions = []
            
            current_time = pd.to_datetime(vessel_data[-1]['timestamp'])
            for i in range(min(prediction_horizon_hours, len(positions))):
                predicted_time = current_time + timedelta(hours=i+1)
                predicted_positions.append({
                    'timestamp': predicted_time.isoformat(),
                    'latitude': float(positions[i][0]),
                    'longitude': float(positions[i][1])
                })
            
            # Process other predictions
            result = {
                'vessel_id': vessel_data[0].get('vessel_id'),
                'prediction_timestamp': datetime.utcnow().isoformat(),
                'predicted_positions': predicted_positions,
                'estimated_arrival_hours': float(arrival_pred[0][0]),
                'confidence_score': float(confidence_pred[0][0]),
                'risk_factors': {
                    'weather_delay_risk': float(risk_pred[0][0]),
                    'traffic_delay_risk': float(risk_pred[0][1]),
                    'mechanical_risk': float(risk_pred[0][2]),
                    'route_deviation_risk': float(risk_pred[0][3]),
                    'port_congestion_risk': float(risk_pred[0][4])
                },
                'prediction_horizon_hours': prediction_horizon_hours
            }
            
            logger.info("Vessel movement prediction completed",
                       vessel_id=result['vessel_id'],
                       confidence=result['confidence_score'])
            
            return result
            
        except Exception as e:
            logger.error("Error in vessel movement prediction", error=str(e))
            raise
    
    async def train(self, training_data: pd.DataFrame, validation_data: pd.DataFrame,
                   epochs: int = 100, batch_size: int = 32) -> Dict[str, Any]:
        """Train the vessel movement prediction model"""
        
        logger.info("Starting vessel movement model training",
                   train_samples=len(training_data),
                   val_samples=len(validation_data))
        
        # Build model if not exists
        if self.model is None:
            self.model = self.build_model()
        
        # Prepare training data
        X_train = self.prepare_training_data(training_data)
        X_val = self.prepare_training_data(validation_data)
        
        # Callbacks
        callbacks = [
            keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=15,
                restore_best_weights=True
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=7,
                min_lr=1e-7
            ),
            keras.callbacks.ModelCheckpoint(
                filepath=os.path.join(self.model_path, 'best_model.h5'),
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
        
        logger.info("Vessel movement model training completed", metrics=final_metrics)
        return final_metrics
    
    def prepare_training_data(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Prepare data for training"""
        # This would be implemented based on your specific data format
        # For now, return mock structure
        return {
            'inputs': [
                np.random.randn(len(data), self.sequence_length, self.feature_dim),
                np.random.randn(len(data), 10),
                np.random.randn(len(data), 5)
            ],
            'outputs': [
                np.random.randn(len(data), self.prediction_horizon * 2),
                np.random.randn(len(data), 1),
                np.random.randn(len(data), 1),
                np.random.randn(len(data), 5)
            ]
        }
    
    async def load_model(self):
        """Load trained model"""
        try:
            model_file = os.path.join(self.model_path, 'vessel_prediction_model.h5')
            if os.path.exists(model_file):
                self.model = keras.models.load_model(
                    model_file,
                    custom_objects={'position_loss': self.position_loss}
                )
                logger.info("Vessel prediction model loaded", path=model_file)
            else:
                # Build new model if no saved model exists
                self.model = self.build_model()
                logger.info("Built new vessel prediction model")
            
            self.is_loaded = True
            
        except Exception as e:
            logger.error("Error loading vessel prediction model", error=str(e))
            raise
    
    async def save_model(self):
        """Save trained model"""
        try:
            os.makedirs(self.model_path, exist_ok=True)
            
            model_file = os.path.join(self.model_path, 'vessel_prediction_model.h5')
            self.model.save(model_file)
            
            # Save additional metadata
            metadata = {
                'model_type': 'vessel_movement_predictor',
                'sequence_length': self.sequence_length,
                'prediction_horizon': self.prediction_horizon,
                'feature_dim': self.feature_dim,
                'saved_at': datetime.utcnow().isoformat()
            }
            
            metadata_file = os.path.join(self.model_path, 'metadata.json')
            import json
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info("Vessel prediction model saved", path=model_file)
            
        except Exception as e:
            logger.error("Error saving vessel prediction model", error=str(e))
            raise
