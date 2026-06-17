# Store Management System — Microservices Platform

Multi-tenant, web + mobile store management SaaS built as independently deployable
Java 17 + Spring Boot 3.x microservices.

## Current Milestone: 1 — Platform Scaffold

This branch delivers the platform infrastructure and runnable service skeletons.
No business logic is implemented yet — services expose health endpoints only.

### What is included

- Spring Cloud Gateway as the single public API entry point
- JWT validation, Redis rate limiting, and subscription gate foundations
- Eureka service discovery for local development
- Kafka as the async event broker
- Redis for cache, rate limiting, and session infrastructure
- PostgreSQL with one database per bounded-context service
- Flyway baseline migration per service
- Shared contracts library (API envelope, auth principal, domain events, tenant context)
- Request context filter propagating gateway-forwarded identity headers
- 12 runnable domain service skeletons
- React + TypeScript web client skeleton
- React Native + Expo mobile client skeleton
- Docker Compose orchestration with health checks
- GitHub Actions CI pipeline
- Smoke test proving all services start and respond through the gateway

### What is NOT included (subsequent milestones)

- Real business logic in any domain service
- Real JWT issuance (Identity service — Milestone 2)
- Real subscription enforcement (Billing service — Milestone 7)
- Real payment, WhatsApp, or LLM integrations (stubbed behind interfaces)
- Offline mobile sync

---

## Prerequisites

- Java 17+
- Maven 3.9+
- Node.js 20+
- Docker and Docker Compose v2

## Local Setup

```bash
# 1. Copy environment configuration
cp .env.example .env

# 2. Build all Java modules
mvn -q -DskipTests package

# 3. Build web client
cd web-client && npm ci && npm run build && cd ..

# 4. Type-check mobile client
cd mobile-client && npm ci && npx tsc --noEmit && cd ..

# 5. Validate Docker Compose
docker compose config

# 6. Start everything
docker compose up --build -d

# 7. Run smoke tests
./scripts/smoke-test.sh

# 8. Stop and clean
docker compose down -v
# or
./scripts/local-clean.sh
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
| `/api/v1/platform/**` | tenant-admin-service (admin) |

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

Redis-backed rate limiting is configured at the gateway:

| Route | Replenish Rate | Burst Capacity |
|---|---|---|
| `/api/v1/auth/**` | 10 req/sec | 20 |
| All other `/api/v1/**` | 50 req/sec | 100 |

Key resolution: authenticated user ID when available, remote IP address otherwise.
All values are configurable via environment variables.

## Subscription Gate

The gateway includes a subscription gate filter that evaluates account subscription
status before forwarding business requests.

**Milestone 1:** The gate uses a local stub that always allows requests. This
establishes the pattern so that when the Billing and Subscription service is built
(Milestone 7), the stub is replaced with a real service call.

Possible gate decisions: `ALLOW`, `DENY`, `READ_ONLY`, `UPGRADE_REQUIRED`.

## Stubbed External Integrations

The following integrations are designed behind interfaces but not connected to real providers:

- **BillingProvider** — payment processing (abstract interface, stub implementation)
- **MessagingProvider** — WhatsApp Cloud API (abstract interface, stub implementation)
- **LlmProvider** — AI model calls (rules-first approach, optional LLM layer)

All can be swapped and disabled via configuration/entitlements.

## CI Pipeline

The GitHub Actions CI runs on every pull request and push:

1. **Java Build** — `mvn -q -DskipTests package`
2. **Web Client Build** — `npm ci && npm run build`
3. **Mobile Client Type Check** — `npm ci && npx tsc --noEmit`
4. **Docker Compose Validation** — `docker compose config`
5. **Smoke Test** — full Docker Compose startup + health verification

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
