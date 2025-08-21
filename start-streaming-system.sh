#!/bin/bash

# TradeWatch Real-Time Streaming System Startup Script
# This script starts the complete AI processing system with real-time data streaming

echo "🌊 Starting TradeWatch Real-Time Maritime Intelligence System"
echo "=============================================================="

# Set environment variables
export PYTHONPATH="${PYTHONPATH}:$(pwd)/ai-processing"
export ENVIRONMENT="development"
export LOG_LEVEL="INFO"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Check if Python dependencies are installed
if [ ! -d "ai-processing/.venv" ]; then
    echo "📦 Creating Python virtual environment..."
    cd ai-processing
    python3 -m venv .venv
    source .venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    cd ..
    echo "✅ Python environment set up"
else
    echo "✅ Python environment exists"
fi

# Function to start services in the background
start_service() {
    local service_name=$1
    local command=$2
    echo "🚀 Starting $service_name..."
    $command &
    local pid=$!
    echo "   PID: $pid"
    return $pid
}

# Start PostgreSQL with PostGIS
echo "🗄️  Starting PostgreSQL with PostGIS..."
docker-compose up -d postgres
sleep 5

# Start Redis
echo "📦 Starting Redis..."
docker-compose up -d redis
sleep 3

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
timeout=60
counter=0
while [ $counter -lt $timeout ]; do
    if docker-compose exec -T postgres pg_isready -U tradewatch_user -d tradewatch > /dev/null 2>&1; then
        echo "✅ Database is ready"
        break
    fi
    counter=$((counter + 1))
    sleep 1
done

if [ $counter -eq $timeout ]; then
    echo "❌ Database startup timeout"
    exit 1
fi

# Initialize database schema
echo "🏗️  Initializing database schema..."
docker-compose exec -T postgres psql -U tradewatch_user -d tradewatch -f /docker-entrypoint-initdb.d/init.sql > /dev/null 2>&1

# Start TensorFlow AI Processing System
echo "🧠 Starting TensorFlow AI Processing System..."
cd ai-processing
source .venv/bin/activate

# Start the main AI processing server
start_service "AI Processing Server" "python main.py"
AI_SERVER_PID=$!

# Wait a moment for the server to start
sleep 10

# Start Celery worker for background tasks
start_service "Celery Worker" "celery -A main worker --loglevel=info --concurrency=2"
CELERY_WORKER_PID=$!

# Start Celery beat for scheduled tasks
start_service "Celery Beat" "celery -A main beat --loglevel=info"
CELERY_BEAT_PID=$!

cd ..

# Start monitoring services
echo "📊 Starting monitoring services..."
docker-compose up -d prometheus grafana flower

# Start TensorFlow Serving (optional)
if [ "$1" = "--with-serving" ]; then
    echo "🎯 Starting TensorFlow Serving..."
    docker-compose up -d tensorflow_serving
fi

# Display status
echo ""
echo "🎉 TradeWatch Real-Time Streaming System Started!"
echo "=================================================="
echo ""
echo "📡 Real-Time Data Streams:"
echo "   • AIS Vessel Tracking"
echo "   • Maritime News Feed"
echo "   • Port Performance Data"
echo "   • Economic Indicators"
echo "   • Weather Alerts"
echo "   • Security Incidents"
echo ""
echo "🔗 Service URLs:"
echo "   • AI Processing API: http://localhost:8000"
echo "   • API Documentation: http://localhost:8000/docs"
echo "   • Celery Monitoring: http://localhost:5555"
echo "   • Prometheus: http://localhost:9090"
echo "   • Grafana: http://localhost:3001 (admin/admin)"
echo "   • React App: http://localhost:5178"
echo ""
echo "📊 Real-Time Endpoints:"
echo "   • Live Data: http://localhost:8000/streaming/live-data"
echo "   • Stream Stats: http://localhost:8000/streaming/statistics"
echo "   • Recent Vessels: http://localhost:8000/data/recent-vessels"
echo "   • Active Alerts: http://localhost:8000/data/active-alerts"
echo ""
echo "🤖 AI Processing:"
echo "   • Vessel Movement Prediction: ACTIVE"
echo "   • Disruption Detection: ACTIVE"
echo "   • Economic Impact Assessment: ACTIVE"
echo "   • Continuous Learning: ACTIVE"
echo ""

# Create a status check function
check_status() {
    echo "🔍 System Status Check:"
    echo "======================="
    
    # Check AI Processing Server
    if curl -s http://localhost:8000/health > /dev/null; then
        echo "✅ AI Processing Server: RUNNING"
    else
        echo "❌ AI Processing Server: DOWN"
    fi
    
    # Check database
    if docker-compose exec -T postgres pg_isready -U tradewatch_user -d tradewatch > /dev/null 2>&1; then
        echo "✅ PostgreSQL Database: RUNNING"
    else
        echo "❌ PostgreSQL Database: DOWN"
    fi
    
    # Check Redis
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis Cache: RUNNING"
    else
        echo "❌ Redis Cache: DOWN"
    fi
    
    # Check processes
    if kill -0 $AI_SERVER_PID 2>/dev/null; then
        echo "✅ AI Server Process: RUNNING (PID: $AI_SERVER_PID)"
    else
        echo "❌ AI Server Process: DOWN"
    fi
    
    if kill -0 $CELERY_WORKER_PID 2>/dev/null; then
        echo "✅ Celery Worker: RUNNING (PID: $CELERY_WORKER_PID)"
    else
        echo "❌ Celery Worker: DOWN"
    fi
    
    if kill -0 $CELERY_BEAT_PID 2>/dev/null; then
        echo "✅ Celery Beat: RUNNING (PID: $CELERY_BEAT_PID)"
    else
        echo "❌ Celery Beat: DOWN"
    fi
}

# Function to stop all services
stop_services() {
    echo ""
    echo "🛑 Stopping TradeWatch Streaming System..."
    echo "==========================================="
    
    # Stop Python processes
    echo "Stopping AI Processing Server..."
    kill $AI_SERVER_PID 2>/dev/null
    
    echo "Stopping Celery Worker..."
    kill $CELERY_WORKER_PID 2>/dev/null
    
    echo "Stopping Celery Beat..."
    kill $CELERY_BEAT_PID 2>/dev/null
    
    # Stop Docker services
    echo "Stopping Docker services..."
    docker-compose down
    
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap stop_services SIGINT SIGTERM

echo "💡 Commands:"
echo "   • Check status: ./start-streaming-system.sh status"
echo "   • Stop system: Ctrl+C or ./stop-streaming-system.sh"
echo "   • View logs: docker-compose logs -f [service_name]"
echo ""
echo "⏰ The system will continue running. Press Ctrl+C to stop all services."

# Handle command line arguments
if [ "$1" = "status" ]; then
    check_status
    exit 0
fi

if [ "$1" = "stop" ]; then
    stop_services
fi

# Keep the script running and monitor services
while true; do
    sleep 30
    
    # Basic health checks
    if ! kill -0 $AI_SERVER_PID 2>/dev/null; then
        echo "⚠️  AI Server process died, restarting..."
        cd ai-processing
        source .venv/bin/activate
        start_service "AI Processing Server" "python main.py"
        AI_SERVER_PID=$!
        cd ..
    fi
    
    if ! kill -0 $CELERY_WORKER_PID 2>/dev/null; then
        echo "⚠️  Celery Worker died, restarting..."
        cd ai-processing
        source .venv/bin/activate
        start_service "Celery Worker" "celery -A main worker --loglevel=info --concurrency=2"
        CELERY_WORKER_PID=$!
        cd ..
    fi
done
