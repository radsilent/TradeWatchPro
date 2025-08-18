#!/bin/bash

# TradeWatch App Startup Script
echo "🚢 Starting TradeWatch App..."

# Load nvm and use Node.js 20
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Check if Node.js 20 is installed, if not install it
if ! nvm list | grep -q "v20"; then
    echo "📦 Installing Node.js 20..."
    nvm install 20
fi

# Use Node.js 20
nvm use 20

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server
echo "🌐 Starting development server..."
echo "📍 App will be available at: http://localhost:5173"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

npm run dev
