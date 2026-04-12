#!/usr/bin/env bash
set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

echo "Running Smart POS health checks..."

# Check backend
BACKEND_STATUS=$(curl -sf "$BACKEND_URL/health" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','unknown'))" 2>/dev/null || echo "down")
if [ "$BACKEND_STATUS" = "ok" ]; then
    echo "✅ Backend: OK ($BACKEND_URL)"
else
    echo "❌ Backend: DOWN ($BACKEND_URL)"
fi

# Check frontend
FRONTEND_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")
if [ "$FRONTEND_STATUS" -ge 200 ] && [ "$FRONTEND_STATUS" -lt 400 ]; then
    echo "✅ Frontend: OK ($FRONTEND_URL)"
else
    echo "❌ Frontend: DOWN ($FRONTEND_URL) [HTTP $FRONTEND_STATUS]"
fi

# Check database
DB_STATUS=$(pg_isready -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" 2>/dev/null && echo "ok" || echo "down")
if [ "$DB_STATUS" = "ok" ]; then
    echo "✅ Database: OK"
else
    echo "❌ Database: DOWN"
fi
