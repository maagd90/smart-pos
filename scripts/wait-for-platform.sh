#!/usr/bin/env bash
set -euo pipefail

# Waits until the platform is ready for smoke/e2e tests:
# 1. Discovery service healthy
# 2. API gateway healthy
# 3. All 12 domain services registered in Eureka
# 4. At least one gateway health route returns HTTP 200

GATEWAY_URL="${GATEWAY_URL:-http://localhost:8080}"
DISCOVERY_URL="${DISCOVERY_URL:-http://localhost:8761}"
MAX_RETRIES="${MAX_RETRIES:-60}"
RETRY_INTERVAL="${RETRY_INTERVAL:-5}"
SAMPLE_HEALTH_ROUTE="${SAMPLE_HEALTH_ROUTE:-identity-access}"
SMOKE_TEST_MODE="${SMOKE_TEST_MODE:-real}"

EUREKA_APPS=(
  "IDENTITY-ACCESS-SERVICE"
  "TENANT-ADMIN-SERVICE"
  "BILLING-SUBSCRIPTION-SERVICE"
  "CATALOG-PRICING-SERVICE"
  "INVENTORY-SERVICE"
  "SALES-SERVICE"
  "REFUNDS-SERVICE"
  "CUSTOMERS-PRIVACY-SERVICE"
  "AI-DEALS-SERVICE"
  "NOTIFICATIONS-APPROVALS-SERVICE"
  "MESSAGING-DELIVERY-SERVICE"
  "REPORTING-FINANCE-SERVICE"
)

log() { echo "[wait-for-platform] $*"; }

if [ "$SMOKE_TEST_MODE" = "mock" ]; then
  log "Milestone 1 stub: mock platform readiness enabled for smoke-test CI."
  log "Skipping live discovery, Eureka, and gateway readiness checks."
  exit 0
fi

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
      log "$label is ready"
      return 0
    fi
    retries=$((retries + 1))
    sleep "$RETRY_INTERVAL"
  done

  log "$label did not become ready in time"
  log_http_diagnostics "$url" "$label"
  return 1
}

wait_for_eureka_apps() {
  local retries=0
  local apps_xml missing=()

  log "Waiting for all domain services to register in Eureka..."
  while [ $retries -lt $MAX_RETRIES ]; do
    apps_xml=$(curl -sf "${DISCOVERY_URL}/eureka/apps" 2>/dev/null || true)
    if [ -n "$apps_xml" ]; then
      missing=()
      for app in "${EUREKA_APPS[@]}"; do
        if ! echo "$apps_xml" | grep -q "<name>${app}</name>"; then
          missing+=("$app")
        fi
      done
      if [ ${#missing[@]} -eq 0 ]; then
        log "All ${#EUREKA_APPS[@]} domain services are registered in Eureka"
        return 0
      fi
      if [ $((retries % 6)) -eq 0 ]; then
        log "Still waiting for Eureka registrations: ${missing[*]}"
      fi
    fi
    retries=$((retries + 1))
    sleep "$RETRY_INTERVAL"
  done

  log "Timed out waiting for Eureka registrations"
  if [ -n "$apps_xml" ]; then
    log "Missing registrations: ${missing[*]}"
  else
    log "Could not fetch ${DISCOVERY_URL}/eureka/apps"
  fi
  return 1
}

wait_for_gateway_health_route() {
  local route="$1"
  local url="${GATEWAY_URL}/api/v1/platform/health/${route}"
  local retries=0
  local body_file http_code body

  log "Waiting for gateway health route ($url)..."
  while [ $retries -lt $MAX_RETRIES ]; do
    body_file=$(mktemp)
    http_code=$(curl -sS -o "$body_file" -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    body=$(cat "$body_file" 2>/dev/null || true)
    rm -f "$body_file"

    if [ "$http_code" = "200" ] && echo "$body" | grep -qi '"UP"'; then
      log "Gateway health route for ${route} is ready"
      return 0
    fi

    retries=$((retries + 1))
    sleep "$RETRY_INTERVAL"
  done

  log "Gateway health route for ${route} did not become ready in time"
  log_http_diagnostics "$url" "Gateway health route (${route})"
  return 1
}

log "=== Waiting for platform readiness ==="

if ! wait_for_url "${DISCOVERY_URL}/actuator/health" "Discovery Service"; then
  exit 1
fi

if ! wait_for_url "${GATEWAY_URL}/actuator/health" "API Gateway"; then
  exit 1
fi

if ! wait_for_eureka_apps; then
  exit 1
fi

if ! wait_for_gateway_health_route "$SAMPLE_HEALTH_ROUTE"; then
  exit 1
fi

log "Platform is ready for smoke and e2e tests"
exit 0
