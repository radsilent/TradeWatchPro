#!/bin/bash

# TradeWatch Pro - Cloudflare Deployment Script
echo "🚀 Deploying TradeWatch Pro to Cloudflare..."

# Build the frontend
echo "📦 Building frontend..."
npm run build

# Deploy backend worker (already done)
echo "⚡ Backend Worker already deployed at: https://tradewatch-backend.collaromatt.workers.dev"

# Instructions for Cloudflare Pages deployment
echo ""
echo "🌐 To deploy frontend to Cloudflare Pages:"
echo "1. Go to https://dash.cloudflare.com/"
echo "2. Click 'Pages' in the sidebar"
echo "3. Click 'Create application'"
echo "4. Choose 'Upload assets'"
echo "5. Upload the 'dist' folder contents"
echo "6. Set project name: 'tradewatch-pro'"
echo ""
echo "✅ Your TradeWatch Pro system is ready!"
echo "Backend API: https://tradewatch-backend.collaromatt.workers.dev"
echo "Frontend will be: https://tradewatch-pro.pages.dev (after Pages deployment)"
echo ""
echo "🔗 Test the live API endpoints:"
echo "curl https://tradewatch-backend.collaromatt.workers.dev/api/health"
echo "curl https://tradewatch-backend.collaromatt.workers.dev/api/vessels?limit=5"
echo "curl https://tradewatch-backend.collaromatt.workers.dev/api/maritime-disruptions"
echo "curl https://tradewatch-backend.collaromatt.workers.dev/api/tariffs"
