#!/usr/bin/env bash
set -euo pipefail

TENANT_DOMAIN="${TENANT_DOMAIN:-}"
TENANT_SLUG="${TENANT_SLUG:-}"
NGINX_CONF_DIR="${NGINX_CONF_DIR:-/etc/nginx/sites-available}"
NGINX_ENABLED_DIR="${NGINX_ENABLED_DIR:-/etc/nginx/sites-enabled}"
BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@smartpos.app}"
SKIP_SSL="${SKIP_SSL:-false}"

echo "Setting up domain: $TENANT_DOMAIN for tenant: $TENANT_SLUG"

# Create Nginx config
NGINX_CONF="$NGINX_CONF_DIR/$TENANT_DOMAIN"

cat > "$NGINX_CONF" << EOF
server {
    listen 80;
    server_name $TENANT_DOMAIN;

    location /api/ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Tenant-Slug $TENANT_SLUG;
        proxy_cache_bypass \$http_upgrade;
    }

    location / {
        proxy_pass http://127.0.0.1:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
if [ -d "$NGINX_ENABLED_DIR" ]; then
    ln -sf "$NGINX_CONF" "$NGINX_ENABLED_DIR/$TENANT_DOMAIN" 2>/dev/null || true
    nginx -t 2>/dev/null && nginx -s reload 2>/dev/null || echo "Nginx reload skipped"
fi

# Generate SSL certificate
if [ "$SKIP_SSL" != "true" ] && command -v certbot &>/dev/null; then
    certbot --nginx \
        -d "$TENANT_DOMAIN" \
        --non-interactive \
        --agree-tos \
        --email "$CERTBOT_EMAIL" \
        --redirect 2>/dev/null || echo "SSL certificate generation skipped"
fi

echo "Domain setup complete for: $TENANT_DOMAIN"
