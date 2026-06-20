# Definition of Done

## Build Expectations

From a clean checkout, the following must pass without errors:

```bash
cp .env.example .env
mvn -q -DskipTests package

cd web-client && npm ci && npm run build && cd ..
cd mobile-client && npm ci && npx tsc --noEmit && cd ..

docker compose config
```

## CI Expectations

The GitHub Actions CI pipeline must pass on every pull request:

1. Java multi-module Maven build
2. Web client npm build
3. Mobile client TypeScript type check
4. Docker Compose config validation
5. Full smoke test (Docker Compose up + health checks through gateway)

## Smoke Test Expectations

The smoke test (`scripts/smoke-test.sh`) must verify:

- Discovery service is healthy
- API gateway is healthy
- Every domain service health endpoint responds through the gateway
- No service fails due to infrastructure startup ordering

## Javadoc Expectations

Every Java source file must have Javadoc on:

- Classes, records, enums, and interfaces
- Public methods
- Configuration classes
- Filters and interceptors
- DTOs and contracts
- Exception classes
- Controller methods

## Code Quality Rules

1. No hardcoded tenant, account, store, currency, locale, timezone, or permission values
2. No hardcoded JWT secrets (always from environment/config)
3. Temporary/stub behavior clearly marked with `Milestone N` annotations
4. No external tool or provider brand-name references in code, comments, docs, or metadata

## Merge Criteria

A pull request is merge-ready when:

- [ ] CI pipeline passes (all 5 jobs green)
- [ ] Maven root build succeeds
- [ ] Web client builds successfully
- [ ] Mobile client passes type checking
- [ ] Docker Compose validates and starts all services
- [ ] Smoke test passes all health checks through the gateway
- [ ] Gateway routes all 12 domain services
- [ ] Gateway has JWT validation foundation
- [ ] Gateway has Redis rate-limit foundation
- [ ] Gateway has subscription gate foundation
- [ ] Services use shared-contracts dependency
- [ ] Services include request context filter
- [ ] Internal services not publicly exposed by default
- [ ] Docker startup uses health check conditions
- [ ] README and architecture docs updated
- [ ] Javadoc present on all required elements
- [ ] No prohibited brand-name references anywhere
