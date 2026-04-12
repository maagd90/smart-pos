#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

usage() {
  cat <<EOF
Smart POS Setup Script

Usage: $0 <command> [options]

Commands:
  init                  Install dependencies and set up environment
  create-tenant         Create a new tenant interactively
  list-tenants          List all tenants via API
  health                Run health checks
  dev                   Start backend and frontend in dev mode

Options:
  --help                Show this help message

Environment Variables:
  API_URL               Backend API URL (default: http://localhost:3001)
  API_TOKEN             Bearer token for authenticated requests
EOF
}

cmd_init() {
  echo "🚀 Initializing Smart POS..."

  echo "📦 Installing backend dependencies..."
  cd "$BACKEND_DIR" && npm install

  echo "📦 Installing frontend dependencies..."
  cd "$FRONTEND_DIR" && npm install

  if [ ! -f "$BACKEND_DIR/.env" ]; then
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env" 2>/dev/null || \
    cat > "$BACKEND_DIR/.env" <<ENVEOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smartpos
JWT_SECRET=change-me-in-production
JWT_REFRESH_SECRET=change-me-refresh-in-production
PORT=3001
BASE_DOMAIN=smartpos.app
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@smartpos.app
ENVEOF
    echo "✅ Created $BACKEND_DIR/.env — please update with your values"
  fi

  echo "✅ Initialization complete!"
}

cmd_create_tenant() {
  local api_url="${API_URL:-http://localhost:3001}"
  local token="${API_TOKEN:-}"

  if [ -z "$token" ]; then
    echo "ERROR: API_TOKEN environment variable is required"
    exit 1
  fi

  read -rp "Tenant name: " name
  read -rp "Admin email: " admin_email
  read -rp "Admin name: " admin_name
  read -rp "Subscription plan (FREE/PRO/ENTERPRISE) [FREE]: " plan
  plan="${plan:-FREE}"

  echo ""
  echo "Creating tenant: $name..."

  curl -s -X POST "$api_url/api/admin/tenants" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$name\",
      \"adminEmail\": \"$admin_email\",
      \"adminName\": \"$admin_name\",
      \"subscriptionPlan\": \"$plan\"
    }" | python3 -m json.tool 2>/dev/null || echo "Response received"
}

cmd_list_tenants() {
  local api_url="${API_URL:-http://localhost:3001}"
  local token="${API_TOKEN:-}"

  if [ -z "$token" ]; then
    echo "ERROR: API_TOKEN environment variable is required"
    exit 1
  fi

  curl -s "$api_url/api/admin/tenants" \
    -H "Authorization: Bearer $token" | python3 -m json.tool 2>/dev/null || echo "Response received"
}

cmd_health() {
  bash "$SCRIPT_DIR/scripts/health-check.sh"
}

cmd_dev() {
  echo "Starting Smart POS in dev mode..."
  echo "Backend: http://localhost:3001"
  echo "Frontend: http://localhost:3000"

  cd "$BACKEND_DIR" && npm run dev &
  BACKEND_PID=$!

  cd "$FRONTEND_DIR" && npm start &
  FRONTEND_PID=$!

  echo "Backend PID: $BACKEND_PID | Frontend PID: $FRONTEND_PID"
  echo "Press Ctrl+C to stop both services"

  trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
  wait
}

COMMAND="${1:-}"
case "$COMMAND" in
  init)           cmd_init ;;
  create-tenant)  cmd_create_tenant ;;
  list-tenants)   cmd_list_tenants ;;
  health)         cmd_health ;;
  dev)            cmd_dev ;;
  --help|-h|help) usage ;;
  "")             usage; exit 1 ;;
  *)              echo "Unknown command: $COMMAND"; usage; exit 1 ;;
esac
