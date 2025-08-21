"""
Database Manager for TradeWatch AI Processing System
Handles PostgreSQL connections with PostGIS for geospatial data
"""

import os
import asyncio
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from contextlib import asynccontextmanager

import asyncpg
import pandas as pd
import numpy as np
from shapely.geometry import Point, Polygon, LineString
from shapely.wkt import loads as wkt_loads
import structlog

logger = structlog.get_logger()

class DatabaseManager:
    """Manages PostgreSQL database connections and operations"""
    
    def __init__(self, database_url: str, pool_size: int = 20):
        self.database_url = database_url
        self.pool_size = pool_size
        self.pool = None
        self._initialized = False
    
    async def initialize(self):
        """Initialize database connection pool"""
        try:
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=5,
                max_size=self.pool_size,
                command_timeout=60,
                server_settings={
                    'application_name': 'tradewatch_ai_processor',
                    'timezone': 'UTC'
                }
    

Continuing from where I left off:

            )
            
            # Test connection
            async with self.pool.acquire() as conn:
                await conn.execute('SELECT 1')
            
            self._initialized = True
            logger.info("Database connection pool initialized", pool_size=self.pool_size)
            
        except Exception as e:
            logger.error("Failed to initialize database", error=str(e))
            raise
    
    async def close(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")
    
    def is_connected(self) -> bool:
        """Check if database is connected"""
        return self._initialized and self.pool is not None and not self.pool._closed
    
    @asynccontextmanager
    async def get_connection(self):
        """Get database connection from pool"""
        if not self.is_connected():
            raise RuntimeError("Database not initialized")
        
        async with self.pool.acquire() as conn:
            yield conn
    
    # ================================
    # VESSEL DATA OPERATIONS
    # ================================
    
    async def insert_vessel_position(self, vessel_data: Dict[str, Any]) -> str:
        """Insert vessel position data"""
        async with self.get_connection() as conn:
            query = """
            INSERT INTO maritime.vessel_positions 
            (vessel_id, coordinates, latitude, longitude, speed_knots, 
             heading_degrees, timestamp, data_source)
            VALUES ($1, ST_Point($2, $3), $3, $2, $4, $5, $6, $7)
            RETURNING position_id
            """
            
            position_id = await conn.fetchval(
                query,
                vessel_data['vessel_id'],
                vessel_data['longitude'],
                vessel_data['latitude'],
                vessel_data.get('speed_knots'),
                vessel_data.get('heading_degrees'),
                vessel_data['timestamp'],
                vessel_data.get('data_source', 'AI_PROCESSOR')
            )
            
            return str(position_id)
    
    async def get_vessel_history(self, vessel_id: str, hours: int = 24) -> List[Dict[str, Any]]:
        """Get vessel position history"""
        async with self.get_connection() as conn:
            query = """
            SELECT 
                vessel_id, latitude, longitude, speed_knots, 
                heading_degrees, timestamp, data_source
            FROM maritime.vessel_positions
            WHERE vessel_id = $1 
              AND timestamp >= NOW() - INTERVAL '%d hours'
            ORDER BY timestamp DESC
            """ % hours
            
            rows = await conn.fetch(query, vessel_id)
            return [dict(row) for row in rows]
    
    async def get_vessels_in_region(self, bounds: Dict[str, float]) -> List[Dict[str, Any]]:
        """Get vessels in geographic region"""
        async with self.get_connection() as conn:
            query = """
            SELECT DISTINCT ON (v.vessel_id)
                v.vessel_id, v.vessel_name, v.vessel_type, v.imo_number,
                vp.latitude, vp.longitude, vp.speed_knots, 
                vp.heading_degrees, vp.timestamp
            FROM maritime.vessels v
            JOIN maritime.vessel_positions vp ON v.vessel_id = vp.vessel_id
            WHERE ST_Contains(
                ST_MakeEnvelope($1, $2, $3, $4, 4326),
                vp.coordinates
            )
            ORDER BY v.vessel_id, vp.timestamp DESC
            """
            
            rows = await conn.fetch(
                query,
                bounds['west'], bounds['south'],
                bounds['east'], bounds['north']
            )
            return [dict(row) for row in rows]
    
    # ================================
    # PORT DATA OPERATIONS
    # ================================
    
    async def get_ports_by_importance(self, limit: int = 200) -> List[Dict[str, Any]]:
        """Get ports ordered by strategic importance"""
        async with self.get_connection() as conn:
            query = """
            SELECT 
                port_id, port_code, port_name, country_name,
                latitude, longitude, strategic_importance,
                capacity_teu, annual_throughput_teu
            FROM maritime.ports
            ORDER BY strategic_importance DESC, annual_throughput_teu DESC
            LIMIT $1
            """
            
            rows = await conn.fetch(query, limit)
            return [dict(row) for row in rows]
    
    async def insert_port_performance(self, performance_data: Dict[str, Any]) -> str:
        """Insert port performance metrics"""
        async with self.get_connection() as conn:
            query = """
            INSERT INTO maritime.port_performance 
            (port_id, date, vessel_arrivals, vessel_departures,
             cargo_throughput_tons, congestion_level, berth_occupancy_rate)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (port_id, date) 
            DO UPDATE SET
                vessel_arrivals = EXCLUDED.vessel_arrivals,
                vessel_departures = EXCLUDED.vessel_departures,
                cargo_throughput_tons = EXCLUDED.cargo_throughput_tons,
                congestion_level = EXCLUDED.congestion_level,
                berth_occupancy_rate = EXCLUDED.berth_occupancy_rate
            RETURNING performance_id
            """
            
            performance_id = await conn.fetchval(
                query,
                performance_data['port_id'],
                performance_data['date'],
                performance_data.get('vessel_arrivals', 0),
                performance_data.get('vessel_departures', 0),
                performance_data.get('cargo_throughput_tons', 0),
                performance_data.get('congestion_level', 0.0),
                performance_data.get('berth_occupancy_rate', 0.0)
            )
            
            return str(performance_id)
    
    # ================================
    # DISRUPTION DATA OPERATIONS
    # ================================
    
    async def insert_disruption(self, disruption_data: Dict[str, Any]) -> str:
        """Insert trade disruption event"""
        async with self.get_connection() as conn:
            query = """
            INSERT INTO maritime.trade_disruptions 
            (event_type, title, description, severity_level, category,
             start_date, end_date, predicted_end_date, probability,
             confidence_score, economic_impact_usd, ai_generated,
             source_type, source_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING disruption_id
            """
            
            disruption_id = await conn.fetchval(
                query,
                disruption_data['event_type'],
                disruption_data['title'],
                disruption_data.get('description'),
                disruption_data['severity_level'],
                disruption_data.get('category'),
                disruption_data['start_date'],
                disruption_data.get('end_date'),
                disruption_data.get('predicted_end_date'),
                disruption_data.get('probability', 0.5),
                disruption_data.get('confidence_score', 0.5),
                disruption_data.get('economic_impact_usd'),
                disruption_data.get('ai_generated', True),
                disruption_data.get('source_type', 'AI_PREDICTION'),
                disruption_data.get('source_url')
            )
            
            return str(disruption_id)
    
    async def get_active_disruptions(self, severity_threshold: int = 1) -> List[Dict[str, Any]]:
        """Get active disruptions above severity threshold"""
        async with self.get_connection() as conn:
            query = """
            SELECT 
                disruption_id, event_type, title, description,
                severity_level, category, start_date, end_date,
                probability, confidence_score, economic_impact_usd,
                ai_generated, source_type, source_url
            FROM maritime.trade_disruptions
            WHERE status = 'active'
              AND severity_level >= $1
              AND (end_date IS NULL OR end_date > NOW())
            ORDER BY severity_level DESC, start_date DESC
            """
            
            rows = await conn.fetch(query, severity_threshold)
            return [dict(row) for row in rows]
    
    # ================================
    # TARIFF DATA OPERATIONS
    # ================================
    
    async def insert_tariff(self, tariff_data: Dict[str, Any]) -> str:
        """Insert tariff data"""
        async with self.get_connection() as conn:
            query = """
            INSERT INTO maritime.tariffs 
            (commodity_code, commodity_description, imposing_country,
             target_country, tariff_rate, tariff_type, effective_date,
             expiry_date, trade_value_usd)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (commodity_code, imposing_country, target_country, effective_date)
            DO UPDATE SET
                tariff_rate = EXCLUDED.tariff_rate,
                trade_value_usd = EXCLUDED.trade_value_usd
            RETURNING tariff_id
            """
            
            tariff_id = await conn.fetchval(
                query,
                tariff_data['commodity_code'],
                tariff_data['commodity_description'],
                tariff_data['imposing_country'],
                tariff_data['target_country'],
                tariff_data['tariff_rate'],
                tariff_data['tariff_type'],
                tariff_data['effective_date'],
                tariff_data.get('expiry_date'),
                tariff_data.get('trade_value_usd')
            )
            
            return str(tariff_id)
    
    async def get_tariffs_by_country(self, country_code: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get tariffs for specific country"""
        async with self.get_connection() as conn:
            query = """
            SELECT 
                tariff_id, commodity_code, commodity_description,
                imposing_country, target_country, tariff_rate,
                tariff_type, effective_date, trade_value_usd
            FROM maritime.tariffs
            WHERE imposing_country = $1 OR target_country = $1
            ORDER BY trade_value_usd DESC NULLS LAST, effective_date DESC
            LIMIT $2
            """
            
            rows = await conn.fetch(query, country_code, limit)
            return [dict(row) for row in rows]
    
    # ================================
    # AI MODEL OPERATIONS
    # ================================
    
    async def insert_model_metadata(self, model_data: Dict[str, Any]) -> str:
        """Insert AI model metadata"""
        async with self.get_connection() as conn:
            query = """
            INSERT INTO ai_models.model_registry 
            (model_name, model_type, model_version, framework,
             model_path, hyperparameters, performance_metrics,
             training_start_time, training_end_time, validation_score,
             test_score, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING model_id
            """
            
            model_id = await conn.fetchval(
                query,
                model_data['model_name'],
                model_data['model_type'],
                model_data['model_version'],
                model_data.get('framework', 'tensorflow'),
                model_data['model_path'],
                model_data.get('hyperparameters', {}),
                model_data.get('performance_metrics', {}),
                model_data.get('training_start_time'),
                model_data.get('training_end_time'),
                model_data.get('validation_score'),
                model_data.get('test_score'),
                model_data.get('created_by', 'ai_processor')
            )
            
            return str(model_id)
    
    async def insert_prediction(self, prediction_data: Dict[str, Any]) -> str:
        """Insert model prediction"""
        async with self.get_connection() as conn:
            query = """
            INSERT INTO ai_models.predictions 
            (model_id, prediction_type, input_features, output_prediction,
             confidence_score, prediction_horizon_hours, vessel_id,
             disruption_id, prediction_timestamp)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING prediction_id
            """
            
            prediction_id = await conn.fetchval(
                query,
                prediction_data['model_id'],
                prediction_data['prediction_type'],
                prediction_data['input_features'],
                prediction_data['output_prediction'],
                prediction_data.get('confidence_score'),
                prediction_data.get('prediction_horizon_hours'),
                prediction_data.get('vessel_id'),
                prediction_data.get('disruption_id'),
                prediction_data.get('prediction_timestamp', datetime.utcnow())
            )
            
            return str(prediction_id)
    
    async def get_model_performance(self, model_name: str, days: int = 30) -> Dict[str, Any]:
        """Get model performance metrics"""
        async with self.get_connection() as conn:
            query = """
            SELECT 
                COUNT(*) as total_predictions,
                AVG(confidence_score) as avg_confidence,
                AVG(accuracy_score) as avg_accuracy,
                MIN(prediction_timestamp) as first_prediction,
                MAX(prediction_timestamp) as last_prediction
            FROM ai_models.predictions p
            JOIN ai_models.model_registry mr ON p.model_id = mr.model_id
            WHERE mr.model_name = $1 
              AND p.prediction_timestamp >= NOW() - INTERVAL '%d days'
            """ % days
            
            row = await conn.fetchrow(query, model_name)
            return dict(row) if row else {}
    
    # ================================
    # ANALYTICS OPERATIONS
    # ================================
    
    async def insert_performance_metric(self, metric_data: Dict[str, Any]) -> str:
        """Insert performance metric"""
        async with self.get_connection() as conn:
            query = """
            INSERT INTO analytics.performance_metrics 
            (metric_name, metric_category, metric_value, metric_unit,
             aggregation_period, aggregation_timestamp, dimensions)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (metric_name, metric_category, aggregation_period, aggregation_timestamp)
            DO UPDATE SET metric_value = EXCLUDED.metric_value
            RETURNING metric_id
            """
            
            metric_id = await conn.fetchval(
                query,
                metric_data['metric_name'],
                metric_data['metric_category'],
                metric_data['metric_value'],
                metric_data.get('metric_unit'),
                metric_data['aggregation_period'],
                metric_data['aggregation_timestamp'],
                metric_data.get('dimensions', {})
            )
            
            return str(metric_id)
    
    async def get_metrics_summary(self, category: str, hours: int = 24) -> List[Dict[str, Any]]:
        """Get metrics summary for category"""
        async with self.get_connection() as conn:
            query = """
            SELECT 
                metric_name, 
                AVG(metric_value) as avg_value,
                MIN(metric_value) as min_value,
                MAX(metric_value) as max_value,
                COUNT(*) as data_points
            FROM analytics.performance_metrics
            WHERE metric_category = $1
              AND aggregation_timestamp >= NOW() - INTERVAL '%d hours'
            GROUP BY metric_name
            ORDER BY metric_name
            """ % hours
            
            rows = await conn.fetch(query, category)
            return [dict(row) for row in rows]
    
    # ================================
    # UTILITY OPERATIONS
    # ================================
    
    async def execute_query(self, query: str, *args) -> List[Dict[str, Any]]:
        """Execute raw SQL query"""
        async with self.get_connection() as conn:
            rows = await conn.fetch(query, *args)
            return [dict(row) for row in rows]
    
    async def execute_scalar(self, query: str, *args) -> Any:
        """Execute query and return single value"""
        async with self.get_connection() as conn:
            return await conn.fetchval(query, *args)
    
    async def bulk_insert(self, table: str, columns: List[str], data: List[List[Any]]) -> int:
        """Bulk insert data"""
        async with self.get_connection() as conn:
            query = f"""
            INSERT INTO {table} ({', '.join(columns)})
            SELECT * FROM unnest({', '.join(['$' + str(i+1) for i in range(len(columns))])})
            """
            
            # Transpose data for unnest
            transposed_data = list(map(list, zip(*data)))
            
            result = await conn.execute(query, *transposed_data)
            return int(result.split()[-1])  # Extract number of inserted rows
    
    async def cleanup_old_data(self, days_to_keep: int = 90) -> Dict[str, int]:
        """Clean up old data"""
        cleanup_results = {}
        
        async with self.get_connection() as conn:
            # Clean vessel positions older than specified days
            result = await conn.execute("""
                DELETE FROM maritime.vessel_positions 
                WHERE timestamp < NOW() - INTERVAL '%d days'
            """ % days_to_keep)
            cleanup_results['vessel_positions'] = int(result.split()[-1])
            
            # Clean old predictions
            result = await conn.execute("""
                DELETE FROM ai_models.predictions 
                WHERE prediction_timestamp < NOW() - INTERVAL '%d days'
            """ % days_to_keep)
            cleanup_results['predictions'] = int(result.split()[-1])
            
            # Clean old performance metrics
            result = await conn.execute("""
                DELETE FROM analytics.performance_metrics 
                WHERE aggregation_timestamp < NOW() - INTERVAL '%d days'
            """ % days_to_keep)
            cleanup_results['performance_metrics'] = int(result.split()[-1])
            
            # Clean system logs
            result = await conn.execute("""
                DELETE FROM logs.system_events 
                WHERE timestamp < NOW() - INTERVAL '%d days'
            """ % days_to_keep)
            cleanup_results['system_events'] = int(result.split()[-1])
            
        logger.info("Database cleanup completed", results=cleanup_results)
        return cleanup_results
    
    async def get_database_stats(self) -> Dict[str, Any]:
        """Get database statistics"""
        async with self.get_connection() as conn:
            stats = {}
            
            # Table sizes
            table_sizes = await conn.fetch("""
                SELECT 
                    schemaname, tablename,
                    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
                FROM pg_tables 
                WHERE schemaname IN ('maritime', 'ai_models', 'analytics', 'logs')
                ORDER BY size_bytes DESC
            """)
            stats['table_sizes'] = [dict(row) for row in table_sizes]
            
            # Row counts
            row_counts = await conn.fetch("""
                SELECT 
                    schemaname, tablename,
                    n_tup_ins as inserts,
                    n_tup_upd as updates,
                    n_tup_del as deletes,
                    n_live_tup as live_rows
                FROM pg_stat_user_tables 
                WHERE schemaname IN ('maritime', 'ai_models', 'analytics', 'logs')
                ORDER BY n_live_tup DESC
            """)
            stats['row_counts'] = [dict(row) for row in row_counts]
            
            # Database size
            db_size = await conn.fetchval("""
                SELECT pg_size_pretty(pg_database_size(current_database()))
            """)
            stats['database_size'] = db_size
            
            # Connection info
            connections = await conn.fetchval("""
                SELECT count(*) FROM pg_stat_activity 
                WHERE datname = current_database()
            """)
            stats['active_connections'] = connections
            
        return stats
