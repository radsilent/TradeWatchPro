#!/bin/bash

echo "🚀 Deploying TradeWatch Pro Frontend to Cloudflare Pages..."

# Build the frontend
echo "📦 Building frontend..."
npm run build

# Create a simple deployment using wrangler pages
echo "🌐 Deploying to Cloudflare Pages..."

# Try to deploy with automatic project creation
echo "Creating and deploying TradeWatch Pro frontend..."

# Use wrangler pages publish (alternative command)
npx wrangler pages publish dist --project-name=tradewatch-pro --compatibility-date=2023-12-01 || \
npx wrangler pages deploy dist --project-name=tradewatch-pro || \
echo "Manual deployment required - upload dist/ folder to Cloudflare Pages dashboard"

echo ""
echo "✅ Deployment Instructions:"
echo "1. Go to https://dash.cloudflare.com/"
echo "2. Click 'Pages' in the sidebar"
echo "3. Click 'Create application'"
echo "4. Choose 'Upload assets'"
echo "5. Upload the 'dist' folder contents"
echo "6. Set project name: 'tradewatch-pro'"
echo ""
echo "🔗 Your URLs will be:"
echo "Frontend: https://tradewatch-pro.pages.dev"
echo "Backend API: https://tradewatch-backend.collaromatt.workers.dev"
