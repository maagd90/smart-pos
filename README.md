# Store Management System — Microservices Platform

Multi-tenant, web + mobile store management SaaS built as independently deployable
Java 17 + Spring Boot 3.x microservices.

**New here?** Start with the step-by-step guide: **[docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)**

## Current Milestone: Platform + Core Business Flows

This branch delivers a runnable microservices platform with health checks, dev authentication,
and end-to-end business flows verified by smoke and e2e tests.

### What is included

- Spring Cloud Gateway as the single public API entry point
- JWT validation, Redis rate limiting, and subscription gate (billing-service backed)
- Eureka service discovery with Docker-friendly instance registration
- Kafka as the async event broker (inventory updates, outbox pattern)
- Redis for cache, rate limiting, and session infrastructure
- PostgreSQL with one database per bounded-context service
- Flyway baseline migration per service
- Shared contracts library (API envelope, auth principal, domain events, tenant context)
- Request context filter propagating gateway-forwarded identity headers
- 12 runnable domain services with core business APIs
- Bootstrap platform admin (idempotent seed from env vars)
- Production admin web UI (`web-client`) with login, platform console, account onboarding, store config
- Dev-login for CI/scripts; dev dashboard at `/dev` route
- React + TypeScript web client
- React Native + Expo mobile client skeleton
- Docker Compose orchestration with staged CI startup
- GitHub Actions CI pipeline (build, compose validation, smoke, e2e)
- Smoke test proving all services respond through the gateway
- E2E business smoke test (account → store → product → inventory → sale → refund → report)

### What is NOT included (subsequent milestones)

- Real payment, WhatsApp, or LLM integrations (stubbed behind interfaces)
- Offline mobile sync
- Full POS, inventory, and operational screens in the admin UI (nav shows "Coming soon")

---

## Prerequisites

- Java 17+
- Maven 3.9+
- Node.js 20+
- Docker and Docker Compose v2
- ~16 GB RAM recommended for full stack

See **[docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)** for a full setup walkthrough.

## Quick Start

```bash
# 1. Copy environment configuration
cp .env.example .env

# 2. Start platform (staged startup + readiness wait)
./scripts/compose-up-ci.sh

# 3. Run health smoke test
./scripts/smoke-test.sh

# 4. Run end-to-end business smoke test
./scripts/e2e-smoke-test.sh

# 5. Stop and clean
docker compose down -v
# or
./scripts/local-clean.sh
```

## Admin web UI

After the stack is up, start the admin UI:

```bash
cd web-client
npm ci
npm run dev
```

Open http://localhost:3000 — the Vite dev server proxies `/api` to the gateway at `:8080`.

### Bootstrap platform admin

On first startup, `identity-access-service` seeds a platform admin when these env vars are set (defaults in `.env.example`):

| Variable | Default |
|----------|---------|
| `BOOTSTRAP_ADMIN_EMAIL` | `admin@smartpos.local` |
| `BOOTSTRAP_ADMIN_PASSWORD` | `changeme123` |

Sign in at `/login` with those credentials. The seed is idempotent — it skips if the user already exists.

### Onboarding happy path (manual)

1. **Platform admin** — create subscriber account (with owner), assign plan, rotate AI key
2. **Account owner** — log in as owner, create stores (upgrade banner if plan limit hit), add users, assign per-store roles
3. **Cashier** — log in; store picker shows only assigned stores
4. **Store manager** — configure store settings, refund policy, report settings for selected store

The developer E2E dashboard remains at `/dev` for scripted API flow testing.

Alternative startup:

```bash
cp .env.example .env
docker compose up --build -d
./scripts/wait-for-platform.sh
./scripts/smoke-test.sh
./scripts/e2e-smoke-test.sh
```

## Architecture

```
┌─────────────┐     ┌──────────────────────────────────────────────────┐
│  Web Client │────▶│              API Gateway (:8080)                  │
│  Mobile App │     │  JWT validation │ Rate limit │ Subscription gate  │
└─────────────┘     └──────────────────────┬───────────────────────────┘
                                           │ Eureka discovery
                    ┌──────────────────────┼───────────────────────────┐
                    ▼                       ▼                           ▼
             ┌─────────────┐     ┌─────────────────┐         ┌──────────────┐
             │  Identity   │     │  Tenant Admin   │   ...   │  Reporting   │
             │  Service    │     │  Service        │         │  Service     │
             └──────┬──────┘     └────────┬────────┘         └──────┬───────┘
                    │                      │                          │
                    ▼                      ▼                          ▼
             ┌─────────────┐     ┌─────────────────┐         ┌──────────────┐
             │  PostgreSQL │     │   PostgreSQL    │         │  PostgreSQL  │
             │  (own DB)   │     │   (own DB)      │         │  (own DB)    │
             └─────────────┘     └─────────────────┘         └──────────────┘
```

All services communicate via:
- **Synchronous:** REST through the gateway or direct service-to-service via Eureka
- **Asynchronous:** Kafka events using the shared `DomainEvent` schema

## Gateway Access Rule

**Only the API gateway is publicly exposed.** Domain services are internal only —
they are not accessible on host ports in the default Docker Compose configuration.
Use `docker-compose.debug.yml` for direct service access during development:

```bash
docker compose -f docker-compose.yml -f docker-compose.debug.yml up --build -d
```

## Gateway Routes

