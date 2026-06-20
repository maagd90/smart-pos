#!/usr/bin/env bash
set -euo pipefail

# Staged docker compose startup for CI runners with limited memory.
# Starts infrastructure first, waits for health, then brings up platform services.

COMPOSE="${COMPOSE:-docker compose}"
MAX_WAIT="${MAX_WAIT:-60}"
WAIT_INTERVAL="${WAIT_INTERVAL:-5}"

log() { echo "[compose-up-ci] $*"; }

wait_healthy() {
  local service="$1"
  local attempts=0

  log "Waiting for ${service} to become healthy..."
  while [ "$attempts" -lt "$MAX_WAIT" ]; do
    if ${COMPOSE} ps "$service" 2>/dev/null | grep -q "(healthy)"; then
      log "${service} is healthy"
      return 0
    fi
    if ${COMPOSE} ps "$service" 2>/dev/null | grep -q "Exit"; then
      log "${service} exited before becoming healthy"
      ${COMPOSE} logs --tail=80 "$service" || true
      return 1
    fi
    attempts=$((attempts + 1))
    sleep "$WAIT_INTERVAL"
  done

  log "${service} did not become healthy in time"
  ${COMPOSE} ps -a "$service" || true
  ${COMPOSE} logs --tail=80 "$service" || true
  return 1
}

dump_failed_services() {
  log "=== docker compose ps ==="
  ${COMPOSE} ps -a || true
  while read -r cid; do
    [ -n "$cid" ] || continue
    name=$(docker inspect -f '{{.Name}}' "$cid" 2>/dev/null | sed 's|^/||')
    status=$(docker inspect -f '{{.State.Status}}' "$cid" 2>/dev/null)
    exit_code=$(docker inspect -f '{{.State.ExitCode}}' "$cid" 2>/dev/null)
    if [ "$status" = "exited" ] && [ "$exit_code" != "0" ]; then
      log "=== logs for ${name} (exit ${exit_code}) ==="
      docker logs --tail=100 "$cid" 2>/dev/null || true
    fi
  done < <(${COMPOSE} ps -aq 2>/dev/null || true)
}

DB_SERVICES=(
  identity-access-db tenant-admin-db billing-subscription-db catalog-pricing-db
  inventory-db sales-db refunds-db customers-privacy-db ai-deals-db
  notifications-approvals-db messaging-delivery-db reporting-finance-db
)

log "Building images..."
${COMPOSE} build

log "Starting base infrastructure (zookeeper, redis)..."
${COMPOSE} up -d zookeeper redis
wait_healthy zookeeper
wait_healthy redis

log "Starting Kafka..."
${COMPOSE} up -d kafka
wait_healthy kafka

log "Starting databases..."
${COMPOSE} up -d "${DB_SERVICES[@]}"
for db in "${DB_SERVICES[@]}"; do
  wait_healthy "$db"
done

log "Starting discovery service..."
${COMPOSE} up -d discovery-service
sleep 20

log "Starting remaining platform services..."
if ! ${COMPOSE} up -d; then
  dump_failed_services
  exit 1
fi

log "All services started"
${COMPOSE} ps -a
