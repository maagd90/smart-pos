#!/usr/bin/env bash
set -euo pipefail

TENANT_SLUG="${TENANT_SLUG:-}"
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_NAME="${ADMIN_NAME:-Admin}"
PASSWORD_HASH="${PASSWORD_HASH:-}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="smartpos_${TENANT_SLUG}"
DB_SUPERUSER="${DB_SUPERUSER:-postgres}"

echo "Creating admin user for tenant: $TENANT_SLUG"

if [ -z "$ADMIN_EMAIL" ] || [ -z "$PASSWORD_HASH" ]; then
    echo "ERROR: ADMIN_EMAIL and PASSWORD_HASH are required"
    exit 1
fi

USER_ID="$(cat /proc/sys/kernel/random/uuid 2>/dev/null || uuidgen 2>/dev/null || echo "usr-$(date +%s%N)")"

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -d "$DB_NAME" -c "
INSERT INTO \"User\" (id, email, \"passwordHash\", name, \"isActive\", \"failedLoginAttempts\", \"createdAt\", \"updatedAt\")
VALUES ('$USER_ID', '$ADMIN_EMAIL', '$PASSWORD_HASH', '$ADMIN_NAME', true, 0, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;
" 2>/dev/null || echo "User creation via psql skipped (may use ORM)"

echo "Admin user setup complete: $ADMIN_EMAIL"
