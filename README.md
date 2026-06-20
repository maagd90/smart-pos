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
| **Store manager** | Configures store settings, refund policy, and report delivery; receives approval notifications (deal + inventory) via mobile app or web shortcut |
| **Cashier / staff** | (Future UI) Runs POS and day-to-day store operations — APIs exist today |

### What you get in this repository

| Layer | Description |
|-------|-------------|
| **Backend** | 12 Spring Boot microservices + API gateway + service discovery |
| **Admin web UI** | React app at `web-client/` — login, platform console, account onboarding, store config, PWA approvals inbox |
| **Mobile app** | React Native / Expo app in `mobile-client/` — store manager login, push notifications, approvals inbox |
| **Notifications** | `notifications-approvals-service` — Kafka-driven inbox, Expo push, SMTP email with one-click actions |
| **Infrastructure** | Docker Compose stack: PostgreSQL, Kafka, Redis, Eureka |
| **Tests & CI** | Unit tests, health smoke tests, e2e business flow, notifications wiring smoke test |

### What is not included yet

- Live payment processing, WhatsApp, or LLM integrations (interfaces exist; providers are stubbed)
- Full POS / inventory operational screens in the admin UI (nav shows “Coming soon”; APIs work)
- Offline mobile sync or offline approval queue
- Production SMTP / push credentials (local dev uses MailHog-compatible defaults on port 1025)

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
10. Assign a user the **store manager** role with `deal.approve` and/or `inventory.change.approve` (see [Step 9](#step-9--store-manager-notifications-mobile-app-or-web-shortcut))

The developer API test dashboard is still available at http://localhost:3000/dev (for engineers testing raw API flows).

### Admin web UI routes

| Route | Who can access | Purpose |
|-------|----------------|---------|
| `/login` | Everyone | Sign in |
| `/platform/accounts` | Platform admin | Create accounts, assign plans |
| `/platform/ai-keys` | Platform admin | Rotate AI keys |
| `/account/stores` | Account owner (`stores.manage`) | Create and list stores |
| `/account/users` | Account owner (`users.manage`) | Invite users |
| `/account/roles` | Account owner (`users.manage`) | Assign roles per store |
| `/store/settings` | Store manager | Branch configuration |
| `/store/refund-policy` | Store manager | Refund rules |
| `/store/report-settings` | Store manager | Report delivery settings |
| `/manager/notifications` | Store manager with approval permissions | Pending approvals inbox (PWA-friendly) |
| `/dev` | Authenticated users | Scripted API smoke dashboard |

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

When a **deal proposal** or **inventory change request** needs manager approval, the platform publishes a Kafka event. The notifications service creates one inbox row per eligible recipient and delivers alerts over push, email, and/or the web/mobile inbox. Managers can **Accept** or **Reject** from any channel.

#### Who receives notifications?

Users assigned to the store with these permissions (included on the **store manager** role by default):

| Permission | Triggers notifications for |
|------------|----------------------------|
| `deal.approve` | AI deal proposals awaiting approval |
| `inventory.change.approve` | Inventory adjustment requests |

Assign roles at **Account → Role Assignment** in the admin UI, or via the identity API.

#### Choose one install option per phone

| Option | How to install | How alerts arrive |
|--------|----------------|-------------------|
| **Native mobile app** | Run the Expo app (see below) on iOS/Android | Expo push notifications over the network |
| **Web shortcut (PWA)** | Open the admin web UI on your phone → Share → **Add to Home Screen** (iOS) or **Install app** (Chrome/Android) | Browser notifications + 30s polling when online |

Both options share the same inbox API (`/api/v1/notifications`) and the same Accept/Reject actions. The PWA shortcut opens at `/manager/notifications`.

**Email (all managers):** Every new notification also sends an email with secure Accept/Reject links. Email links open a confirmation page in the browser (prefetch-safe — opening the link alone does not approve).

**Network required:** Push, email, polling, and inbox actions all need connectivity to the API gateway.

#### Option A — Native mobile app (Expo)

From the project root, in a new terminal:

```bash
cd mobile-client
npm ci
npx expo start
```

- Scan the QR code with **Expo Go** (development), or build a standalone app for production push.
- Sign in with a store manager account that has approval permissions.
- Allow notification permissions when prompted — the app registers an Expo push token with `POST /api/v1/notifications/devices`.
- Pending items appear in the inbox; tap **Accept** or **Reject**.

Point the app at your gateway (required on a physical device — `localhost` will not work):

```bash
EXPO_PUBLIC_API_BASE_URL=http://<your-lan-ip>:8080 npx expo start
```

#### Option B — Web shortcut (PWA)

1. Ensure the web UI is running (`cd web-client && npm run dev`) and reachable from your phone on the same network (use your machine’s LAN IP instead of `localhost` if needed).
2. Sign in as a store manager with approval permissions.
3. Open **Approvals** in the sidebar (or go to `/manager/notifications`).
4. Allow browser notifications when prompted.
5. Install to home screen:
   - **iOS Safari:** Share → Add to Home Screen
   - **Android Chrome:** Menu → Install app / Add to Home screen

The PWA manifest (`web-client/public/manifest.webmanifest`) sets `start_url` to `/manager/notifications` so the shortcut opens directly to the inbox.

#### Verify notification wiring (optional)

With the full Docker stack running:

```bash
./scripts/notifications-smoke-test.sh
```

This confirms the gateway routes public email action links and returns prefetch-safe HTML for invalid tokens.

#### No duplicate notifications

Each approval event creates **at most one inbox row per recipient**:

1. **Database** — unique constraint on `(kind, ref_type, ref_id, recipient_user_id)`
2. **Service** — skips insert when a row already exists; catches concurrent Kafka replays via `DataIntegrityViolationException` (no second push or email)
3. **Web PWA** — browser `Notification` tag = notification id; seen IDs stored in `localStorage`
4. **Decisions** — Accept/Reject is idempotent; repeating the same decision returns “already decided”

---

## Store manager notifications — technical reference

This section documents the backend and API surface added in the notifications milestone.

### Event flow

```
ai-deals-service          inventory-service
       │                          │
       │  deal.pending_approval     │  inventory.change.requested
       └──────────┬─────────────────┘
                  ▼
         Kafka (domain events)
                  ▼
    notifications-approvals-service
         │         │         │
         ▼         ▼         ▼
    Expo push   SMTP     Inbox API
    (mobile)   (email)  (web + mobile)
                  │
                  ▼
         Accept / Reject
                  │
       ┌──────────┴──────────┐
       ▼                     ▼
 ai-deals-service    inventory-service
 (accept/reject deal) (approve/reject change)
```

### Notification kinds

| Kind | Kafka event | Owning service action |
|------|-------------|------------------------|
| `DEAL_APPROVAL` | `deal.pending_approval` | `POST /api/v1/stores/{storeId}/deals/{id}/accept` or `/reject` |
| `INVENTORY_CHANGE_APPROVAL` | `inventory.change.requested` | `POST /api/v1/stores/{storeId}/change-requests/{id}/approve` or `/reject` |

### Notifications API (authenticated)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/notifications?status=PENDING` | List inbox for current user |
| `GET` | `/api/v1/notifications/{id}` | Notification detail |
| `POST` | `/api/v1/notifications/{id}/decide` | Body: `{ "decision": "ACCEPT" \| "REJECT", "via": "MOBILE" \| "WEB" }` |
| `POST` | `/api/v1/notifications/devices` | Register Expo push token |
| `DELETE` | `/api/v1/notifications/devices/{expoPushToken}` | Unregister device |

### Email action links (public, no JWT)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/notifications/actions/{token}` | HTML confirmation page (prefetch-safe — no mutation) |
| `POST` | `/api/v1/notifications/actions/{token}/confirm` | Execute Accept/Reject from email |

These routes are allowlisted in the gateway security config (no bearer token required).

### Related owning-service APIs

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/stores/{storeId}/deals` | Create pending deal (requires `deal.create`) |
| `POST` | `/api/v1/stores/{storeId}/deals/{id}/accept` | Approve deal |
| `POST` | `/api/v1/stores/{storeId}/deals/{id}/reject` | Reject deal |
| `POST` | `/api/v1/stores/{storeId}/change-requests` | Submit inventory change request |
| `POST` | `/api/v1/stores/{storeId}/change-requests/{id}/approve` | Approve change |
| `POST` | `/api/v1/stores/{storeId}/change-requests/{id}/reject` | Reject change |

### Configuration (notifications-approvals-service)

Set in Docker Compose / `.env` (defaults work for local dev with MailHog on port 1025):

| Variable | Default | Purpose |
|----------|---------|---------|
| `PUBLIC_BASE_URL` | `http://localhost:8080` | Base URL in email action links |
| `NOTIFICATION_TTL_DAYS` | `7` | Days until pending notifications expire |
| `NOTIFICATIONS_MAIL_FROM` | `noreply@smartpos.local` | From address for approval emails |
| `SMTP_HOST` | `localhost` | SMTP server |
| `SMTP_PORT` | `1025` | SMTP port (MailHog/Mailpit compatible) |
| `SMTP_AUTH` | `false` | Enable SMTP authentication |
| `EXPO_PUSH_URL` | `https://exp.host/--/api/v2/push/send` | Expo push API endpoint |
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:29092` | Kafka broker |

### Key source locations

| Area | Path |
|------|------|
| Notifications service | `services/notifications-approvals-service/` |
| Kafka consumers | `consumer/DealPendingApprovalConsumer.java`, `consumer/InventoryChangeRequestedConsumer.java` |
| Push + email delivery | `service/ExpoPushDeliveryService.java`, `service/EmailDeliveryService.java` |
| Dedup logic | `service/NotificationService.java`, migration `V2__notifications.sql` |
| Mobile inbox | `mobile-client/src/features/notifications/` |
| Web PWA + inbox | `web-client/public/manifest.webmanifest`, `web-client/src/pages/manager/NotificationsPage.tsx` |
| Approval permissions | `services/identity-access-service/.../V8__approval_permissions.sql` |
| Smoke test | `scripts/notifications-smoke-test.sh` |

---

## Quick reference (experienced developers)

```bash
cp .env.example .env
./scripts/compose-up-ci.sh
./scripts/smoke-test.sh
./scripts/e2e-smoke-test.sh
./scripts/notifications-smoke-test.sh
cd web-client && npm ci && npm run dev
cd mobile-client && npm ci && npx expo start
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
| Mobile app cannot log in | Set `EXPO_PUBLIC_API_BASE_URL` to your LAN IP gateway URL (not `localhost`) on a physical device |
| No push on mobile | Allow notification permission; confirm device registered via `POST /api/v1/notifications/devices` |
| No browser alerts (PWA) | Allow notifications in browser settings; keep `/manager/notifications` open or installed as shortcut |
| Approval emails not arriving | Check SMTP settings; local stack expects MailHog/Mailpit on port 1025 |
| Duplicate notification concerns | See [No duplicate notifications](#no-duplicate-notifications) — DB constraint + service skip + client dedup |

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
- **Asynchronous:** Kafka domain events (inventory updates, deal approvals, inventory change requests, outbox pattern)

**Notifications path:** owning services publish approval events → `notifications-approvals-service` consumes Kafka → creates deduplicated inbox rows → delivers Expo push + email + serves inbox/decide APIs → on decision, calls back to ai-deals or inventory service.

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
| `/api/v1/stores/*/change-requests/**` | Inventory change requests |
| `/api/v1/stores/*/sales/**` | Sales |
| `/api/v1/stores/*/refunds/**` | Refunds |
| `/api/v1/stores/*/exchanges/**` | Refunds (exchanges) |
| `/api/v1/stores/*/deals/**` | AI deals |
| `/api/v1/deals/**` | AI deals |
| `/api/v1/notifications/**` | Notifications & approvals (inbox, devices, email actions) |
| `/api/v1/stores/*/approvals/**` | Notifications & approvals |
| `/api/v1/stores/*/notifications/**` | Notifications & approvals |
| `/api/v1/stores/*/messages/**` | Messaging (stub) |
| `/api/v1/stores/*/reports/**` | Reporting |
| `/api/v1/stores/*/report-settings/**` | Report settings |
| `/api/v1/stores/*/expenses/**` | Reporting (expenses) |
| `/api/v1/platform/health/**` | Per-service health probes |

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

1. `mvn test` — Java unit tests (includes notifications dedup tests)  
2. `web-client` — `npm ci && npm run build` (includes PWA manifest + approvals page)  
3. `mobile-client` — TypeScript check (notifications inbox + push registration)  
4. `docker compose config` — validate Compose file  
5. Smoke test — all health routes  
6. E2E test — full business flow  

Run `./scripts/notifications-smoke-test.sh` locally after `./scripts/compose-up-ci.sh` to verify notification action route wiring.

Local escape hatch (not used in CI): `SMOKE_TEST_MODE=mock` skips live checks in smoke scripts.

---

## Further reading

- **[docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)** — extended setup, env vars, troubleshooting  
- **[docs/architecture.md](docs/architecture.md)** — service boundaries, Kafka, shared contracts  
- **[docs/definition-of-done.md](docs/definition-of-done.md)** — milestone acceptance criteria  

---

## License

See repository license file if present. Default credentials and JWT secrets in `.env.example` are for **local development only** — change them before any production deployment.
