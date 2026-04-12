#!/usr/bin/env bash
set -euo pipefail

TENANT_SLUG="${TENANT_SLUG:-}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_SUPERUSER="${DB_SUPERUSER:-postgres}"
NGINX_CONF_DIR="${NGINX_CONF_DIR:-/etc/nginx/sites-available}"
NGINX_ENABLED_DIR="${NGINX_ENABLED_DIR:-/etc/nginx/sites-enabled}"

if [ -z "$TENANT_SLUG" ]; then
    echo "ERROR: TENANT_SLUG is required"
    exit 1
fi

echo "Cleaning up resources for tenant: $TENANT_SLUG"

DB_NAME="smartpos_${TENANT_SLUG}"
DB_USER="tenant_${TENANT_SLUG}"

# Drop database
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -c "
    SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME';
" 2>/dev/null || true

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -c "DROP ROLE IF EXISTS $DB_USER;" 2>/dev/null || true

# Remove Nginx config
find "$NGINX_CONF_DIR" -name "*$TENANT_SLUG*" -delete 2>/dev/null || true
find "$NGINX_ENABLED_DIR" -name "*$TENANT_SLUG*" -delete 2>/dev/null || true
nginx -s reload 2>/dev/null || true

echo "Cleanup complete for tenant: $TENANT_SLUG"
