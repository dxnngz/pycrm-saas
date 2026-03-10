#!/bin/bash

# --- PyCRM Production Deploy Script (Senior Big Tech Standard) ---
# This script ensures a clean, synchronized, and optimized deployment.

set -e # Exit on error

echo "🚀 Starting Enterprise Deployment..."

# 1. Update dependencies
echo "📦 Installing dependencies..."
npm install
cd frontend && npm install && cd ..

# 2. Synchronize Database Schema
echo "🗄️ Running Prisma migrations..."
cd backend
npx prisma generate
npx prisma migrate deploy

# 3. Build Backend
echo "🏗️ Building Backend..."
npm run build

# 4. Build Frontend
echo "🏗️ Building Frontend..."
cd ../frontend
npm run build
cd ..

# 5. Restart Services (assuming PM2)
if command -v pm2 &> /dev/null
then
    echo "🔄 Restarting services with PM2..."
    pm2 restart all || pm2 start dist/src/index.js --name pycrm-backend
else
    echo "⚠️ PM2 not found. Please restart your process manager manually."
fi

# 6. Health Check
echo "🔍 Performing Health Check..."
sleep 5
HEALTH_CHECK=$(curl -s http://localhost:3001/api/health | grep '"status":"ok"')

if [ -z "$HEALTH_CHECK" ]; then
    echo "❌ Health check failed! Please check logs with 'pm2 logs'."
    exit 1
else
    echo "✅ Deployment successful. System is healthy."
fi
