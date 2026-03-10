#!/bin/bash

# --- PyCRM Armor Verification (Chaos Script) 🛡️🔥🧪 ---
# This script simulates a production failure (schema drift) to verify ResilienceService.

set -e

# Load environment variables if they exist
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
elif [ -f backend/.env ]; then
  export $(grep -v '^#' backend/.env | xargs)
fi

# Ensure DATABASE_URL is available
if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL="postgresql://postgres:password@localhost:5433/pycrm?schema=public"
fi

echo "🧪 Starting PyCRM Armor Verification..."

# 1. Simulate Schema Drift (Delete version and deleted_at from tasks)
echo "💣 Simulating Schema Drift..."
npx prisma db execute --schema prisma/schema.prisma --stdin <<EOF
ALTER TABLE tasks DROP COLUMN IF EXISTS version;
ALTER TABLE tasks DROP COLUMN IF EXISTS deleted_at;
EOF

# 2. Trigger Healing (Force Restart)
echo "🔄 Triggering Self-Healing Armor (Starting Backend)..."
# Kill existing node processes to ensure a clean start
pkill -f "node dist/index.js" || true

# Run build to be sure
# cd backend && npm run build

# Start server in background
node dist/index.js > chaos.log 2>&1 &
SERVER_PID=$!

echo " ⏳ Waiting for Self-Healing cycle (15s)..."
sleep 15

# 3. Verify Healing via PSQL (Check if columns returned)
echo "🔍 Verifying Schema Restoration..."
# Remove query parameters for psql compatibility
CLEAN_DB_URL=$(echo $DATABASE_URL | sed 's/\?.*//')
COL_COUNT=$(psql "$CLEAN_DB_URL" -t -c "SELECT count(*) FROM information_schema.columns WHERE table_name='tasks' AND column_name IN ('version', 'deleted_at');" | xargs || echo "0")

echo "🛡️ Columns present after healing: $COL_COUNT (Expected: 2)"

if [ "$COL_COUNT" -eq "2" ]; then
    echo "✅ [VERIFIED] ResilienceService successfully restored the missing columns."
else
    echo "❌ [FAILED] Self-healing armor did not restore missing columns."
    # cat backend/chaos.log
    kill $SERVER_PID || true
    exit 1
fi

# 4. Health Check Metrics
RT_COUNT=$(curl -s http://localhost:3001/api/health | grep -o 'healing_events\":[0-9]*' | cut -d: -f2)
echo "📊 Healing Events Logged: $RT_COUNT"

echo "🎯 Armor Verification Complete. System is certified resilient."
kill $SERVER_PID || true
