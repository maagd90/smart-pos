#!/usr/bin/env bash
set -euo pipefail

# End-to-end business smoke test for the Store Management Platform.
# Verifies the complete business flow through the API gateway:
# dev-login -> account -> store -> product -> inventory -> sale -> refund -> report

GATEWAY_URL="${GATEWAY_URL:-http://localhost:8080}"
MAX_RETRIES="${MAX_RETRIES:-60}"
RETRY_INTERVAL="${RETRY_INTERVAL:-5}"

PASS=0
FAIL=0
TOKEN=""
ACCOUNT_ID=""
STORE_ID=""
PRODUCT_ID=""
SALE_ID=""

log() { echo "[e2e-smoke] $*"; }
pass() { log "PASS: $1"; PASS=$((PASS + 1)); }
fail() { log "FAIL: $1"; FAIL=$((FAIL + 1)); }

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
  return 1
}

api_post() {
  local path="$1"
  local body="$2"
  curl -sf -X POST "${GATEWAY_URL}${path}" \
    -H "Content-Type: application/json" \
    -H "Authorization: ******" \
    -d "$body" 2>/dev/null
}

api_get() {
  local path="$1"
  curl -sf -X GET "${GATEWAY_URL}${path}" \
    -H "Authorization: ******" 2>/dev/null
}

log "=== Store Management Platform E2E Business Smoke Test ==="
log ""

# Wait for gateway to be ready
if ! wait_for_url "$GATEWAY_URL/actuator/health" "API Gateway"; then
  fail "API Gateway not available"
  log "FATAL: Cannot proceed without gateway."
  exit 1
fi
log "Gateway is ready."
log ""

