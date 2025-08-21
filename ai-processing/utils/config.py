"""
Configuration management for TradeWatch AI Processing System
"""

import os
from typing import Optional
from pydantic import BaseSettings, Field

class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Database configuration
    database_url: str = Field(
        default="postgresql://tradewatch_user:tradewatch_password@postgres:5432/tradewatch",
        env="DATABASE_URL"
    )
    
    # Redis configuration
    redis_url: str = Field(
        default="redis://redis:6379/0",
        env="REDIS_URL"
    )
    
    # Environment
    environment: str = Field(default="development", env="ENVIRONMENT")
    debug: bool = Field(default=True, env="DEBUG")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # API configuration
    api_host: str = Field(default="0.0.0.0", env="API_HOST")
    api_port: int = Field(default=8000, env="API_PORT")
    api_workers: int = Field(default=1, env="API_WORKERS")
    
    # Model configuration
    model_path: str = Field(default="/app/models", env="MODEL_PATH")
    tensorboard_log_dir: str = Field(default="/app/logs/tensorboard", env="TENSORBOARD_LOG_DIR")
    
    # Training configuration
    batch_size: int = Field(default=32, env="BATCH_SIZE")
    learning_rate: float = Field(default=0.001, env="LEARNING_RATE")
    max_epochs: int = Field(default=100, env="MAX_EPOCHS")
    
    # Data processing configuration
    max_sequence_length: int = Field(default=24, env="MAX_SEQUENCE_LENGTH")
    prediction_horizon_hours: int = Field(default=48, env="PREDICTION_HORIZON_HOURS")
    
    # External API configuration
    news_api_key: Optional[str] = Field(default=None, env="NEWS_API_KEY")
    weather_api_key: Optional[str] = Field(default=None, env="WEATHER_API_KEY")
    
    # Security configuration
    secret_key: str = Field(default="your-secret-key-here", env="SECRET_KEY")
    access_token_expire_minutes: int = Field(default=1440, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # Monitoring configuration
    enable_metrics: bool = Field(default=True, env="ENABLE_METRICS")
    metrics_port: int = Field(default=9090, env="METRICS_PORT")
    
    # GPU configuration
    gpu_memory_limit: Optional[int] = Field(default=None, env="GPU_MEMORY_LIMIT")
    enable_mixed_precision: bool = Field(default=True, env="ENABLE_MIXED_PRECISION")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Global settings instance
_settings: Optional[Settings] = None

def get_settings() -> Settings:
    """Get application settings singleton"""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings

def configure_tensorflow():
    """Configure TensorFlow based on settings"""
    import tensorflow as tf
    
    settings = get_settings()
    
    # Configure GPU memory growth
    gpus = tf.config.experimental.list_physical_devices('GPU')
    if gpus:
        try:
            for gpu in gpus:
                tf.config.experimental.set_memory_growth(gpu, True)
                
                # Set memory limit if specified
                if settings.gpu_memory_limit:
                    tf.config.experimental.set_memory_limit(
                        gpu, settings.gpu_memory_limit
                    )
            
            print(f"Configured {len(gpus)} GPU(s)")
            
        except RuntimeError as e:
            print(f"GPU configuration error: {e}")
    else:
        print("No GPUs detected, using CPU")
    
    # Configure mixed precision if enabled
    if settings.enable_mixed_precision and gpus:
        policy = tf.keras.mixed_precision.Policy('mixed_float16')
        tf.keras.mixed_precision.set_global_policy(policy)
        print("Mixed precision enabled")
    
    # Set TensorFlow log level
    if settings.log_level == "DEBUG":
        tf.get_logger().setLevel('DEBUG')
    else:
        tf.get_logger().setLevel('ERROR')
        os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
