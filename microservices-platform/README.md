# Store Management System — Microservices Platform Scaffold

This directory contains the reviewable Milestone 1 scaffold for the Store Management System SaaS rewrite.

The existing `smart-pos` implementation in this repository is preserved. This scaffold is isolated under `microservices-platform/` so the new Java/Spring Boot microservices architecture can be reviewed without disturbing the existing Node/React application.

## Milestone 1 scope

This scaffold prepares the platform foundation only:

- Spring Cloud Gateway as the single public entry point.
- Eureka service discovery for local development.
- Kafka as the asynchronous event broker.
- Redis for cache/rate-limiting/session-ready infrastructure.
- PostgreSQL with one database per bounded-context service.
- A shared contracts library for DTOs, domain events, JWT principal objects, and API error envelopes.
- Runnable Spring Boot skeletons for each bounded-context service.
- React + TypeScript web client skeleton.
- React Native + Expo mobile client skeleton.
- Dockerfile per service and docker-compose orchestration.

## Bounded-context services

| Service | Port | Database | Scope |
|---|---:|---|---|
| identity-access-service | 8101 | identity_access_db | Users, roles, permissions, JWT issuance, permission checks |
| tenant-admin-service | 8102 | tenant_admin_db | Accounts, stores, settings, platform back office |
| billing-subscription-service | 8103 | billing_subscription_db | Plans, subscriptions, entitlements, subscription gate source |
| catalog-pricing-service | 8104 | catalog_pricing_db | Products, cost price, markup/fixed pricing |
| inventory-service | 8105 | inventory_db | Append-only stock ledger, receiving, adjustments |
| sales-service | 8106 | sales_db | POS sales and stock decrement events |
| refunds-service | 8107 | refunds_db | Returns/refunds and separation of duties |
| customers-privacy-service | 8108 | customers_privacy_db | Customer profiles, consent, encrypted PII vault |
| ai-deals-service | 8109 | ai_deals_db | Rules-first deal generation and inactivity scheduler |
| notifications-approvals-service | 8110 | notifications_approvals_db | Generic approval workflow and manager notifications |
| messaging-delivery-service | 8111 | messaging_delivery_db | WhatsApp/email delivery stubs and phone decrypt boundary |
| reporting-finance-service | 8112 | reporting_finance_db | Daily gross profit, expenses, month-end P&L |

## Generate the skeleton projects

Run this once from the repository root after checking out the scaffold branch:

```bash
cd microservices-platform
chmod +x scaffold-services.sh
./scaffold-services.sh
```

The script creates the gateway, discovery service, shared contracts module, all domain services, the web client skeleton, and the mobile client skeleton.

## Run locally

After generating the skeletons:

```bash
cd microservices-platform
docker compose up --build
```

Health checks after startup:

```bash
curl http://localhost:8761/actuator/health       # discovery service
curl http://localhost:8080/actuator/health       # gateway
curl http://localhost:8101/api/v1/health         # identity service sample
curl http://localhost:3000                       # web client skeleton
curl http://localhost:19006                      # Expo web preview, if enabled locally
```

## Review checkpoint

Stop after this milestone and review:

1. Whether the service boundaries match the business spec.
2. Whether local ports and database names are acceptable.
3. Whether Kafka is preferred over RabbitMQ. This scaffold uses Kafka.
4. Whether Eureka is acceptable for local discovery before Kubernetes DNS is introduced.
5. Whether the existing `smart-pos` code should later be migrated gradually or kept as a reference implementation.

No real payment, WhatsApp, or LLM provider is wired in Milestone 1. Those integrations are intentionally stubbed behind interfaces in later milestones.
