# Smart POS — Store Management Platform

A multi-tenant SaaS platform for running retail stores: accounts, branches, inventory, sales, refunds, reporting, and admin onboarding — delivered as Java microservices with a React admin web app.

**Never run this before?** Follow [Step-by-step setup](#step-by-step-setup-from-zero) below. You do not need prior microservices experience.

---

## Product overview

### What is Smart POS?

Smart POS is a **store management system** for businesses that operate one or many retail locations. It helps you:

- **Onboard organizations** — platform admins create subscriber accounts, assign subscription plans, and manage access.
- **Run stores** — each account can open multiple branches (stores) with their own settings, timezone, and policies.
- **Manage people** — invite users and assign roles (account owner, store manager, cashier, etc.) with per-store access where needed.
- **Operate the business** — products, stock, point-of-sale sales, refunds/exchanges, and daily reports flow through dedicated backend services.
- **Control billing** — subscription plans limit how many stores a customer can create; upgrading the plan unlocks more capacity.

### Who uses it?

| Role | What they do in the app |
|------|-------------------------|
| **Platform admin** | Creates customer accounts, assigns plans, manages AI keys, suspends accounts |
| **Account owner** | Creates stores, adds users, assigns roles across the organization |
| **Store manager** | Configures store hours, refund policy, and report delivery for a branch |
| **Cashier / staff** | (Future UI) Runs POS and day-to-day store operations — APIs exist today |

### What you get in this repository

| Layer | Description |
|-------|-------------|
| **Backend** | 12 Spring Boot microservices + API gateway + service discovery |
| **Admin web UI** | React app at `web-client/` — login, onboarding, store configuration |
| **Mobile skeleton** | React Native / Expo app in `mobile-client/` (scaffold) |
| **Infrastructure** | Docker Compose stack: PostgreSQL, Kafka, Redis, Eureka |
| **Tests & CI** | Unit tests, health smoke tests, end-to-end business flow scripts |

### What is not included yet

- Live payment processing, WhatsApp, or LLM integrations (interfaces exist; providers are stubbed)
- Full POS / inventory screens in the admin UI (nav shows “Coming soon”; APIs work)
- Offline mobile sync

---

## Step-by-step setup (from zero)

This section assumes a **Mac, Windows, or Linux** laptop with internet access. Copy and paste each command into a terminal.

### Step 1 — Install required software

Install these tools once on your machine:

| Tool | Minimum version | How to check | Where to get it |
|------|-----------------|--------------|-----------------|
| **Git** | any recent | `git --version` | [git-scm.com](https://git-scm.com/) |
| **Docker Desktop** (or Docker Engine + Compose) | Compose v2 | `docker compose version` | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Java JDK** | 17+ | `java -version` | [adoptium.net](https://adoptium.net/) |
| **Maven** | 3.9+ | `mvn -version` | [maven.apache.org](https://maven.apache.org/download.cgi) |
| **Node.js** | 20+ | `node -version` | [nodejs.org](https://nodejs.org/) |

**Tips for beginners:**

- **Docker must be running** before you start the platform (open Docker Desktop and wait until it says “Running”).
- Allocate **at least 8 GB RAM to Docker** (16 GB total machine RAM recommended). In Docker Desktop: Settings → Resources → Memory.
- On Linux, add your user to the `docker` group if you see “permission denied” on `/var/run/docker.sock`.

### Step 2 — Clone the repository

```bash
git clone https://github.com/maagd90/smart-pos.git
cd smart-pos
```

If you are working from a feature branch:

```bash
git checkout main
git pull
```

### Step 3 — Create your local environment file

The project reads settings from a file named `.env` in the project root.

```bash
cp .env.example .env
```

For a first run, **you can leave the defaults**. Important defaults:

| Setting | Default | Meaning |
|---------|---------|---------|
| `BOOTSTRAP_ADMIN_EMAIL` | `admin@smartpos.local` | First platform admin login email |
| `BOOTSTRAP_ADMIN_PASSWORD` | `changeme123` | First platform admin password |
| `JWT_SECRET` | (see `.env.example`) | Token signing key — change before production |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` | `smartpos` / `smartpos` | Database credentials inside Docker |

### Step 4 — Start the platform (backend)

From the project root, run:

```bash
./scripts/compose-up-ci.sh
```

**What this does:** builds Docker images, starts databases and messaging, waits until services are healthy, then starts all microservices. The first run can take **10–20 minutes** depending on your machine and network.

**Alternative (manual):**

```bash
docker compose up --build -d
./scripts/wait-for-platform.sh
```

**How you know it worked:**

```bash
curl -s http://localhost:8080/actuator/health
```

You should see `"status":"UP"`.

Open in a browser:

- Gateway health: http://localhost:8080/actuator/health  
- Service registry: http://localhost:8761  

### Step 5 — Run automated checks (optional but recommended)

Still in the project root:

```bash
./scripts/smoke-test.sh
./scripts/e2e-smoke-test.sh
```

- **Smoke test** — verifies every service responds through the gateway.  
- **E2E test** — runs a full business flow (account → store → product → stock → sale → refund → report).

Both should finish with exit code `0` (no error). The E2E test can take several minutes because inventory updates are asynchronous.

### Step 6 — Start the admin web UI

Open a **new terminal window**, then:

```bash
cd smart-pos/web-client
npm ci
npm run dev
```

Open http://localhost:3000 in your browser.

The web app sends API calls to the gateway at http://localhost:8080 (via the Vite dev proxy).

### Step 7 — Log in and walk through onboarding

1. Go to http://localhost:3000/login  
2. Sign in with:
   - **Email:** `admin@smartpos.local`  
   - **Password:** `changeme123`  
3. As **platform admin** → **Accounts**:
   - Create a subscriber (e.g. “Acme Retail”) with an owner email and password  
   - Assign a **business** plan (allows more stores)  
4. Log out → sign in as the **account owner** you just created  
5. **Stores** — create Branch A and Branch B  
6. **Users** — add a cashier user  
7. **Role Assignment** — assign the `cashier` role to that user **for Branch A only**  
8. Log in as the cashier — the store picker should show only Branch A  
9. As owner or store manager → **Store Settings**, **Refund Policy**, **Report Settings**

The developer API test dashboard is still available at http://localhost:3000/dev (for engineers testing raw API flows).

### Step 8 — Stop everything when you are done

From the project root:

```bash
docker compose down -v
```

Or use the helper:

```bash
./scripts/local-clean.sh
```

This stops containers and removes database volumes so the next run starts fresh.

### Step 9 — Store manager notifications (mobile app or web shortcut)

Store managers with `deal.approve` or `inventory.change.approve` permissions can receive
approval notifications in two ways — choose one per device:

| Option | How to install | How alerts arrive |
|---|---|---|
| **Native mobile app** | Install the Expo/React Native app (`mobile-client`) | Expo push notifications over the network |
| **Web shortcut (PWA)** | Open the admin web UI on your phone → Share → **Add to Home Screen** (iOS) or **Install app** (Chrome/Android) | Browser notifications while the shortcut is installed; polls every 30 seconds when online |

Both options use the same backend inbox at `/api/v1/notifications` and the same approval
actions (Accept/Reject). The web shortcut opens at `/manager/notifications` when launched
from the home screen.

**Network required:** Push, email, and web polling all need network connectivity to the API gateway.

**No duplicate notifications:** Each approval event creates at most one inbox row per recipient
(enforced by a database unique constraint on kind + reference + user). The service also checks
for an existing row before insert and skips delivery if a concurrent Kafka replay hits the
unique constraint — so push, email, and inbox entries are never duplicated for the same event.
On the web shortcut, browser alerts use the notification `id` as a tag and track seen IDs in
local storage so the same pending item is not alerted twice.

---

## Quick reference (experienced developers)

```bash
cp .env.example .env
./scripts/compose-up-ci.sh
./scripts/smoke-test.sh
./scripts/e2e-smoke-test.sh
cd web-client && npm ci && npm run dev
```

Build and test without Docker:

```bash
mvn test
cd web-client && npm ci && npm run build
cd mobile-client && npm ci && npx tsc --noEmit
```

---

## Troubleshooting

| Problem | What to try |
|---------|-------------|
| `permission denied` on Docker | Start Docker Desktop; on Linux, fix docker group permissions |
| Gateway returns **503** | Platform still starting — run `./scripts/wait-for-platform.sh` and wait 2–5 minutes |
| Port **8080** or **8761** in use | Stop other apps using those ports, or change mappings in `docker-compose.yml` |
| Containers keep exiting | Increase Docker memory; run `docker compose ps -a` and `docker compose logs <service-name>` |
| E2E fails on stock count | Kafka is async — re-run the test; it retries for up to 5 minutes |
| Admin login fails | Confirm `.env` has `BOOTSTRAP_ADMIN_*` set and identity service logs show “Bootstrap platform admin created” |
| `npm run dev` cannot reach API | Ensure gateway is up at http://localhost:8080 before starting the web client |

Diagnostic commands:

```bash
docker compose ps -a
docker compose logs --tail=50 api-gateway
docker compose logs --tail=50 identity-access-service
curl -s http://localhost:8761/eureka/apps | head
```

More detail: **[docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)**

---

## Architecture (high level)

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

- **Synchronous:** REST through the gateway (or service-to-service via Eureka)  
- **Asynchronous:** Kafka domain events (e.g. inventory updates after sales/refunds)

**Security rule:** only the **API gateway** is exposed on host ports by default. Individual microservices run inside Docker and are not directly reachable unless you use `docker-compose.debug.yml`.

Deep dive: **[docs/architecture.md](docs/architecture.md)**

---

## Repository layout

| Path | Purpose |
|------|---------|
| `api-gateway/` | Single public entry point, JWT, rate limiting, subscription gate |
| `discovery-service/` | Eureka service registry |
| `services/*` | Domain microservices (identity, tenant, billing, catalog, inventory, sales, refunds, …) |
| `shared-contracts/` | Shared API envelope, auth context, events, security annotations |
| `web-client/` | React admin UI (login, platform console, account/store management, PWA approvals) |
| `mobile-client/` | React Native / Expo app (store manager approvals inbox + push) |
| `scripts/` | Compose startup, smoke tests, e2e tests, cleanup |
| `docs/` | Extended guides (getting started, architecture, definition of done) |
| `.env.example` | Template environment variables — copy to `.env` |
| `docker-compose.yml` | Full local stack definition |

---

## Service catalog

| Service | Port (internal) | Scope |
|---------|-----------------|-------|
| api-gateway | 8080 | Gateway, JWT, rate limit, subscription gate |
| discovery-service | 8761 | Eureka registry |
| identity-access-service | 8101 | Users, roles, permissions, auth |
| tenant-admin-service | 8102 | Accounts, stores, platform admin |
| billing-subscription-service | 8103 | Plans, subscriptions, entitlements |
| catalog-pricing-service | 8104 | Products, pricing, refund policy |
| inventory-service | 8105 | Stock ledger |
| sales-service | 8106 | POS transactions |
| refunds-service | 8107 | Refunds and exchanges |
| customers-privacy-service | 8108 | Customer profiles |
| ai-deals-service | 8109 | Promotions / deals |
| notifications-approvals-service | 8110 | Approvals, notifications |
| messaging-delivery-service | 8111 | Message delivery (stub) |
| reporting-finance-service | 8112 | Reports, expenses |

Health check through gateway: `GET /api/v1/platform/health/{service-name}`  
Example: http://localhost:8080/api/v1/platform/health/inventory

---

## Gateway routes (summary)

| Path pattern | Target |
|--------------|--------|
| `/api/v1/auth/**` | Identity & access |
| `/api/v1/accounts/**` | Tenant admin |
| `/api/v1/platform/**` | Platform admin & billing |
| `/api/v1/stores/*/products/**` | Catalog |
| `/api/v1/stores/*/inventory/**` | Inventory |
| `/api/v1/stores/*/sales/**` | Sales |
| `/api/v1/stores/*/refunds/**` | Refunds |
| `/api/v1/notifications/**` | Notifications & approvals |
| `/api/v1/stores/*/approvals/**` | Notifications & approvals |
| `/api/v1/stores/*/reports/**` | Reporting |

---

## Subscription plans

New accounts receive a **starter** plan (1 store) by default. Creating more stores than the plan allows returns HTTP **402** with code `UPGRADE_REQUIRED`. Platform admins assign plans from the **Accounts** screen in the admin UI.

| Plan | Max stores | Max users |
|------|------------|-----------|
| starter | 1 | 5 |
| business | 5 | 25 |
| enterprise | 50 | 500 |

---

## CI pipeline

GitHub Actions runs on every push and pull request:

1. `mvn test` — Java unit tests  
2. `web-client` — `npm ci && npm run build`  
3. `mobile-client` — TypeScript check  
4. `docker compose config` — validate Compose file  
5. Smoke test — all health routes  
6. E2E test — full business flow  

Local escape hatch (not used in CI): `SMOKE_TEST_MODE=mock` skips live checks in smoke scripts.

---

## Further reading

- **[docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)** — extended setup, env vars, troubleshooting  
- **[docs/architecture.md](docs/architecture.md)** — service boundaries, Kafka, shared contracts  
- **[docs/definition-of-done.md](docs/definition-of-done.md)** — milestone acceptance criteria  

---

## License

See repository license file if present. Default credentials and JWT secrets in `.env.example` are for **local development only** — change them before any production deployment.
