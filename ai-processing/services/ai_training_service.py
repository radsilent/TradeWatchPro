"""
AI Training Service - TradeWatch AI Platform
Trains machine learning models on historical maritime data
to predict vessel delays, disruptions, and trade impacts.
"""

import asyncio
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Any
import asyncpg
import joblib
import os
import json
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, accuracy_score, classification_report
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AITrainingService:
    def __init__(self):
        self.db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/tradewatch')
        self.pool = None
        self.model_dir = "/home/vectorstream/Desktop/TradeWatchApp/ai-processing/models"
        os.makedirs(self.model_dir, exist_ok=True)
        
        # Initialize ML components
        self.scalers = {}
        self.encoders = {}
        self.models = {}
        
    async def initialize_database(self):
        """Initialize database connection"""
        try:
            self.pool = await asyncpg.create_pool(self.db_url, min_size=1, max_size=5)
            logger.info("AI Training Service database connection initialized")
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise

    async def get_training_data(self, table: str, days_back: int = 30) -> pd.DataFrame:
        """Retrieve training data from database"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        async with self.pool.acquire() as conn:
            query = f"""
                SELECT * FROM {table} 
                WHERE timestamp BETWEEN $1 AND $2 
                ORDER BY timestamp ASC
            """
            rows = await conn.fetch(query, start_date, end_date)
            
            if not rows:
                logger.warning(f"No data found in {table} for the last {days_back} days")
                return pd.DataFrame()
            
            df = pd.DataFrame([dict(row) for row in rows])
            logger.info(f"Retrieved {len(df)} records from {table}")
            return df

    def preprocess_vessel_data(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, Dict]:
        """Preprocess vessel data for training"""
        if df.empty:
            return np.array([]), np.array([]), {}
        
        # Feature engineering for vessel delay prediction
        df['hour'] = pd.to_datetime(df['timestamp']).dt.hour
        df['day_of_week'] = pd.to_datetime(df['timestamp']).dt.dayofweek
        df['speed_category'] = pd.cut(df['speed'], bins=[0, 5, 15, 25, 50], labels=['stopped', 'slow', 'normal', 'fast'])
        
        # Encode categorical variables
        categorical_cols = ['vessel_type', 'status', 'flag', 'speed_category']
        for col in categorical_cols:
            if col not in self.encoders:
                self.encoders[col] = LabelEncoder()
            
            if col in df.columns:
                df[f'{col}_encoded'] = self.encoders[col].fit_transform(df[col].astype(str))
        
        # Select features for training
        feature_cols = [
            'latitude', 'longitude', 'speed', 'course', 'hour', 'day_of_week',
            'crew_size', 'dwt', 'vessel_type_encoded', 'status_encoded', 
            'flag_encoded', 'speed_category_encoded'
        ]
        
        # Filter available columns
        available_cols = [col for col in feature_cols if col in df.columns]
        
        if not available_cols:
            logger.warning("No valid feature columns found in vessel data")
            return np.array([]), np.array([]), {}
        
        X = df[available_cols].fillna(0).values
        
        # Target: predict if vessel will be impacted (binary classification)
        y = df['impacted'].astype(int).values
        
        # Scale features
        if 'vessel_scaler' not in self.scalers:
            self.scalers['vessel_scaler'] = StandardScaler()
        
        X_scaled = self.scalers['vessel_scaler'].fit_transform(X)
        
        metadata = {
            'feature_columns': available_cols,
            'n_samples': len(X),
            'n_features': X.shape[1] if len(X.shape) > 1 else 0
        }
        
        return X_scaled, y, metadata

    def preprocess_disruption_data(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, Dict]:
        """Preprocess disruption data for training"""
        if df.empty:
            return np.array([]), np.array([]), {}
        
        # Feature engineering for disruption severity prediction
        df['hour'] = pd.to_datetime(df['timestamp']).dt.hour
        df['day_of_week'] = pd.to_datetime(df['timestamp']).dt.dayofweek
        df['month'] = pd.to_datetime(df['timestamp']).dt.month
        
        # Encode categorical variables
        categorical_cols = ['disruption_type', 'status']
        for col in categorical_cols:
            if col not in self.encoders:
                self.encoders[col] = LabelEncoder()
            
            if col in df.columns:
                df[f'{col}_encoded'] = self.encoders[col].fit_transform(df[col].astype(str))
        
        # Geographic clustering (simplified)
        df['region'] = 'unknown'
        df.loc[(df['latitude'] > 0) & (df['longitude'] > 0), 'region'] = 'northeast'
        df.loc[(df['latitude'] > 0) & (df['longitude'] < 0), 'region'] = 'northwest'
        df.loc[(df['latitude'] < 0) & (df['longitude'] > 0), 'region'] = 'southeast'
        df.loc[(df['latitude'] < 0) & (df['longitude'] < 0), 'region'] = 'southwest'
        
        if 'region' not in self.encoders:
            self.encoders['region'] = LabelEncoder()
        df['region_encoded'] = self.encoders['region'].fit_transform(df['region'])
        
        # Select features
        feature_cols = [
            'latitude', 'longitude', 'hour', 'day_of_week', 'month',
            'disruption_type_encoded', 'status_encoded', 'region_encoded'
        ]
        
        available_cols = [col for col in feature_cols if col in df.columns]
        
        if not available_cols:
            logger.warning("No valid feature columns found in disruption data")
            return np.array([]), np.array([]), {}
        
        X = df[available_cols].fillna(0).values
        
        # Target: predict severity level
        if 'severity' not in self.encoders:
            self.encoders['severity'] = LabelEncoder()
        y = self.encoders['severity'].fit_transform(df['severity'].astype(str))
        
        # Scale features
        if 'disruption_scaler' not in self.scalers:
            self.scalers['disruption_scaler'] = StandardScaler()
        
        X_scaled = self.scalers['disruption_scaler'].fit_transform(X)
        
        metadata = {
            'feature_columns': available_cols,
            'n_samples': len(X),
            'n_features': X.shape[1] if len(X.shape) > 1 else 0,
            'severity_classes': list(self.encoders['severity'].classes_)
        }
        
        return X_scaled, y, metadata

    def preprocess_tariff_data(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, Dict]:
        """Preprocess tariff data for training"""
        if df.empty:
            return np.array([]), np.array([]), {}
        
        # Feature engineering for tariff rate prediction
        df['hour'] = pd.to_datetime(df['timestamp']).dt.hour
        df['day_of_week'] = pd.to_datetime(df['timestamp']).dt.dayofweek
        df['month'] = pd.to_datetime(df['timestamp']).dt.month
        
        # Encode categorical variables
        categorical_cols = ['tariff_type', 'status', 'priority', 'importer', 'exporter', 'product_category']
        for col in categorical_cols:
            if col not in self.encoders:
                self.encoders[col] = LabelEncoder()
            
            if col in df.columns and df[col].notna().any():
                df[f'{col}_encoded'] = self.encoders[col].fit_transform(df[col].astype(str))
        
        # Select features
        feature_cols = [
            'hour', 'day_of_week', 'month', 'affected_companies',
            'tariff_type_encoded', 'status_encoded', 'priority_encoded',
            'importer_encoded', 'exporter_encoded', 'product_category_encoded'
        ]
        
        available_cols = [col for col in feature_cols if col in df.columns]
        
        if not available_cols:
            logger.warning("No valid feature columns found in tariff data")
            return np.array([]), np.array([]), {}
        
        X = df[available_cols].fillna(0).values
        
        # Target: predict tariff rate
        y = df['rate'].fillna(0).values
        
        # Scale features
        if 'tariff_scaler' not in self.scalers:
            self.scalers['tariff_scaler'] = StandardScaler()
        
        X_scaled = self.scalers['tariff_scaler'].fit_transform(X)
        
        metadata = {
            'feature_columns': available_cols,
            'n_samples': len(X),
            'n_features': X.shape[1] if len(X.shape) > 1 else 0
        }
        
        return X_scaled, y, metadata

    async def train_vessel_impact_model(self) -> Dict[str, Any]:
        """Train model to predict vessel impact probability"""
        logger.info("Training vessel impact prediction model...")
        
        # Get training data
        df = await self.get_training_data('vessels', days_back=30)
        if df.empty:
            logger.warning("No vessel data available for training")
            return {'status': 'failed', 'reason': 'no_data'}
        
        X, y, metadata = self.preprocess_vessel_data(df)
        
        if len(X) == 0:
            logger.warning("No valid features extracted from vessel data")
            return {'status': 'failed', 'reason': 'no_features'}
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train Random Forest model
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        # Save model
        model_path = os.path.join(self.model_dir, 'vessel_impact_model.joblib')
        joblib.dump({
            'model': model,
            'scaler': self.scalers.get('vessel_scaler'),
            'encoders': {k: v for k, v in self.encoders.items() if 'vessel' in k or k in ['vessel_type', 'status', 'flag', 'speed_category']},
            'metadata': metadata
        }, model_path)
        
        self.models['vessel_impact'] = model
        
        result = {
            'status': 'success',
            'model_type': 'vessel_impact',
            'accuracy': float(accuracy),
            'n_samples': len(X),
            'n_features': X.shape[1],
            'model_path': model_path
        }
        
        logger.info(f"Vessel impact model trained successfully. Accuracy: {accuracy:.3f}")
        return result

    async def train_disruption_severity_model(self) -> Dict[str, Any]:
        """Train model to predict disruption severity"""
        logger.info("Training disruption severity prediction model...")
        
        # Get training data
        df = await self.get_training_data('disruptions', days_back=30)
        if df.empty:
            logger.warning("No disruption data available for training")
            return {'status': 'failed', 'reason': 'no_data'}
        
        X, y, metadata = self.preprocess_disruption_data(df)
        
        if len(X) == 0:
            logger.warning("No valid features extracted from disruption data")
            return {'status': 'failed', 'reason': 'no_features'}
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train Random Forest model
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        # Save model
        model_path = os.path.join(self.model_dir, 'disruption_severity_model.joblib')
        joblib.dump({
            'model': model,
            'scaler': self.scalers.get('disruption_scaler'),
            'encoders': {k: v for k, v in self.encoders.items() if 'disruption' in k or k in ['disruption_type', 'status', 'region', 'severity']},
            'metadata': metadata
        }, model_path)
        
        self.models['disruption_severity'] = model
        
        result = {
            'status': 'success',
            'model_type': 'disruption_severity',
            'accuracy': float(accuracy),
            'n_samples': len(X),
            'n_features': X.shape[1],
            'model_path': model_path
        }
        
        logger.info(f"Disruption severity model trained successfully. Accuracy: {accuracy:.3f}")
        return result

    async def train_tariff_rate_model(self) -> Dict[str, Any]:
        """Train model to predict tariff rates"""
        logger.info("Training tariff rate prediction model...")
        
        # Get training data
        df = await self.get_training_data('tariffs', days_back=30)
        if df.empty:
            logger.warning("No tariff data available for training")
            return {'status': 'failed', 'reason': 'no_data'}
        
        X, y, metadata = self.preprocess_tariff_data(df)
        
        if len(X) == 0:
            logger.warning("No valid features extracted from tariff data")
            return {'status': 'failed', 'reason': 'no_features'}
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train Random Forest model
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        
        # Save model
        model_path = os.path.join(self.model_dir, 'tariff_rate_model.joblib')
        joblib.dump({
            'model': model,
            'scaler': self.scalers.get('tariff_scaler'),
            'encoders': {k: v for k, v in self.encoders.items() if 'tariff' in k or k in ['tariff_type', 'status', 'priority', 'importer', 'exporter', 'product_category']},
            'metadata': metadata
        }, model_path)
        
        self.models['tariff_rate'] = model
        
        result = {
            'status': 'success',
            'model_type': 'tariff_rate',
            'mae': float(mae),
            'n_samples': len(X),
            'n_features': X.shape[1],
            'model_path': model_path
        }
        
        logger.info(f"Tariff rate model trained successfully. MAE: {mae:.3f}")
        return result

    async def save_training_run_metadata(self, results: List[Dict[str, Any]]):
        """Save training run metadata to database"""
        async with self.pool.acquire() as conn:
            for result in results:
                if result['status'] == 'success':
                    await conn.execute("""
                        INSERT INTO ai_training_runs (
                            model_name, training_start, training_end, 
                            data_start_date, data_end_date, records_count,
                            model_accuracy, model_path, parameters, status
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    """, 
                    result['model_type'],
                    datetime.now(),
                    datetime.now(),
                    datetime.now() - timedelta(days=30),
                    datetime.now(),
                    result['n_samples'],
                    result.get('accuracy', result.get('mae', 0)),
                    result['model_path'],
                    json.dumps(result),
                    'completed'
                    )

    async def run_full_training_pipeline(self) -> List[Dict[str, Any]]:
        """Run complete AI training pipeline"""
        logger.info("Starting full AI training pipeline...")
        
        results = []
        
        try:
            # Train all models
            vessel_result = await self.train_vessel_impact_model()
            results.append(vessel_result)
            
            disruption_result = await self.train_disruption_severity_model()
            results.append(disruption_result)
            
            tariff_result = await self.train_tariff_rate_model()
            results.append(tariff_result)
            
            # Save metadata
            await self.save_training_run_metadata(results)
            
            logger.info("Full AI training pipeline completed successfully")
            
        except Exception as e:
            logger.error(f"Error in training pipeline: {e}")
            results.append({'status': 'failed', 'error': str(e)})
        
        return results

async def main():
    """Main entry point for AI training service"""
    training_service = AITrainingService()
    
    try:
        await training_service.initialize_database()
        logger.info("AI Training Service initialized successfully")
        
        # Run training pipeline
        results = await training_service.run_full_training_pipeline()
        
        # Print results
        for result in results:
            if result['status'] == 'success':
                logger.info(f"✅ {result['model_type']}: {result}")
            else:
                logger.error(f"❌ {result.get('model_type', 'Unknown')}: {result}")
        
    except Exception as e:
        logger.error(f"AI Training Service failed: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())
