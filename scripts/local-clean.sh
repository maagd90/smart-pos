#!/usr/bin/env bash
set -euo pipefail

# Stops all containers and removes volumes for a clean local restart.

log() { echo "[local-clean] $*"; }

log "Stopping containers..."
docker compose down --remove-orphans 2>/dev/null || true

log "Removing volumes..."
docker compose down -v 2>/dev/null || true

log "Removing dangling images (optional)..."
docker image prune -f 2>/dev/null || true

log "Clean complete. Run 'docker compose up --build -d' to start fresh."
