# Getting Started — Store Management Platform

This guide walks you through running the platform from scratch on your machine. No prior microservices experience required.

## What you need

| Tool | Version | Why |
|------|---------|-----|
| Java | 17+ | Build and run Spring Boot services |
| Maven | 3.9+ | Java build tool |
| Node.js | 20+ | Web and mobile client builds |
| Docker Desktop / Docker Engine | with Compose v2 | Runs all services locally |
| Git | any recent version | Clone the repository |
| RAM | ~16 GB recommended | 14 containers (Kafka, Redis, 12 DBs, 12 services, gateway, discovery) |

Verify tools:

```bash
java -version
mvn -version
node -version
docker compose version
```

## Clone and open the project

```bash
git clone <your-repo-url> store-management-platform
cd store-management-platform
```

For the latest milestone work, check out the active feature branch (for example `copilot/implementation-code-prompt` or your PR branch).

## Configure environment variables

Copy the example environment file and review each setting:

```bash
cp .env.example .env
```

| Variable | Plain-language meaning |
|----------|------------------------|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` | Database login used by all PostgreSQL containers |
| `JWT_ISSUER` | Name embedded in issued JWT tokens |
| `JWT_SECRET` | Signing key for dev tokens — use at least 32 characters; change in production |
| `SPRING_PROFILES_ACTIVE` | Spring profile (`local` for Docker Compose) |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka broker address inside Docker (`kafka:9092`) |
| `REDIS_HOST` / `REDIS_PORT` | Redis used for gateway rate limiting and caching |
| `DEFAULT_CURRENCY` | Default currency for new accounts (e.g. `AED`) |
| `DEFAULT_LOCALE` | Default locale (e.g. `en-AE`) |
| `DEFAULT_TIMEZONE` | Default timezone (e.g. `Asia/Dubai`) |
| `BOOTSTRAP_ADMIN_EMAIL` | Platform admin email seeded on first startup |
| `BOOTSTRAP_ADMIN_PASSWORD` | Platform admin password (change in production) |

You usually do not need to change these for a first local run.

## First run with Docker

**Recommended (CI-style staged startup):**

```bash
./scripts/compose-up-ci.sh
```

This script builds images, starts infrastructure in stages, waits for health checks, brings up all platform services, and runs `./scripts/wait-for-platform.sh` automatically.

**Alternative (single command):**

```bash
docker compose up --build -d
./scripts/wait-for-platform.sh
```

The wait script confirms discovery, gateway, Eureka registrations, and at least one gateway health route are ready before you run tests.

## Verify the platform is up

Open these URLs in a browser or use `curl`:

```bash
# Discovery (Eureka) health
curl -s http://localhost:8761/actuator/health

# API Gateway health
curl -s http://localhost:8080/actuator/health

# One domain service through the gateway
curl -s http://localhost:8080/api/v1/platform/health/identity-access

# List registered services in Eureka
curl -s http://localhost:8761/eureka/apps | grep -E 'IDENTITY-ACCESS|TENANT-ADMIN|INVENTORY'
```

You should see `"status":"UP"` (or similar) in health responses.

## Run tests

**Health smoke test** — checks discovery, gateway, and all 12 domain health routes:

```bash
./scripts/smoke-test.sh
```

**End-to-end business smoke test** — full flow: dev login → account → store → product → stock → sale → refund → daily report:

```bash
./scripts/e2e-smoke-test.sh
```

Both scripts exit with code `0` on success and `1` on failure.

## Admin web UI

```bash
cd web-client
npm ci
npm run dev
```

Open http://localhost:3000 and sign in with the bootstrap credentials from `.env` (default `admin@smartpos.local` / `changeme123`).

### Happy-path checklist

1. Platform admin → **Accounts** — create subscriber org with owner credentials
2. Assign a **business** plan (5 stores) from the plan dropdown
3. **AI Keys** — rotate a key (only last 4 digits are shown after save)
4. Log out → sign in as account owner → **Stores** — create Branch A and B
5. **Users** — add cashier; **Role Assignment** — assign `cashier` role scoped to Branch A
6. Log in as cashier — header store picker shows Branch A only
7. Log in as store manager (or owner) → **Store Settings**, **Refund Policy**, **Report Settings**

The developer API dashboard is at `/dev` (preserved from earlier milestones).

> **Local dev escape hatch:** set `SMOKE_TEST_MODE=mock` to skip live platform checks when
> debugging infrastructure locally. CI always runs the real checks.

## Stop and clean up

```bash
# Stop containers and remove volumes (fresh database state next run)
docker compose down -v

# Or use the helper script
./scripts/local-clean.sh
```

## Troubleshooting

| Symptom | Likely cause | What to try |
|---------|--------------|-------------|
| Gateway health routes return **503** | Services not registered in Eureka yet, or wrong hostname in Docker | Run `./scripts/wait-for-platform.sh`; check `curl -s http://localhost:8761/eureka/apps`; ensure containers are running with `docker compose ps` |
| Gateway health routes return **500** | LoadBalancer cannot resolve service instance | Confirm Eureka shows all 12 apps; check `docker compose logs api-gateway` for LoadBalancer errors |
| Health route returns **404** | Gateway route order or path mismatch | Health routes live at `/api/v1/platform/health/{service-name}` — not under the business catch-all |
| E2E fails on stock count (expected 8 or 9) | Inventory updates are async via Kafka | Re-run e2e; the script retries stock checks for up to 5 minutes. Check `inventory-service` and Kafka logs |
| Smoke test times out | Platform still starting or container crashed | Run `./scripts/compose-up-ci.sh` again; inspect exited containers with `docker compose ps -a` and `docker compose logs <service>` |
| Out of memory / containers exit | Runner or laptop low on RAM | Close other apps; increase Docker memory limit; reduce parallel load |
| Port already in use (8080, 8761) | Another process using the port | Stop conflicting services or change host port mappings in `docker-compose.yml` |

Useful diagnostic commands:

```bash
docker compose ps -a
docker compose logs --tail=50 api-gateway
docker compose logs --tail=50 discovery-service
docker compose logs --tail=50 inventory-service
```

## Optional: local development without full Docker

Build and test Java modules:

```bash
mvn test
```

Build the web client:

```bash
cd web-client && npm ci && npm run build && cd ..
```

Run the admin UI in dev mode (requires gateway at `:8080`):

```bash
cd web-client && npm run dev
```

Type-check the mobile client:

```bash
cd mobile-client && npm ci && npx tsc --noEmit && cd ..
```

For direct access to individual service ports during debugging, use the debug compose overlay:

```bash
docker compose -f docker-compose.yml -f docker-compose.debug.yml up --build -d
```

## Next steps

- Read the main [README.md](../README.md) for architecture, gateway routes, and CI details
- See [docs/architecture.md](architecture.md) for system design
- See [docs/definition-of-done.md](definition-of-done.md) for milestone criteria
