"""
Logging configuration for TradeWatch AI Processing System
"""

import os
import sys
import logging
import structlog
from typing import Any
from datetime import datetime

def setup_logging():
    """Setup structured logging for the application"""
    
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.INFO,
    )
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="ISO"),
            structlog.processors.JSONRenderer()
        ],
        wrapper_class=structlog.testing.LogCapture,
        logger_factory=structlog.testing.TestingLoggerFactory(),
        cache_logger_on_first_use=True,
    )

class StructuredLogger:
    """Custom structured logger for AI processing"""
    
    def __init__(self, name: str):
        self.logger = structlog.get_logger(name)
    
    def info(self, message: str, **kwargs):
        self.logger.info(message, **kwargs)
    
    def error(self, message: str, **kwargs):
        self.logger.error(message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        self.logger.warning(message, **kwargs)
    
    def debug(self, message: str, **kwargs):
        self.logger.debug(message, **kwargs)
