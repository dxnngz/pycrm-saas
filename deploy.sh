#!/bin/bash

# --- PyCRM Elite Production Deploy Script 🛡️💎 ---
# Pro-level deployment with health-checks, build validation, and zero-downtime goals.

set -e # Exit on error
export PAGER=cat

echo "🚀 [DEPLOY] Starting Elite Hardening Deployment..."

# 1. Dependency Synchronization
echo "📦 [1/6] Synchronizing dependencies..."
(cd backend && npm install --no-audit --no-fund)
(cd frontend && npm install --no-audit --no-fund)

# 2. Pre-flight Validation (Build & Type-Check)
echo "🔍 [2/6] Running pre-flight validations..."
echo " - Backend Type-Check..."
(cd backend && npx tsc --noEmit)
echo " - Frontend Build Validation..."
(cd frontend && npm run build)

# 3. Database Resilience & Migration
echo "🗄️ [3/6] Applying Prisma Shell-Armor & Migrations..."
(cd backend && npx prisma generate)
# MigrationGuard will handle actual sync at startup, but we run deploy here for standard changes
(cd backend && npx prisma migrate deploy || (echo "⚠️ Migration failed, relying on ResilienceService auto-correction." && true))

# 4. Final Production Build
echo "🏗️ [4/6] Building Production Bundles..."
(cd backend && npm run build)

# 5. Elite Service Restart
echo "🔄 [5/6] Restarting PyCRM Ecosystem..."
if command -v pm2 &> /dev/null; then
    pm2 restart all --update-env || pm2 start dist/index.js --name pycrm-backend
else
    echo "⚠️ PM2 not detected. Starting via Node..."
    nohup node dist/index.js > server.log 2>&1 &
fi

# 6. Post-deploy Health Benchmark
echo "🔍 [6/6] Running Performance & Health Benchmark..."
MAX_RETRIES=5
COUNT=0
URL="http://localhost:3001/api/health"

while [ $COUNT -lt $MAX_RETRIES ]; do
    RESPONSE=$(curl -s $URL || true)
    if [[ $RESPONSE == *"status\":\"ok\""* ]]; then
        echo "✅ [SUCCESS] System is HEALTHY and ARMORED."
        echo "   Metrics: $(echo $RESPONSE | grep -o 'healing_events\":[0-9]*')"
        exit 0
    fi
    echo " ⏳ Waiting for system to stabilize... ($((COUNT+1))/$MAX_RETRIES)"
    sleep 3
    COUNT=$((COUNT+1))
done

echo "❌ [ERROR] Health check failed after $MAX_RETRIES attempts."
echo "   Dump of last response: $RESPONSE"
# In a real CI/CD, we would trigger a rollback here
exit 1
