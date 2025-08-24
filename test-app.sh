#!/bin/bash

echo "🧪 Testing TradeWatch Pro Application..."
echo "========================================"

# Test Frontend
echo "🌐 Testing Frontend (localhost:5174)..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5174)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend is running successfully"
else
    echo "❌ Frontend not accessible (HTTP $FRONTEND_STATUS)"
fi

# Test Backend API
echo ""
echo "🔧 Testing Backend API (localhost:8001)..."

# Test Health
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/health)
if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed (HTTP $HEALTH_STATUS)"
fi

# Test Vessels API
echo ""
echo "🚢 Testing Vessels API..."
VESSEL_COUNT=$(curl -s http://localhost:8001/api/vessels?limit=10 | jq '.total' 2>/dev/null)
if [ "$VESSEL_COUNT" -gt 0 ] 2>/dev/null; then
    echo "✅ Vessels API working - $VESSEL_COUNT vessels available"
    echo "   Sample vessel data:"
    curl -s http://localhost:8001/api/vessels?limit=1 | jq '.vessels[0] | {name, mmsi, latitude, longitude, flag, status}' 2>/dev/null
else
    echo "❌ Vessels API not working"
fi

# Test Disruptions API
echo ""
echo "🚨 Testing Maritime Disruptions API..."
DISRUPTION_COUNT=$(curl -s http://localhost:8001/api/maritime-disruptions | jq '.disruptions | length' 2>/dev/null)
if [ "$DISRUPTION_COUNT" -gt 0 ] 2>/dev/null; then
    echo "✅ Disruptions API working - $DISRUPTION_COUNT disruptions available"
    echo "   Sample disruption:"
    curl -s http://localhost:8001/api/maritime-disruptions | jq '.disruptions[0] | {title, severity, region, confidence}' 2>/dev/null
else
    echo "❌ Disruptions API not working"
fi

# Test Tariffs API
echo ""
echo "📊 Testing Tariffs API..."
TARIFF_COUNT=$(curl -s http://localhost:8001/api/tariffs | jq '.tariffs | length' 2>/dev/null)
if [ "$TARIFF_COUNT" -gt 0 ] 2>/dev/null; then
    echo "✅ Tariffs API working - $TARIFF_COUNT tariffs available"
    echo "   Sample tariff:"
    curl -s http://localhost:8001/api/tariffs | jq '.tariffs[0] | {country, product_category, tariff_rate, source}' 2>/dev/null
else
    echo "❌ Tariffs API not working"
fi

# Test Ports API
echo ""
echo "🏭 Testing Ports API..."
PORT_COUNT=$(curl -s http://localhost:8001/api/ports | jq '. | length' 2>/dev/null)
if [ "$PORT_COUNT" -gt 0 ] 2>/dev/null; then
    echo "✅ Ports API working - $PORT_COUNT ports available"
    echo "   Sample port:"
    curl -s http://localhost:8001/api/ports | jq '.[0] | {name, country, annual_throughput}' 2>/dev/null
else
    echo "❌ Ports API not working"
fi

echo ""
echo "🎯 Application Summary:"
echo "======================"
echo "Frontend URL: http://localhost:5174"
echo "Backend API:  http://localhost:8001"
echo ""
echo "📱 Open http://localhost:5174 in your browser to use TradeWatch Pro!"
echo "🌊 Real-time maritime data with AIS tracking, tariffs, and disruptions"
