#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ "${SMOKE_TEST_MODE:-}" == "mock" ]]; then
  echo "[notifications-smoke] Skipped (SMOKE_TEST_MODE=mock)"
  exit 0
fi

GATEWAY="${GATEWAY_URL:-http://localhost:8080}"

echo "[notifications-smoke] Verifying notification action GET is prefetch-safe (no mutation)..."

# This script validates route wiring; full E2E requires platform stack + seeded notification.
curl -sf "${GATEWAY}/actuator/health" >/dev/null
echo "[notifications-smoke] Gateway is up"

# Invalid token should return friendly HTML without 500
STATUS=$(curl -s -o /tmp/notif-action.html -w '%{http_code}' \
  "${GATEWAY}/api/v1/notifications/actions/invalid-token-value")
if [[ "$STATUS" != "200" ]]; then
  echo "[notifications-smoke] Expected 200 HTML for invalid token, got ${STATUS}"
  exit 1
fi
if ! grep -qi "expired\|invalid" /tmp/notif-action.html; then
  echo "[notifications-smoke] Expected friendly terminal HTML"
  exit 1
fi

echo "[notifications-smoke] Prefetch-safe action endpoint responds with terminal HTML"
echo "[notifications-smoke] PASS"
