# Smart POS — Setup Guide

Complete installation instructions for development and production environments.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Method 1: Docker (Recommended)](#method-1-docker-recommended)
- [Method 2: Manual Installation](#method-2-manual-installation)
- [Database Setup with Prisma](#database-setup-with-prisma)
- [Seeding the Database](#seeding-the-database)
- [Environment Variables Reference](#environment-variables-reference)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Docker Method

| Tool | Minimum Version | Install |
|------|----------------|---------|
| Docker | 24.x | https://docs.docker.com/get-docker/ |
| Docker Compose | 2.x (plugin) | Bundled with Docker Desktop |

### Manual Method

| Tool | Minimum Version | Install |
|------|----------------|---------|
| Node.js | 18.x LTS | https://nodejs.org |
| npm | 9.x | Bundled with Node.js |
| PostgreSQL | 15.x | https://www.postgresql.org/download/ |
| Redis | 7.x | https://redis.io/docs/install/ |

---

## Method 1: Docker (Recommended)

This method starts the entire stack (PostgreSQL, Redis, Backend, Frontend) with a single command.

### Step 1 — Clone and configure

```bash
git clone <repo-url> smart-pos
cd smart-pos

# Create backend environment file
cp backend/.env.example backend/.env
```

Open `backend/.env` in a text editor. The defaults work out of the box for Docker.
To enable AI features, add your `OPENAI_API_KEY` (or configure Ollama — see [OLLAMA_SETUP.md](./OLLAMA_SETUP.md)).

### Step 2 — Build and start

```bash
docker compose up -d
```

This builds the frontend and backend images, then starts:
- **PostgreSQL** on port `5432`
- **Redis** on port `6379`
- **Backend API** on port `3001`
- **Frontend** on port `3000`

Wait about 30 seconds for all containers to become healthy.

```bash
# Check container health
docker compose ps

# Stream logs
docker compose logs -f backend
```

### Step 3 — Migrate and seed

```bash
# Apply database migrations
docker compose exec backend npx prisma migrate deploy

# Seed with sample data and default users
docker compose exec backend npm run seed
```

### Step 4 — Access the application

Open **http://localhost:3000** in your browser.

Login with `admin@shop.com` / `password123`.

### Stopping and restarting

```bash
# Stop all containers (data is preserved in volumes)
docker compose down

# Stop and remove all data (fresh start)
docker compose down -v

# Restart after changes to source code
docker compose up -d --build
```

---

## Method 2: Manual Installation

### Step 1 — Set up PostgreSQL

```bash
# Create database and user
psql -U postgres -c "CREATE USER smartpos WITH PASSWORD 'smartpos';"
psql -U postgres -c "CREATE DATABASE smartpos OWNER smartpos;"
```

Verify the connection string: `postgresql://smartpos:smartpos@localhost:5432/smartpos`

### Step 2 — Start Redis

```bash
# macOS (Homebrew)
brew services start redis

# Ubuntu / Debian
sudo systemctl start redis-server

# Verify
redis-cli ping   # Should return PONG
```

### Step 3 — Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set at minimum:

```env
DATABASE_URL=postgresql://smartpos:smartpos@localhost:5432/smartpos
JWT_SECRET=any-long-random-string-at-least-32-chars
```

### Step 4 — Install backend dependencies

```bash
cd backend
npm install
```

### Step 5 — Set up the database with Prisma

See the [Database Setup with Prisma](#database-setup-with-prisma) section below.

### Step 6 — Start the backend

```bash
# Development mode (hot reload)
npm run dev

# Production mode
npm run build && npm start
```

The API server starts on **http://localhost:3001**.

### Step 7 — Install and start the frontend

```bash
cd ../frontend
npm install

# Development mode
npm start

# Production build
npm run build
npx serve -s build -l 3000
```

The frontend starts on **http://localhost:3000**.

---

## Database Setup with Prisma

The Prisma schema lives at `backend/src/db/schema.prisma`.

### Running migrations (development)

```bash
cd backend

# Create and apply a new migration
npx prisma migrate dev --name init

# This also runs prisma generate automatically
```

### Running migrations (production / Docker)

```bash
# Apply all pending migrations without creating new ones
npx prisma migrate deploy

# Then generate the Prisma client
npx prisma generate
```

### Viewing the database

```bash
# Open Prisma Studio (visual database browser)
npx prisma studio
# Opens at http://localhost:5555
```

### Resetting the database

```bash
# ⚠️ Destroys all data — development only
npx prisma migrate reset
```

### Regenerating the Prisma client after schema changes

```bash
npx prisma generate
```

---

## Seeding the Database

The seed script (`backend/src/db/seed.ts`) creates:

- **4 default users** (Owner, Manager, Cashier, Analyst)
- **Sample products** across multiple categories
- **Sample customers** with loyalty points and history
- **Default application settings**

```bash
cd backend
npm run seed
```

Expected output:
```
Seeding database...
✓ Created users
✓ Created products
✓ Created customers
✓ Created settings
Seed complete.
```

### Re-running the seed

The seed script is idempotent for users and settings (uses upsert), but will add duplicate products/customers on subsequent runs. To start fresh:

```bash
npx prisma migrate reset   # Wipes data and re-runs migrations
npm run seed
```

---

## Environment Variables Reference

Full list of supported environment variables for `backend/.env`:

```env
# ── Required ────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://USER:PASS@HOST:5432/DBNAME
JWT_SECRET=minimum-32-character-secret-key

# ── Server ──────────────────────────────────────────────────────────────
PORT=3001                          # Backend port (default: 3001)
NODE_ENV=development               # development | production
FRONTEND_URL=http://localhost:3000 # CORS allowed origin

# ── Redis ───────────────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379   # Omit to use in-memory cache only

# ── JWT ─────────────────────────────────────────────────────────────────
JWT_EXPIRES_IN=7d                  # Token expiry (e.g. 1d, 7d, 30d)

# ── AI — OpenAI ─────────────────────────────────────────────────────────
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo         # gpt-3.5-turbo | gpt-4 | gpt-4-turbo

# ── AI — Ollama (local, free) ───────────────────────────────────────────
USE_OLLAMA=false                   # Set to true to use Ollama instead
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# ── AI Cache ────────────────────────────────────────────────────────────
AI_CACHE_TTL=86400                 # Seconds to cache AI results (default: 24h)

# ── Messaging — Twilio ──────────────────────────────────────────────────
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+15551234567   # SMS from number
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # WhatsApp Business number

# ── Messaging — SendGrid ────────────────────────────────────────────────
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@yourshop.com
SENDGRID_FROM_NAME=Your Shop

# ── Messaging Limits ────────────────────────────────────────────────────
MAX_MESSAGES_PER_MONTH=4           # Max messages per customer per month
MESSAGE_GAP_DAYS=7                 # Minimum days between messages to same customer

# ── Loyalty Programme ───────────────────────────────────────────────────
# These are code constants in constants.ts, not env vars:
# LOYALTY_POINTS_PER_DOLLAR=1
# LOYALTY_REDEEM_RATE=0.01 (1 point = $0.01)
```

---

## Troubleshooting

### `DATABASE_URL` connection refused

```
Error: P1001: Can't reach database server at localhost:5432
```

**Fix:** Make sure PostgreSQL is running.
- Docker: `docker compose ps` — check that `postgres` service is healthy.
- Manual: `sudo systemctl status postgresql` (Linux) or `brew services info postgresql` (macOS).

---

### `JWT_SECRET must be set in production`

**Fix:** Set `JWT_SECRET` in your `.env` file. In development `changeme-dev-only` is used automatically, but production requires an explicit value.

---

### Prisma migration error: `migration failed to apply cleanly`

```bash
# Reset shadow database (dev only)
npx prisma migrate reset
npm run seed
```

---

### Port 3001 or 3000 already in use

```bash
# Find and kill the process using the port
lsof -ti:3001 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

Or change the port in `.env`:
```env
PORT=3002
```
And update the frontend's `REACT_APP_API_URL` to match.

---

### `npm run seed` fails with unique constraint

The seed ran before and left partial data. Reset:

```bash
npx prisma migrate reset --skip-seed
npm run seed
```

---

### AI endpoint returns empty results

1. Check that `OPENAI_API_KEY` is set and valid: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`
2. Or switch to Ollama: set `USE_OLLAMA=true` — see [OLLAMA_SETUP.md](./OLLAMA_SETUP.md).
3. Check the AI cache: a cached empty result will keep returning empty for 24 hours. Clear it:
   ```bash
   # Via Prisma Studio
   npx prisma studio   # Delete all rows from ai_cache table
   ```

---

### Frontend shows "Network Error" / cannot reach API

Ensure `REACT_APP_API_URL` in the frontend environment matches the running backend:

```env
# frontend/.env (or frontend/.env.local)
REACT_APP_API_URL=http://localhost:3001
REACT_APP_SOCKET_URL=http://localhost:3001
```

For Docker, these are set in the root `docker-compose.yml`.

---

### Docker build fails with out-of-memory error

Increase Docker Desktop memory limit to at least 4 GB:
**Settings → Resources → Memory → 4096 MB**.
