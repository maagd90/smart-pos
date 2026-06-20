#!/usr/bin/env bash
set -euo pipefail

# Smoke test for the Store Management Platform.
# Verifies that all infrastructure and services are healthy and reachable
# through the API gateway.

GATEWAY_URL="${GATEWAY_URL:-http://localhost:8080}"
DISCOVERY_URL="${DISCOVERY_URL:-http://localhost:8761}"
MAX_RETRIES="${MAX_RETRIES:-60}"
RETRY_INTERVAL="${RETRY_INTERVAL:-5}"

SERVICES=(
  "identity-access"
  "tenant-admin"
  "billing-subscription"
  "catalog-pricing"
  "inventory"
  "sales"
  "refunds"
  "customers-privacy"
  "ai-deals"
  "notifications-approvals"
  "messaging-delivery"
  "reporting-finance"
)

PASS=0
FAIL=0

log() { echo "[smoke-test] $*"; }
pass() { log "PASS: $1"; PASS=$((PASS + 1)); }
fail() { log "FAIL: $1"; FAIL=$((FAIL + 1)); }

log_http_diagnostics() {
  local url="$1"
  local label="$2"
  local body_file http_code body

  body_file=$(mktemp)
  http_code=$(curl -sS -o "$body_file" -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  body=$(cat "$body_file" 2>/dev/null || true)
  rm -f "$body_file"

  log "${label} HTTP status: ${http_code}"
  if [ -n "$body" ]; then
    log "${label} response body: ${body}"
  else
    log "${label} response body: (empty)"
  fi
}

wait_for_url() {
  local url="$1"
  local label="$2"
  local retries=0

  log "Waiting for $label ($url)..."
  while [ $retries -lt $MAX_RETRIES ]; do
    if curl -sf "$url" > /dev/null 2>&1; then
      return 0
    fi
    retries=$((retries + 1))
    sleep "$RETRY_INTERVAL"
  done
  log_http_diagnostics "$url" "$label"
  return 1
}

check_health() {
  local url="$1"
  local label="$2"
  local body_file http_code response

  body_file=$(mktemp)
  http_code=$(curl -sS -o "$body_file" -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  response=$(cat "$body_file" 2>/dev/null || true)
  rm -f "$body_file"

  if [ "$http_code" != "200" ]; then
    fail "$label - HTTP $http_code"
    log "${label} response body: ${response:-"(empty)"}"
    return
  fi

  if echo "$response" | grep -qi '"status".*"UP"'; then
    pass "$label"
  elif echo "$response" | grep -qi '"UP"'; then
    pass "$label"
  else
    fail "$label - unexpected response: $response"
  fi
}

log "=== Store Management Platform Smoke Test ==="
log ""

# Wait for discovery service
if wait_for_url "$DISCOVERY_URL/actuator/health" "Discovery Service"; then
  check_health "$DISCOVERY_URL/actuator/health" "Discovery Service health"
else
  fail "Discovery Service - did not become healthy in time"
fi

# Wait for gateway
if wait_for_url "$GATEWAY_URL/actuator/health" "API Gateway"; then
  check_health "$GATEWAY_URL/actuator/health" "API Gateway health"
else
  fail "API Gateway - did not become healthy in time"
  log "FATAL: Gateway not available. Cannot test service routing."
  log ""
  log "Results: $PASS passed, $FAIL failed"
  exit 1
fi

# Check each service through the gateway health routes
log ""
log "Checking domain services through gateway..."

for svc in "${SERVICES[@]}"; do
  url="$GATEWAY_URL/api/v1/platform/health/$svc"
  if ! wait_for_url "$url" "$svc"; then
    fail "$svc - not reachable through gateway"
    continue
  fi
  check_health "$url" "$svc (via gateway)"
done

# Summary
log ""
log "=== Results ==="
log "PASSED: $PASS"
log "FAILED: $FAIL"
log ""

if [ $FAIL -gt 0 ]; then
  log "SMOKE TEST FAILED"
  exit 1
fi

log "SMOKE TEST PASSED"
exit 0