# Step 1: Dev Login
log "--- Step 1: Dev Login ---"
LOGIN_RESPONSE=$(curl -sf -X POST "${GATEWAY_URL}/api/v1/auth/dev-login" \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@example.com"}' 2>/dev/null) || LOGIN_RESPONSE=""

if [ -z "$LOGIN_RESPONSE" ]; then
  fail "Dev login - no response"
  log "FATAL: Cannot proceed without authentication."
  log "Results: $PASS passed, $FAIL failed"
  exit 1
fi

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then
  pass "Dev login - received token"
else
  fail "Dev login - no token in response: $LOGIN_RESPONSE"
  log "FATAL: Cannot proceed without token."
  log "Results: $PASS passed, $FAIL failed"
  exit 1
fi

# Step 2: Create Account
log ""
log "--- Step 2: Create Account ---"
ACCOUNT_RESPONSE=$(api_post "/api/v1/accounts" '{"name":"Smoke Test Store","currency":"AED","locale":"en-AE"}')
ACCOUNT_ID=$(echo "$ACCOUNT_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$ACCOUNT_ID" ]; then
  pass "Create account - ID: $ACCOUNT_ID"
else
  fail "Create account - response: $ACCOUNT_RESPONSE"
  log "FATAL: Cannot proceed without account."
  log "Results: $PASS passed, $FAIL failed"
  exit 1
fi

# Step 3: Create Store
log ""
log "--- Step 3: Create Store ---"
STORE_RESPONSE=$(api_post "/api/v1/accounts/${ACCOUNT_ID}/stores" '{"name":"Main Branch","timezone":"Asia/Dubai"}')
STORE_ID=$(echo "$STORE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$STORE_ID" ]; then
  pass "Create store - ID: $STORE_ID"
else
  fail "Create store - response: $STORE_RESPONSE"
  log "FATAL: Cannot proceed without store."
  log "Results: $PASS passed, $FAIL failed"
  exit 1
fi

# Step 4: Create Product (cost 1500, markup 5% => selling price 1575)
log ""
log "--- Step 4: Create Product ---"
PRODUCT_RESPONSE=$(api_post "/api/v1/stores/${STORE_ID}/products" \
  '{"name":"Test Product","sku":"TST-001","category":"Test","costPrice":1500,"pricingMode":"markup","markupPercent":5,"currency":"AED"}')
PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
SELLING_PRICE=$(echo "$PRODUCT_RESPONSE" | grep -o '"sellingPrice":[0-9.]*' | cut -d':' -f2)

if [ -n "$PRODUCT_ID" ]; then
  pass "Create product - ID: $PRODUCT_ID"
else
  fail "Create product - response: $PRODUCT_RESPONSE"
  log "FATAL: Cannot proceed without product."
  log "Results: $PASS passed, $FAIL failed"
  exit 1
fi

# Verify selling price is 1575
if echo "$SELLING_PRICE" | grep -q "1575"; then
  pass "Selling price = $SELLING_PRICE (expected 1575)"
else
  fail "Selling price = $SELLING_PRICE (expected 1575)"
fi

# Step 5: Receive 10 units
log ""
log "--- Step 5: Receive Stock ---"
RECEIVE_RESPONSE=$(api_post "/api/v1/stores/${STORE_ID}/inventory/receive" \
  "{\"productId\":\"${PRODUCT_ID}\",\"quantity\":10}")

if echo "$RECEIVE_RESPONSE" | grep -q '"success":true'; then
  pass "Receive 10 units"
else
  fail "Receive stock - response: $RECEIVE_RESPONSE"
fi

# Step 6: Assert stock is 10
log ""
log "--- Step 6: Check Stock (expect 10) ---"
STOCK_RESPONSE=$(api_get "/api/v1/stores/${STORE_ID}/inventory/stock/${PRODUCT_ID}")
CURRENT_STOCK=$(echo "$STOCK_RESPONSE" | grep -o '"currentStock":[0-9]*' | cut -d':' -f2)

if [ "$CURRENT_STOCK" = "10" ]; then
  pass "Stock is 10"
else
  fail "Stock is $CURRENT_STOCK (expected 10)"
fi

# Step 7: Create sale for 2 units
log ""
log "--- Step 7: Create Sale (2 units) ---"
SALE_RESPONSE=$(api_post "/api/v1/stores/${STORE_ID}/sales" \
  "{\"items\":[{\"productId\":\"${PRODUCT_ID}\",\"productName\":\"Test Product\",\"quantity\":2,\"unitPrice\":1575}],\"currency\":\"AED\"}")
SALE_ID=$(echo "$SALE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$SALE_ID" ]; then
  pass "Create sale - ID: $SALE_ID"
else
  fail "Create sale - response: $SALE_RESPONSE"
fi

# Step 8: Assert stock is 8
log ""
log "--- Step 8: Check Stock after sale (expect 8) ---"
sleep 1
STOCK_RESPONSE=$(api_get "/api/v1/stores/${STORE_ID}/inventory/stock/${PRODUCT_ID}")
CURRENT_STOCK=$(echo "$STOCK_RESPONSE" | grep -o '"currentStock":[0-9]*' | cut -d':' -f2)

if [ "$CURRENT_STOCK" = "8" ]; then
  pass "Stock is 8 after sale"
else
  fail "Stock is $CURRENT_STOCK (expected 8)"
fi

# Step 9: Create refund for 1 resellable unit
log ""
log "--- Step 9: Create Refund (1 resellable unit) ---"
REFUND_RESPONSE=$(api_post "/api/v1/stores/${STORE_ID}/refunds" \
  "{\"saleId\":\"${SALE_ID}\",\"items\":[{\"productId\":\"${PRODUCT_ID}\",\"productName\":\"Test Product\",\"quantity\":1,\"unitPrice\":1575,\"resellable\":true}],\"currency\":\"AED\"}")

if echo "$REFUND_RESPONSE" | grep -q '"success":true'; then
  pass "Create refund"
else
  fail "Create refund - response: $REFUND_RESPONSE"
fi

# Step 10: Assert stock is 9
log ""
log "--- Step 10: Check Stock after refund (expect 9) ---"
sleep 1
STOCK_RESPONSE=$(api_get "/api/v1/stores/${STORE_ID}/inventory/stock/${PRODUCT_ID}")
CURRENT_STOCK=$(echo "$STOCK_RESPONSE" | grep -o '"currentStock":[0-9]*' | cut -d':' -f2)

if [ "$CURRENT_STOCK" = "9" ]; then
  pass "Stock is 9 after refund"
else
  fail "Stock is $CURRENT_STOCK (expected 9)"
fi

# Step 11: Daily Report
log ""
log "--- Step 11: Daily Report ---"
REPORT_RESPONSE=$(api_get "/api/v1/stores/${STORE_ID}/reports/daily")

if echo "$REPORT_RESPONSE" | grep -q '"success":true'; then
  pass "Daily report returned successfully"
else
  fail "Daily report - response: $REPORT_RESPONSE"
fi

if echo "$REPORT_RESPONSE" | grep -q '"revenue"'; then
  pass "Daily report contains revenue field"
else
  fail "Daily report missing revenue field"
fi

if echo "$REPORT_RESPONSE" | grep -q '"cogs"'; then
  pass "Daily report contains cogs field"
else
  fail "Daily report missing cogs field"
fi

if echo "$REPORT_RESPONSE" | grep -q '"grossProfit"'; then
  pass "Daily report contains grossProfit field"
else
  fail "Daily report missing grossProfit field"
fi

if echo "$REPORT_RESPONSE" | grep -q '"storeId"'; then
  pass "Daily report contains storeId field"
else
  fail "Daily report missing storeId field"
fi

# Summary
log ""
log "=== E2E Smoke Test Results ==="
log "PASSED: $PASS"
log "FAILED: $FAIL"
log ""

if [ $FAIL -gt 0 ]; then
  log "E2E SMOKE TEST FAILED"
  exit 1
fi

log "E2E SMOKE TEST PASSED"
exit 0
