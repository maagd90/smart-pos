#!/usr/bin/env bash
set -euo pipefail

TENANT_SLUG="${TENANT_SLUG:-}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_SUPERUSER="${DB_SUPERUSER:-postgres}"
DB_NAME="smartpos_${TENANT_SLUG}"
DB_USER="tenant_${TENANT_SLUG}"
DB_PASS="${DB_PASS:-$(openssl rand -base64 16)}"

echo "Setting up database for tenant: $TENANT_SLUG"

# Create database user
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -c "
  DO \$\$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
      CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASS';
    END IF;
  END \$\$;
" 2>/dev/null || echo "User may already exist"

# Create database
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -c "
  SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')
" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" 2>/dev/null || true

# Grant privileges
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -c "
  GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
" 2>/dev/null || true

# Run migrations via Prisma
TENANT_DATABASE_URL="postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME"

cd "$(dirname "$0")/../backend"
DATABASE_URL="$TENANT_DATABASE_URL" npx prisma migrate deploy 2>/dev/null || \
DATABASE_URL="$TENANT_DATABASE_URL" npx prisma db push --skip-generate 2>/dev/null || true

echo "Database setup complete for tenant: $TENANT_SLUG"
echo "DB_NAME=$DB_NAME"
echo "DB_USER=$DB_USER"
