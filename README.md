# Store Management System — Microservices SaaS

This repository now represents the new Store Management System platform. The previous Node.js/Express + React Smart POS codebase is intentionally replaced by a Java 17 + Spring Boot 3 microservices scaffold.

The project must be built iteratively. This branch delivers **Milestone 1: Platform Scaffold** only, so the architecture can be reviewed before business features are implemented.

## Milestone 1 scope

Included:

- Spring Cloud Gateway as the only public API entry point.
- Eureka service discovery for local development.
- Kafka as the async event broker.
- Redis for cache, session-ready infrastructure, and gateway rate-limiting foundation.
- PostgreSQL with one database per bounded-context service.
- Flyway baseline migration per service.
- Shared contracts library for API envelopes, JWT principal, and domain event records.
- Runnable Spring Boot skeletons generated for every bounded-context service.
- React + TypeScript web client skeleton.
- React Native + Expo mobile client skeleton.
- Docker Compose orchestration for local development.

Out of scope for this milestone:

- Real payment provider integration.
- Real WhatsApp delivery.
- Real LLM calls.
- Offline mobile sync.
- Full Identity/RBAC implementation. That starts in Milestone 2.

## Architecture

```text
smart-pos/
├── api-gateway/                         # Spring Cloud Gateway
├── discovery-service/                   # Eureka server
├── shared-contracts/                    # DTOs, events, auth principal, API envelope
├── services/
│   ├── identity-access-service/
│   ├── tenant-admin-service/
│   ├── billing-subscription-service/
│   ├── catalog-pricing-service/
│   ├── inventory-service/
│   ├── sales-service/
│   ├── refunds-service/
│   ├── customers-privacy-service/
│   ├── ai-deals-service/
│   ├── notifications-approvals-service/
│   ├── messaging-delivery-service/
│   └── reporting-finance-service/
├── web-client/                          # React + TypeScript
├── mobile-client/                       # React Native + Expo
├── docker-compose.yml
├── service-catalog.yml
└── scaffold-services.sh
```

## Service catalog

| Service | Port | Database | Responsibility |
|---|---:|---|---|
| api-gateway | 8080 | none | Single public entry point, JWT validation, rate-limit foundation, subscription gate foundation |
| discovery-service | 8761 | none | Local service discovery |
| identity-access-service | 8101 | identity_access_db | Users, roles, permissions, JWT issuance, permission checks |
| tenant-admin-service | 8102 | tenant_admin_db | Accounts, stores, store configuration, platform admin |
| billing-subscription-service | 8103 | billing_subscription_db | Plans, subscriptions, entitlements |
| catalog-pricing-service | 8104 | catalog_pricing_db | Products, cost, markup/fixed pricing |
| inventory-service | 8105 | inventory_db | Append-only stock ledger and inventory approvals |
| sales-service | 8106 | sales_db | POS transactions |
| refunds-service | 8107 | refunds_db | Returns/refunds and separation of duties |
| customers-privacy-service | 8108 | customers_privacy_db | Customer profiles, consent, encrypted PII vault |
| ai-deals-service | 8109 | ai_deals_db | Rules-first deal generation and inactivity scheduler |
| notifications-approvals-service | 8110 | notifications_approvals_db | Generic approval workflow and manager notifications |
| messaging-delivery-service | 8111 | messaging_delivery_db | WhatsApp/email stubs and phone decrypt boundary |
| reporting-finance-service | 8112 | reporting_finance_db | Daily gross profit, expenses, month-end P&L |

## Local setup

Generate the runnable skeleton projects:

```bash
chmod +x scaffold-services.sh
./scaffold-services.sh
```

Start local infrastructure and services:

```bash
cp .env.example .env
docker compose up --build
```

Sample health checks:

```bash
curl http://localhost:8761/actuator/health
curl http://localhost:8080/actuator/health
curl http://localhost:8101/api/v1/health
```

## Milestone review checkpoint

Review and approve these before Milestone 2 starts:

1. Service boundaries and names.
2. Kafka as the broker instead of RabbitMQ.
3. Eureka for local discovery, with Kubernetes DNS later.
4. One PostgreSQL database per service.
5. Root-level replacement of the old Smart POS implementation.
6. Whether generated service skeletons should be committed directly after this review or kept generated from `scaffold-services.sh`.

## Next milestone

Milestone 2 will implement Identity & Tenant services:

- Accounts, stores, users, roles, permissions, user_roles, role_permissions, audit_logs.
- JWT login and refresh flow.
- Permission-based authorization only; no hardcoded role checks.
- Store access boundary derived from `user_roles`.
- Seed roles and permission catalog.
- Tenant/store scoping enforced server-side.
