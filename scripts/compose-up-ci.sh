#!/usr/bin/env bash
set -uo pipefail

# Staged docker compose startup for CI runners with limited memory.
# Starts infrastructure first, waits for health, then brings up platform services.

COMPOSE="${COMPOSE:-docker compose}"
MAX_WAIT="${MAX_WAIT:-36}"
WAIT_INTERVAL="${WAIT_INTERVAL:-5}"

log() { echo "[compose-up-ci] $*"; }

wait_healthy() {
  local service="$1"
  local attempts=0
  local cid health_status status

  log "Waiting for ${service} to become healthy..."
  while [ "$attempts" -lt "$MAX_WAIT" ]; do
    cid=$(${COMPOSE} ps -q "$service" 2>/dev/null || true)
    if [ -n "$cid" ]; then
      status=$(docker inspect -f '{{.State.Status}}' "$cid" 2>/dev/null || echo "")
      if [ "$status" = "exited" ]; then
        log "${service} exited before becoming healthy"
        ${COMPOSE} logs --tail=80 "$service" || true
        return 1
      fi
      health_status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{end}}' "$cid" 2>/dev/null || echo "")
      if [ "$health_status" = "healthy" ]; then
        log "${service} is healthy"
        return 0
      fi
    fi
    attempts=$((attempts + 1))
    sleep "$WAIT_INTERVAL"
  done

  log "${service} did not become healthy in time (last=${health_status:-unknown})"
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
${COMPOSE} build || { dump_failed_services; exit 1; }

log "Starting base infrastructure (zookeeper, redis)..."
${COMPOSE} up -d zookeeper redis || { dump_failed_services; exit 1; }
sleep 15
wait_healthy redis || exit 1

log "Starting Kafka..."
${COMPOSE} up -d kafka || { dump_failed_services; exit 1; }
wait_healthy kafka || exit 1

log "Starting databases..."
${COMPOSE} up -d "${DB_SERVICES[@]}"
db_pids=()
for db in "${DB_SERVICES[@]}"; do
  wait_healthy "$db" &
  db_pids+=($!)
done
db_failed=0
for pid in "${db_pids[@]}"; do
  wait "$pid" || db_failed=1
done
if [ "$db_failed" -ne 0 ]; then
  dump_failed_services
  exit 1
fi

log "Starting discovery service..."
${COMPOSE} up -d discovery-service
sleep 20

log "Starting remaining platform services..."
if ! ${COMPOSE} up -d; then
  dump_failed_services
  log "Some services failed to start; smoke tests will diagnose remaining issues"
fi

log "Compose startup finished"
${COMPOSE} ps -a
