-- TradeWatch PostgreSQL Database Initialization
-- Comprehensive schema for maritime AI processing system

-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schemas for organized data management
CREATE SCHEMA IF NOT EXISTS maritime;
CREATE SCHEMA IF NOT EXISTS ai_models;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS logs;

-- Set search path
SET search_path = maritime, ai_models, analytics, logs, public;

-- ================================
-- MARITIME DATA TABLES
-- ================================

-- Vessels table with real-time tracking
CREATE TABLE maritime.vessels (
    vessel_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    imo_number VARCHAR(10) UNIQUE,
    mmsi VARCHAR(15) UNIQUE,
    vessel_name VARCHAR(255) NOT NULL,
    vessel_type VARCHAR(100),
    flag_country VARCHAR(3),
    gross_tonnage INTEGER,
    deadweight_tonnage INTEGER,
    length_overall DECIMAL(8,2),
    beam DECIMAL(8,2),
    draft DECIMAL(6,2),
    year_built INTEGER,
    owner_company VARCHAR(255),
    operator_company VARCHAR(255),
    classification_society VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vessel positions with geospatial indexing
CREATE TABLE maritime.vessel_positions (
    position_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vessel_id UUID REFERENCES maritime.vessels(vessel_id) ON DELETE CASCADE,
    coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    speed_knots DECIMAL(5,2),
    heading_degrees INTEGER CHECK (heading_degrees >= 0 AND heading_degrees <= 360),
    course_over_ground INTEGER CHECK (course_over_ground >= 0 AND course_over_ground <= 360),
    rate_of_turn DECIMAL(6,2),
    navigation_status VARCHAR(50),
    timestamp TIMESTAMPTZ NOT NULL,
    data_source VARCHAR(50) DEFAULT 'AIS',
    accuracy_meters INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ports with comprehensive data
CREATE TABLE maritime.ports (
    port_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    port_code VARCHAR(10) UNIQUE NOT NULL,
    port_name VARCHAR(255) NOT NULL,
    country_code VARCHAR(3) NOT NULL,
    country_name VARCHAR(100) NOT NULL,
    coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    port_type VARCHAR(50),
    capacity_teu INTEGER,
    max_vessel_size VARCHAR(50),
    berth_count INTEGER,
    depth_meters DECIMAL(6,2),
    strategic_importance INTEGER CHECK (strategic_importance >= 1 AND strategic_importance <= 10),
    annual_throughput_teu BIGINT,
    timezone VARCHAR(50),
    port_authority VARCHAR(255),
    contact_info JSONB,
    facilities JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Port performance metrics
CREATE TABLE maritime.port_performance (
    performance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    port_id UUID REFERENCES maritime.ports(port_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    vessel_arrivals INTEGER DEFAULT 0,
    vessel_departures INTEGER DEFAULT 0,
    cargo_throughput_tons BIGINT DEFAULT 0,
    container_throughput_teu INTEGER DEFAULT 0,
    average_wait_time_hours DECIMAL(6,2),
    berth_occupancy_rate DECIMAL(5,2),
    congestion_level DECIMAL(3,2) CHECK (congestion_level >= 0 AND congestion_level <= 1),
    weather_conditions JSONB,
    operational_status VARCHAR(50) DEFAULT 'operational',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(port_id, date)
);

-- Trade disruptions with impact assessment
CREATE TABLE maritime.trade_disruptions (
    disruption_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    severity_level INTEGER CHECK (severity_level >= 1 AND severity_level <= 5),
    category VARCHAR(50),
    subcategory VARCHAR(100),
    affected_region GEOGRAPHY(POLYGON, 4326),
    affected_countries TEXT[],
    affected_ports UUID[],
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    predicted_end_date TIMESTAMPTZ,
    duration_hours INTEGER,
    status VARCHAR(50) DEFAULT 'active',
    probability DECIMAL(3,2) CHECK (probability >= 0 AND probability <= 1),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    economic_impact_usd BIGINT,
    cargo_impact_tons BIGINT,
    vessel_impact_count INTEGER,
    source_type VARCHAR(50),
    source_url TEXT,
    source_reliability DECIMAL(3,2),
    ai_generated BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(50) DEFAULT 'unverified',
    related_events UUID[],
    mitigation_strategies TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tariffs and trade policies
CREATE TABLE maritime.tariffs (
    tariff_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commodity_code VARCHAR(20) NOT NULL,
    commodity_description TEXT NOT NULL,
    imposing_country VARCHAR(3) NOT NULL,
    target_country VARCHAR(3) NOT NULL,
    tariff_rate DECIMAL(6,4) NOT NULL,
    tariff_type VARCHAR(50) NOT NULL,
    unit_of_measure VARCHAR(20),
    effective_date DATE NOT NULL,
    expiry_date DATE,
    trade_value_usd BIGINT,
    annual_volume_tons BIGINT,
    affected_ports UUID[],
    policy_background TEXT,
    wto_compliance_status VARCHAR(50),
    retaliation_measures TEXT[],
    economic_justification TEXT,
    political_context TEXT,
    industry_impact_assessment JSONB,
    source_document VARCHAR(500),
    last_updated_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trade routes with performance metrics
CREATE TABLE maritime.trade_routes (
    route_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_name VARCHAR(255) NOT NULL,
    origin_port_id UUID REFERENCES maritime.ports(port_id),
    destination_port_id UUID REFERENCES maritime.ports(port_id),
    route_geometry GEOGRAPHY(LINESTRING, 4326),
    distance_nautical_miles DECIMAL(10,2),
    typical_transit_time_hours INTEGER,
    route_type VARCHAR(50),
    traffic_density VARCHAR(20),
    risk_level INTEGER CHECK (risk_level >= 1 AND risk_level <= 5),
    seasonal_variations JSONB,
    alternative_routes UUID[],
    chokepoints TEXT[],
    average_fuel_consumption_tons DECIMAL(10,2),
    environmental_impact_score DECIMAL(3,2),
    economic_importance INTEGER CHECK (economic_importance >= 1 AND economic_importance <= 10),
    annual_cargo_volume_tons BIGINT,
    annual_vessel_transits INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vessel voyages tracking
CREATE TABLE maritime.vessel_voyages (
    voyage_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vessel_id UUID REFERENCES maritime.vessels(vessel_id) ON DELETE CASCADE,
    voyage_number VARCHAR(50),
    origin_port_id UUID REFERENCES maritime.ports(port_id),
    destination_port_id UUID REFERENCES maritime.ports(port_id),
    planned_route_id UUID REFERENCES maritime.trade_routes(route_id),
    actual_route GEOGRAPHY(LINESTRING, 4326),
    departure_time TIMESTAMPTZ,
    planned_arrival_time TIMESTAMPTZ,
    actual_arrival_time TIMESTAMPTZ,
    voyage_status VARCHAR(50) DEFAULT 'planned',
    cargo_type VARCHAR(100),
    cargo_weight_tons DECIMAL(12,2),
    cargo_value_usd BIGINT,
    fuel_consumption_tons DECIMAL(10,2),
    distance_traveled_nm DECIMAL(10,2),
    delays_hours INTEGER DEFAULT 0,
    delay_reasons TEXT[],
    weather_impact_score DECIMAL(3,2),
    route_efficiency_score DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- AI MODELS SCHEMA
-- ================================

-- AI model metadata and versioning
CREATE TABLE ai_models.model_registry (
    model_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    framework VARCHAR(50) DEFAULT 'tensorflow',
    model_path TEXT NOT NULL,
    training_data_version VARCHAR(20),
    hyperparameters JSONB,
    performance_metrics JSONB,
    training_start_time TIMESTAMPTZ,
    training_end_time TIMESTAMPTZ,
    training_duration_minutes INTEGER,
    validation_score DECIMAL(6,4),
    test_score DECIMAL(6,4),
    is_active BOOLEAN DEFAULT FALSE,
    deployment_status VARCHAR(50) DEFAULT 'trained',
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(model_name, model_version)
);

-- Model predictions storage
CREATE TABLE ai_models.predictions (
    prediction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID REFERENCES ai_models.model_registry(model_id) ON DELETE CASCADE,
    prediction_type VARCHAR(50) NOT NULL,
    input_features JSONB NOT NULL,
    output_prediction JSONB NOT NULL,
    confidence_score DECIMAL(5,4),
    uncertainty_bounds JSONB,
    prediction_horizon_hours INTEGER,
    vessel_id UUID,
    disruption_id UUID,
    prediction_timestamp TIMESTAMPTZ NOT NULL,
    actual_outcome JSONB,
    accuracy_score DECIMAL(5,4),
    validated_at TIMESTAMPTZ,
    feedback_score DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Model training sessions
CREATE TABLE ai_models.training_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(100) NOT NULL,
    training_type VARCHAR(50) DEFAULT 'full', -- full, incremental, transfer
    dataset_size INTEGER,
    training_parameters JSONB,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'running',
    loss_history JSONB,
    validation_history JSONB,
    final_metrics JSONB,
    resource_usage JSONB,
    error_log TEXT,
    created_by VARCHAR(100),
    notes TEXT
);

-- Feature engineering metadata
CREATE TABLE ai_models.feature_store (
    feature_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_name VARCHAR(100) NOT NULL,
    feature_type VARCHAR(50) NOT NULL,
    data_source VARCHAR(100),
    calculation_logic TEXT,
    update_frequency VARCHAR(50),
    last_updated TIMESTAMPTZ,
    quality_score DECIMAL(3,2),
    importance_score DECIMAL(3,2),
    correlation_matrix JSONB,
    distribution_stats JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(feature_name)
);

-- ================================
-- ANALYTICS SCHEMA
-- ================================

-- Performance metrics aggregation
CREATE TABLE analytics.performance_metrics (
    metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_category VARCHAR(50) NOT NULL,
    metric_value DECIMAL(15,6) NOT NULL,
    metric_unit VARCHAR(20),
    aggregation_period VARCHAR(20) NOT NULL, -- hourly, daily, weekly, monthly
    aggregation_timestamp TIMESTAMPTZ NOT NULL,
    dimensions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(metric_name, metric_category, aggregation_period, aggregation_timestamp)
);

-- Economic impact calculations
CREATE TABLE analytics.economic_impact (
    impact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    disruption_id UUID REFERENCES maritime.trade_disruptions(disruption_id),
    affected_region VARCHAR(100),
    impact_type VARCHAR(50) NOT NULL,
    direct_cost_usd BIGINT,
    indirect_cost_usd BIGINT,
    total_cost_usd BIGINT,
    affected_trade_volume_tons BIGINT,
    affected_vessel_count INTEGER,
    affected_port_count INTEGER,
    recovery_time_days INTEGER,
    calculation_methodology TEXT,
    confidence_level DECIMAL(3,2),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk assessments
CREATE TABLE analytics.risk_assessments (
    assessment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- vessel, port, route, region
    entity_id UUID NOT NULL,
    risk_category VARCHAR(50) NOT NULL,
    risk_level DECIMAL(3,2) CHECK (risk_level >= 0 AND risk_level <= 1),
    risk_factors JSONB,
    mitigation_strategies TEXT[],
    assessment_date DATE NOT NULL,
    valid_until DATE,
    confidence_score DECIMAL(3,2),
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- LOGGING SCHEMA
-- ================================

-- System event logs
CREATE TABLE logs.system_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    source_system VARCHAR(50),
    user_id VARCHAR(100),
    ip_address INET,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- API request logs
CREATE TABLE logs.api_requests (
    request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint VARCHAR(200) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    user_agent TEXT,
    ip_address INET,
    error_message TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Data quality logs
CREATE TABLE logs.data_quality (
    quality_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_source VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    quality_check VARCHAR(100) NOT NULL,
    check_result VARCHAR(20) NOT NULL,
    quality_score DECIMAL(5,4),
    issues_found INTEGER DEFAULT 0,
    records_processed INTEGER,
    error_details JSONB,
    check_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- Vessel positions spatial index
CREATE INDEX idx_vessel_positions_coordinates ON maritime.vessel_positions USING GIST (coordinates);
CREATE INDEX idx_vessel_positions_vessel_timestamp ON maritime.vessel_positions (vessel_id, timestamp DESC);
CREATE INDEX idx_vessel_positions_timestamp ON maritime.vessel_positions (timestamp DESC);

-- Ports spatial index
CREATE INDEX idx_ports_coordinates ON maritime.ports USING GIST (coordinates);
CREATE INDEX idx_ports_country ON maritime.ports (country_code);
CREATE INDEX idx_ports_strategic_importance ON maritime.ports (strategic_importance DESC);

-- Disruptions spatial and temporal indexes
CREATE INDEX idx_disruptions_region ON maritime.trade_disruptions USING GIST (affected_region);
CREATE INDEX idx_disruptions_dates ON maritime.trade_disruptions (start_date, end_date);
CREATE INDEX idx_disruptions_severity ON maritime.trade_disruptions (severity_level DESC);
CREATE INDEX idx_disruptions_status ON maritime.trade_disruptions (status);

-- Tariffs indexes
CREATE INDEX idx_tariffs_countries ON maritime.tariffs (imposing_country, target_country);
CREATE INDEX idx_tariffs_commodity ON maritime.tariffs (commodity_code);
CREATE INDEX idx_tariffs_effective_date ON maritime.tariffs (effective_date DESC);
CREATE INDEX idx_tariffs_rate ON maritime.tariffs (tariff_rate DESC);

-- Trade routes indexes
CREATE INDEX idx_routes_geometry ON maritime.trade_routes USING GIST (route_geometry);
CREATE INDEX idx_routes_ports ON maritime.trade_routes (origin_port_id, destination_port_id);
CREATE INDEX idx_routes_importance ON maritime.trade_routes (economic_importance DESC);

-- AI predictions indexes
CREATE INDEX idx_predictions_model_timestamp ON ai_models.predictions (model_id, prediction_timestamp DESC);
CREATE INDEX idx_predictions_type ON ai_models.predictions (prediction_type);
CREATE INDEX idx_predictions_vessel ON ai_models.predictions (vessel_id) WHERE vessel_id IS NOT NULL;
CREATE INDEX idx_predictions_confidence ON ai_models.predictions (confidence_score DESC);

-- Performance metrics indexes
CREATE INDEX idx_performance_metrics_category_time ON analytics.performance_metrics (metric_category, aggregation_timestamp DESC);
CREATE INDEX idx_performance_metrics_name_time ON analytics.performance_metrics (metric_name, aggregation_timestamp DESC);

-- System logs indexes
CREATE INDEX idx_system_events_timestamp ON logs.system_events (timestamp DESC);
CREATE INDEX idx_system_events_type_severity ON logs.system_events (event_type, severity);
CREATE INDEX idx_api_requests_timestamp ON logs.api_requests (timestamp DESC);
CREATE INDEX idx_api_requests_endpoint ON logs.api_requests (endpoint);

-- ================================
-- VIEWS FOR COMMON QUERIES
-- ================================

-- Real-time vessel positions view
CREATE VIEW maritime.current_vessel_positions AS
SELECT DISTINCT ON (vp.vessel_id)
    v.vessel_id,
    v.imo_number,
    v.vessel_name,
    v.vessel_type,
    vp.coordinates,
    vp.latitude,
    vp.longitude,
    vp.speed_knots,
    vp.heading_degrees,
    vp.navigation_status,
    vp.timestamp
FROM maritime.vessels v
JOIN maritime.vessel_positions vp ON v.vessel_id = vp.vessel_id
ORDER BY vp.vessel_id, vp.timestamp DESC;

-- Active disruptions view
CREATE VIEW maritime.active_disruptions AS
SELECT *
FROM maritime.trade_disruptions
WHERE status = 'active'
  AND (end_date IS NULL OR end_date > NOW())
ORDER BY severity_level DESC, start_date DESC;

-- Port performance summary view
CREATE VIEW maritime.port_performance_summary AS
SELECT
    p.port_id,
    p.port_name,
    p.country_name,
    p.coordinates,
    pp.date,
    pp.vessel_arrivals + pp.vessel_departures as total_vessel_movements,
    pp.cargo_throughput_tons,
    pp.congestion_level,
    pp.berth_occupancy_rate
FROM maritime.ports p
JOIN maritime.port_performance pp ON p.port_id = pp.port_id
WHERE pp.date >= CURRENT_DATE - INTERVAL '30 days';

-- Model performance view
CREATE VIEW ai_models.model_performance_summary AS
SELECT
    mr.model_name,
    mr.model_type,
    mr.model_version,
    mr.performance_metrics,
    COUNT(p.prediction_id) as total_predictions,
    AVG(p.confidence_score) as avg_confidence,
    AVG(p.accuracy_score) as avg_accuracy,
    mr.is_active,
    mr.created_at
FROM ai_models.model_registry mr
LEFT JOIN ai_models.predictions p ON mr.model_id = p.model_id
WHERE mr.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY mr.model_id, mr.model_name, mr.model_type, mr.model_version, 
         mr.performance_metrics, mr.is_active, mr.created_at;

-- ================================
-- FUNCTIONS AND TRIGGERS
-- ================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for timestamp updates
CREATE TRIGGER update_vessels_timestamp
    BEFORE UPDATE ON maritime.vessels
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_ports_timestamp
    BEFORE UPDATE ON maritime.ports
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_disruptions_timestamp
    BEFORE UPDATE ON maritime.trade_disruptions
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_tariffs_timestamp
    BEFORE UPDATE ON maritime.tariffs
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_routes_timestamp
    BEFORE UPDATE ON maritime.trade_routes
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_voyages_timestamp
    BEFORE UPDATE ON maritime.vessel_voyages
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance_nm(
    lat1 DECIMAL, lon1 DECIMAL, 
    lat2 DECIMAL, lon2 DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
    RETURN ST_Distance(
        ST_GeogFromText('POINT(' || lon1 || ' ' || lat1 || ')'),
        ST_GeogFromText('POINT(' || lon2 || ' ' || lat2 || ')')
    ) / 1852.0; -- Convert meters to nautical miles
END;
$$ LANGUAGE plpgsql;

-- ================================
-- INITIAL DATA GRANTS
-- ================================

-- Grant permissions to application user
GRANT USAGE ON SCHEMA maritime, ai_models, analytics, logs TO tradewatch_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA maritime, ai_models, analytics, logs TO tradewatch_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA maritime, ai_models, analytics, logs TO tradewatch_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA maritime, ai_models, analytics, logs TO tradewatch_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA maritime, ai_models, analytics, logs 
GRANT ALL ON TABLES TO tradewatch_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA maritime, ai_models, analytics, logs 
GRANT ALL ON SEQUENCES TO tradewatch_user;

-- ================================
-- MAINTENANCE PROCEDURES
-- ================================

-- Procedure to clean old logs
CREATE OR REPLACE FUNCTION cleanup_old_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM logs.system_events WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    DELETE FROM logs.api_requests WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    DELETE FROM logs.data_quality WHERE check_timestamp < NOW() - INTERVAL '1 day' * days_to_keep;
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Procedure to update performance statistics
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS VOID AS $$
BEGIN
    ANALYZE maritime.vessels;
    ANALYZE maritime.vessel_positions;
    ANALYZE maritime.ports;
    ANALYZE maritime.trade_disruptions;
    ANALYZE maritime.tariffs;
    ANALYZE ai_models.predictions;
    ANALYZE analytics.performance_metrics;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- COMPLETION MESSAGE
-- ================================

DO $$
BEGIN
    RAISE NOTICE 'TradeWatch PostgreSQL database initialization completed successfully!';
    RAISE NOTICE 'Created schemas: maritime, ai_models, analytics, logs';
    RAISE NOTICE 'Created % tables with comprehensive indexing', 
        (SELECT COUNT(*) FROM information_schema.tables 
         WHERE table_schema IN ('maritime', 'ai_models', 'analytics', 'logs'));
    RAISE NOTICE 'PostGIS extension enabled for geospatial operations';
    RAISE NOTICE 'Database ready for TensorFlow AI processing system';
END $$;
