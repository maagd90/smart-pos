# Architecture Overview

## Service Boundaries

Each bounded context from the domain model is an independently deployable microservice
with its own:

- Spring Boot application
- PostgreSQL database (no shared databases, no cross-service joins)
- Flyway migrations
- Kafka consumer group
- Eureka registration
- REST API under `/api/v1`

Services are organized by business capability, not by technical layer.

## Independent Project Builds

Each service is an independently buildable Maven project:

- **Parent BOM:** `smartpos-parent/pom.xml` (dependency versions only, no modules)
- **Shared library:** `shared-contracts` (installed to local/remote Maven repo)
- **Service module:** e.g. `services/inventory-service/pom.xml` (standalone Spring Boot app)

Build a single service without the full monorepo:

```bash
mvn -f shared-contracts/pom.xml install -DskipTests
mvn -f services/inventory-service/pom.xml test package
```

Docker builds copy only `smartpos-parent`, `shared-contracts`, and the target service —
not the entire aggregator `pom.xml`. This prevents unrelated service changes from breaking
another service's container image build.

The root `pom.xml` remains a **local development aggregator** for running `mvn test` across
all modules in one command.

## Database Ownership

Every service owns its database exclusively. No other service may read from or write
to another service's database. Data sharing happens only through:

1. REST API calls (synchronous)
2. Domain events on Kafka (asynchronous)

This ensures each service can evolve its schema independently.

## Runtime Communication

### Synchronous (REST)
- Client → Gateway → Service (all external traffic)
- Service → Service (internal, via Eureka discovery, for queries)

### Asynchronous (Kafka)
- Services publish `DomainEvent` records to topic per aggregate type
- Other services subscribe to relevant topics for eventual consistency
- All events use the shared `DomainEvent` schema from shared-contracts

## Shared Contracts Library

The `shared-contracts` module provides build-time contracts shared across all services:

- **ApiEnvelope / ApiError** — standard response wrapper
- **AuthPrincipal** — JWT-extracted user identity
- **DomainEvent** — event broker message format
- **TenantContext / RequestContextHolder / RequestContextFilter** — request-scoped tenant identity
- **HealthResponse** — standard health check format
- **SubscriptionGateDecision** — gateway subscription enforcement decisions
- **PermissionCheckRequest / PermissionCheckResponse** — inter-service permission verification

Services depend on this library at build time. At runtime, they interlink only through
the gateway, REST calls, and Kafka — never by importing another service's internals.

## Gateway Responsibility

The API Gateway is the single public entry point. It handles:

1. **TLS termination** (in production)
2. **JWT validation** — verifies token signature and expiry
3. **Identity header forwarding** — injects X-User-Id, X-Account-Id, X-Store-Id, etc.
4. **Rate limiting** — Redis-backed, per-user or per-IP
5. **Subscription gate** — blocks requests from accounts without active subscriptions
6. **Routing** — forwards to appropriate service via Eureka

Domain services trust the gateway-forwarded headers and perform additional
permission checks per endpoint.

## Tenant Context

Every request carries tenant identity through the following flow:

1. Client sends JWT in Authorization header
2. Gateway validates JWT, extracts claims
3. Gateway injects identity headers (X-User-Id, X-Account-Id, etc.)
4. Service's `RequestContextFilter` reads headers into thread-local `TenantContext`
5. Business logic uses `RequestContextHolder.get()` for scoping and authorization

Multi-tenant isolation is enforced at the data layer: every query filters by
`account_id` (and `store_id` where applicable).

## Security Foundation

- JWT-based stateless authentication (HMAC in Milestone 1, RSA planned)
- Permission-based authorization (never hardcoded role name checks)
- Tenant-scoped data access enforced server-side
- PII encrypted at rest (Customers and Privacy service)
- Only Messaging service decrypts phone numbers
- Audit logging for PII access and approval decisions

## Subscription Gate Foundation

The gateway subscription gate evaluates account status before forwarding business
requests. Decisions:

- **ALLOW** — request proceeds normally
- **DENY** — account suspended or cancelled
- **READ_ONLY** — grace period, only GET/HEAD/OPTIONS allowed
- **UPGRADE_REQUIRED** — feature needs a higher plan tier

Milestone 1 uses a local stub (always ALLOW). The Billing and Subscription service
(Milestone 7) will provide real evaluation.
