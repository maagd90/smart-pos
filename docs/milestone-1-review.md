# Milestone 1 Review — Replacement Scaffold

## Intent

This branch replaces the previous Smart POS implementation with the new Store Management System microservices scaffold.

## Delivered

- Root-level README and service catalog.
- Docker Compose local orchestration.
- Environment template.
- Service scaffold generator.
- Review checkpoint for Milestone 1.

## Why a scaffold generator is included

The repository replacement starts with a small, reviewable platform scaffold. Running `./scaffold-services.sh` materializes the full runnable Spring Boot project structure for the gateway, discovery service, shared contracts, domain services, web client, and mobile client.

This keeps Milestone 1 review focused on architecture before domain implementation begins.

## Approval checklist

- [ ] Old Node/Express + React implementation is intentionally replaced.
- [ ] New stack is Java 17 + Spring Boot 3 for services.
- [ ] Spring Cloud Gateway is accepted as the only public entry point.
- [ ] Kafka is accepted as the event broker.
- [ ] Redis is accepted for cache/rate-limit foundation.
- [ ] PostgreSQL one database per service is accepted.
- [ ] Eureka is accepted for local development.
- [ ] Milestone 2 can start with Identity & Tenant implementation.

## Next milestone

Milestone 2: Identity & Tenant services.

Scope:

1. Accounts and stores.
2. Users, roles, permissions, user_roles, role_permissions.
3. Seed roles and permission catalog.
4. JWT login and refresh flow.
5. Account/store scoping on every endpoint.
6. Accessible stores derived from server-side role assignment.
7. Audit log foundation.