| Path Pattern | Target Service |
|---|---|
| `/api/v1/auth/**` | identity-access-service |
| `/api/v1/accounts/*/users/**` | identity-access-service |
| `/api/v1/accounts/**` | tenant-admin-service |
| `/api/v1/stores/{id}` | tenant-admin-service |
| `/api/v1/billing/**` | billing-subscription-service |
| `/api/v1/subscriptions/**` | billing-subscription-service |
| `/api/v1/stores/*/products/**` | catalog-pricing-service |
| `/api/v1/stores/*/inventory/**` | inventory-service |
| `/api/v1/stores/*/sales/**` | sales-service |
| `/api/v1/stores/*/refunds/**` | refunds-service |
| `/api/v1/stores/*/customers/**` | customers-privacy-service |
| `/api/v1/stores/*/deals/**` | ai-deals-service |
| `/api/v1/deals/**` | ai-deals-service |
| `/api/v1/stores/*/approvals/**` | notifications-approvals-service |
| `/api/v1/stores/*/notifications/**` | notifications-approvals-service |
| `/api/v1/stores/*/messages/**` | messaging-delivery-service |
| `/api/v1/stores/*/reports/**` | reporting-finance-service |
| `/api/v1/stores/*/expenses/**` | reporting-finance-service |
| `/api/v1/platform/health/**` | Per-service health routes (see below) |
| `/api/v1/platform/**` (other) | tenant-admin-service (admin) |

## Health Check Endpoints

Each service is reachable through the gateway at:

```
GET /api/v1/platform/health/{service-name}
```

Available service health routes:

| Endpoint | Service |
|---|---|
| `/api/v1/platform/health/identity-access` | Identity and Access |
| `/api/v1/platform/health/tenant-admin` | Tenant and Admin |
| `/api/v1/platform/health/billing-subscription` | Billing and Subscription |
| `/api/v1/platform/health/catalog-pricing` | Catalog and Pricing |
| `/api/v1/platform/health/inventory` | Inventory |
| `/api/v1/platform/health/sales` | Sales |
| `/api/v1/platform/health/refunds` | Refunds |
| `/api/v1/platform/health/customers-privacy` | Customers and Privacy |
| `/api/v1/platform/health/ai-deals` | AI Deals |
| `/api/v1/platform/health/notifications-approvals` | Notifications and Approvals |
| `/api/v1/platform/health/messaging-delivery` | Messaging and Delivery |
| `/api/v1/platform/health/reporting-finance` | Reporting and Finance |

Infrastructure health:
- Discovery: `http://localhost:8761/actuator/health`
- Gateway: `http://localhost:8080/actuator/health`

## Rate Limiting

Redis-backed rate limiting is configured at the gateway for business routes.
Health routes (`/api/v1/platform/health/**`) are excluded from the global rate limiter
so smoke tests can probe all services quickly.

| Route | Replenish Rate | Burst Capacity |
|---|---|---|
| `/api/v1/auth/**` | 10 req/sec | 20 |
| Other business `/api/v1/**` | 50 req/sec | 100 |

Key resolution: authenticated user ID when available, remote IP address otherwise.
All values are configurable via environment variables.

## Subscription Gate

The gateway subscription gate calls `billing-subscription-service` to evaluate plan limits.
Store creation returns HTTP 402 with `UPGRADE_REQUIRED` when the account exceeds `max_stores`.

Possible gate decisions: `ALLOW`, `DENY`, `READ_ONLY`, `UPGRADE_REQUIRED`.

Set `gateway.subscription.remote-enabled=false` to use the local allow-all stub during development.

## Stubbed External Integrations

The following integrations are designed behind interfaces but not connected to real providers:

- **BillingProvider** — payment processing (abstract interface, stub implementation)
- **MessagingProvider** — WhatsApp Cloud API (abstract interface, stub implementation)
- **LlmProvider** — AI model calls (rules-first approach, optional LLM layer)

All can be swapped and disabled via configuration/entitlements.

## CI Pipeline

The GitHub Actions CI runs on every pull request and push:

1. **Java Build** — `mvn -q test`
2. **Web Client Build** — `npm ci && npm run build`
3. **Mobile Client Type Check** — `npm ci && npx tsc --noEmit`
4. **Docker Compose Validation** — `docker compose config`
5. **Smoke Test** — staged Docker Compose startup, platform readiness wait, health verification
6. **E2E Business Smoke Test** — full business flow through the gateway

> **Local dev escape hatch:** `SMOKE_TEST_MODE=mock` skips live checks in the smoke scripts.
> CI always runs real smoke and e2e tests.

## Service Catalog

| Service | Port | Database | Scope |
|---|---|---|---|
| api-gateway | 8080 | — | Single entry point, JWT, rate limit, subscription gate |
| discovery-service | 8761 | — | Eureka service registry |
| identity-access-service | 8101 | identity_access_db | Users, roles, permissions, JWT |
| tenant-admin-service | 8102 | tenant_admin_db | Accounts, stores, config |
| billing-subscription-service | 8103 | billing_subscription_db | Plans, subscriptions, entitlements |
| catalog-pricing-service | 8104 | catalog_pricing_db | Products, pricing |
| inventory-service | 8105 | inventory_db | Stock ledger, receiving |
| sales-service | 8106 | sales_db | POS transactions |
| refunds-service | 8107 | refunds_db | Returns, refunds |
| customers-privacy-service | 8108 | customers_privacy_db | Customer profiles, PII vault |
| ai-deals-service | 8109 | ai_deals_db | Deal generation, inactivity scheduler |
| notifications-approvals-service | 8110 | notifications_approvals_db | Approval workflows, notifications |
| messaging-delivery-service | 8111 | messaging_delivery_db | WhatsApp/email delivery |
| reporting-finance-service | 8112 | reporting_finance_db | Reports, expenses, P&L |
