<div align="center">

# 🛒 Smart POS System

[![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docs.docker.com/compose)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

**A full-featured, AI-powered Point of Sale system with real-time inventory, customer management, WhatsApp/SMS messaging, and analytics.**

[Quick Start](#-quick-start-docker) • [Manual Setup](#-manual-installation) • [API Docs](#-api-documentation) • [Troubleshooting](#-troubleshooting)

</div>

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Architecture](#-architecture)
3. [Features](#-features)
4. [Quick Start (Docker)](#-quick-start-docker)
5. [Manual Installation](#-manual-installation)
6. [Environment Configuration](#-environment-configuration)
7. [Feature Flags Guide](#-feature-flags-guide)
8. [Local LLM Setup (Ollama)](#-local-llm-setup-ollama)
9. [API Documentation](#-api-documentation)
10. [Role-Based Access Control](#-role-based-access-control)
11. [WhatsApp & SMS Setup](#-whatsapp--sms-setup)
12. [Development Guide](#-development-guide)
13. [Deployment Guide](#-deployment-guide)
14. [Troubleshooting](#-troubleshooting)

---

## 🎯 Project Overview

Smart POS is a modern, extensible point-of-sale platform built with a **Node.js/Express/TypeScript** backend and a **React/Vite/Tailwind** frontend. It is designed for small-to-medium retail businesses that want:

- A fast, touch-friendly cashier interface
- Real-time inventory tracking with low-stock alerts
- Customer loyalty management with segmentation (VIP, Regular, Inactive, New)
- AI-powered demand forecasting, price suggestions, and product recommendations
- Omnichannel messaging (WhatsApp, SMS) for promotions and receipts
- Full audit logging and role-based access control
- A pluggable LLM backend (OpenAI **or** self-hosted Ollama — no cloud required)

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                           │
│              React 18 + Vite + Tailwind CSS + Zustand           │
│   ┌──────────┬──────────┬──────────┬───────────┬─────────────┐  │
│   │  POS     │Inventory │Customers │ Analytics │   Admin     │  │
│   │  Page    │  Page    │  Page    │   Page    │  Dashboard  │  │
│   └──────────┴──────────┴──────────┴───────────┴─────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/REST + WebSocket (Socket.IO)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express API  :3000                            │
│              Node.js 20 + TypeScript + Prisma ORM               │
│  ┌────────┬──────────┬──────────┬──────────┬──────────────────┐ │
│  │  Auth  │   POS    │Inventory │Customers │  AI / Messaging  │ │
│  │ Routes │  Routes  │  Routes  │  Routes  │     Routes       │ │
│  └────────┴──────────┴──────────┴──────────┴──────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Middleware Stack                              │  │
│  │  helmet · cors · rate-limit · jwt-auth · morgan · winston  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────┬──────────────────┬───────────────────────────────────┘
           │                  │
           ▼                  ▼
┌──────────────────┐  ┌────────────────────────────────────────┐
│  PostgreSQL 15   │  │          External Services             │
│  (Prisma ORM)    │  │  ┌─────────────┐  ┌─────────────────┐ │
│                  │  │  │  OpenAI API │  │  Twilio API     │ │
│  • users         │  │  │   or        │  │  • WhatsApp     │ │
│  • products      │  │  │  Ollama LLM │  │  • SMS          │ │
│  • inventory     │  │  │  (local)    │  └─────────────────┘ │
│  • customers     │  │  └─────────────┘                      │
│  • transactions  │  └────────────────────────────────────────┘
│  • messages      │
│  • ai_analytics  │
│  • audit_logs    │
│  • settings      │
└──────────────────┘
```

---

## ✨ Features

| Category | Features |
|---|---|
| **Point of Sale** | Barcode scanning, cart management, discounts, multiple payment methods (Cash/Card/Digital), receipt generation, refunds |
| **Inventory** | Product CRUD, real-time stock tracking, low-stock alerts, reorder points, batch/expiry tracking |
| **Customers** | Customer profiles, loyalty points, purchase history, automatic segmentation (VIP/Regular/Inactive/New) |
| **Analytics** | Sales reports, inventory reports, revenue charts, cashier performance |
| **AI Features** | Demand forecasting, product recommendations per customer, dynamic pricing suggestions, trend analysis |
| **Messaging** | WhatsApp & SMS campaigns via Twilio, message history, campaign builder |
| **Admin** | User management, role assignment, system settings, full audit trail |
| **Security** | JWT authentication, bcrypt passwords, rate limiting, helmet headers, RBAC |
| **Real-time** | WebSocket (Socket.IO) for live inventory and transaction updates |

---

## 🚀 Quick Start (Docker)

> **Prerequisites:** [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed.

### Step 1 — Clone and configure

```bash
git clone https://github.com/your-org/smart-pos.git
cd smart-pos
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET and ADMIN_SECRET_KEY
```

### Step 2 — Start all services

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** on port `5432`
- **Backend API** on port `3000` (runs migrations automatically on first boot)
- **Frontend** on port `5173` (served via nginx)

### Step 3 — Seed sample data and open the app

```bash
# Seed the database with demo products, users, and customers
docker-compose exec backend npx ts-node prisma/seed.ts

# Open in browser
open http://localhost:5173
```

**Default credentials after seeding:**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@smartpos.com` | `admin123` |
| Manager | `manager@smartpos.com` | `manager123` |
| Cashier | `cashier@smartpos.com` | `cashier123` |

> ⚠️ Change all passwords immediately in a production deployment.

---

## 🔧 Manual Installation

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 20 |
| npm | ≥ 10 |
| PostgreSQL | ≥ 15 |

### 1. Clone the repository

```bash
git clone https://github.com/your-org/smart-pos.git
cd smart-pos
```

### 2. Set up the backend

```bash
cd backend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and other values

# Run database migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed with sample data (optional)
npm run db:seed

# Start development server
npm run dev
```

The API will be available at `http://localhost:3000`.

### 3. Set up the frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` in the project root (for Docker) and/or in `backend/` (for manual setup).

### Core Settings

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Backend HTTP port |
| `NODE_ENV` | `development` | `development` \| `production` |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_SECRET` | — | **Required.** Secret for signing JWTs. Use a long random string. |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime (e.g. `1h`, `7d`, `30d`) |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin |
| `ADMIN_PORTAL_ENABLED` | `true` | Enable/disable the admin portal |
| `ADMIN_SECRET_KEY` | — | Extra secret for admin bootstrap operations |

### Database URL Format

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

Example:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/smartpos
```

### Feature Flags

| Variable | Default | Description |
|---|---|---|
| `AI_ENABLED` | `false` | Enable AI features (forecasting, recommendations, pricing) |
| `WHATSAPP_ENABLED` | `false` | Enable WhatsApp messaging via Twilio |
| `SMS_ENABLED` | `false` | Enable SMS messaging via Twilio |
| `EMAIL_ENABLED` | `false` | Enable email notifications |
| `DYNAMIC_PRICING_ENABLED` | `false` | Enable AI-driven price suggestions |
| `INVENTORY_FORECASTING_ENABLED` | `false` | Enable AI inventory demand forecasting |

### LLM Configuration

| Variable | Default | Description |
|---|---|---|
| `LLM_TYPE` | `openai` | `openai` or `ollama` |
| `OPENAI_API_KEY` | — | Your OpenAI API key (required if `LLM_TYPE=openai`) |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL (required if `LLM_TYPE=ollama`) |
| `OLLAMA_MODEL` | `llama2` | Model name to use with Ollama |

### Twilio / Messaging

| Variable | Description |
|---|---|
| `TWILIO_ACCOUNT_SID` | Twilio Account SID (from twilio.com/console) |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_WHATSAPP_NUMBER` | Your Twilio WhatsApp sender (e.g. `whatsapp:+14155238886`) |
| `TWILIO_SMS_FROM` | Your Twilio SMS number (e.g. `+14155238886`) |

---

## 🚩 Feature Flags Guide

All features are **off by default**. Enable only what you need to keep the system lean.

### Enabling AI Features

```bash
# In .env
AI_ENABLED=true
DYNAMIC_PRICING_ENABLED=true
INVENTORY_FORECASTING_ENABLED=true

# Choose your LLM provider (see Local LLM Setup below for Ollama)
LLM_TYPE=openai
OPENAI_API_KEY=sk-...
```

Once enabled, the following endpoints become active:
- `POST /api/v1/ai/demand-forecast`
- `POST /api/v1/ai/recommendations/:customerId`
- `POST /api/v1/ai/price-suggestions`
- `GET  /api/v1/ai/insights`

### Enabling WhatsApp / SMS

```bash
AI_ENABLED=true      # not required, but messaging uses the AI pipeline
WHATSAPP_ENABLED=true
SMS_ENABLED=true

TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_SMS_FROM=+14155238886
```

---

## 🤖 Local LLM Setup (Ollama)

Run AI features **completely offline** with [Ollama](https://ollama.ai) — no OpenAI account needed.

### 1. Install Ollama

```bash
# macOS / Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows: download the installer from https://ollama.ai
```

### 2. Pull a model

```bash
# Lightweight and fast (recommended for dev)
ollama pull llama2

# More capable alternatives
ollama pull mistral
ollama pull codellama
ollama pull phi
```

### 3. Configure Smart POS

```bash
# In .env
AI_ENABLED=true
LLM_TYPE=ollama
OLLAMA_BASE_URL=http://localhost:11434   # use http://host.docker.internal:11434 inside Docker
OLLAMA_MODEL=llama2
```

### 4. Verify the connection

```bash
curl http://localhost:11434/api/tags
# Should list your installed models
```

> **Docker note:** When running inside Docker Compose, use `OLLAMA_BASE_URL=http://host.docker.internal:11434` to reach Ollama running on your host machine. This value is already set as the default in `docker-compose.yml`.

---

## 📚 API Documentation

All endpoints are prefixed with `/api/v1`.

### Health Check

```
GET /api/v1/health
```

```json
{ "success": true, "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```

---

### 🔐 Authentication (`/api/v1/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/login` | ❌ | Login and receive a JWT |
| `POST` | `/register` | ❌ | Register a new user account |
| `POST` | `/logout` | ✅ | Invalidate current session |
| `GET` | `/me` | ✅ | Get current user profile |

**Login request:**
```json
{
  "email": "cashier@smartpos.com",
  "password": "cashier123"
}
```

**Login response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": "...", "name": "...", "email": "...", "role": "CASHIER" }
  }
}
```

Include the token in subsequent requests:
```
Authorization: Bearer <token>
```

---

### 🧾 POS / Transactions (`/api/v1/pos`)

| Method | Path | Roles | Description |
|---|---|---|---|
| `GET` | `/transactions` | All | List transactions (paginated) |
| `POST` | `/transactions` | CASHIER+ | Create a new transaction |
| `GET` | `/transactions/:id` | All | Get transaction details |
| `POST` | `/transactions/:id/refund` | MANAGER+ | Refund a transaction |
| `GET` | `/receipt/:id` | All | Get printable receipt |

**Create transaction:**
```json
{
  "customerId": "optional-customer-uuid",
  "paymentMethod": "CASH",
  "items": [
    { "productId": "uuid", "quantity": 2, "discount": 0 }
  ],
  "discount": 0
}
```

---

### 📦 Inventory (`/api/v1/inventory`)

| Method | Path | Roles | Description |
|---|---|---|---|
| `GET` | `/products` | All | List all products |
| `POST` | `/products` | MANAGER+ | Create a product |
| `GET` | `/products/:id` | All | Get product details |
| `PUT` | `/products/:id` | MANAGER+ | Update a product |
| `DELETE` | `/products/:id` | ADMIN | Delete a product |
| `GET` | `/alerts` | All | Get low-stock alerts |
| `PUT` | `/stock/:productId` | MANAGER+ | Update stock quantity |

---

### 👥 Customers (`/api/v1/customers`)

| Method | Path | Roles | Description |
|---|---|---|---|
| `GET` | `/` | All | List customers |
| `POST` | `/` | CASHIER+ | Create a customer |
| `GET` | `/:id` | All | Get customer details |
| `PUT` | `/:id` | MANAGER+ | Update a customer |
| `GET` | `/:id/transactions` | All | Customer purchase history |
| `GET` | `/:id/messages` | All | Customer message history |

---

### 🤖 AI (`/api/v1/ai`) — requires `AI_ENABLED=true`

| Method | Path | Roles | Description |
|---|---|---|---|
| `POST` | `/demand-forecast` | MANAGER+ | Forecast demand for products |
| `POST` | `/recommendations/:customerId` | MANAGER+ | Personalised product recommendations |
| `POST` | `/price-suggestions` | MANAGER+ | AI-suggested pricing |
| `GET` | `/insights` | MANAGER+ | Latest AI analytics insights |

---

### 📨 Messaging (`/api/v1/messaging`) — requires WHATSAPP/SMS enabled

| Method | Path | Roles | Description |
|---|---|---|---|
| `POST` | `/send` | MANAGER+ | Send a message to a customer |
| `GET` | `/campaigns` | MANAGER+ | List all campaigns |
| `POST` | `/campaigns` | MANAGER+ | Create a new campaign |
| `GET` | `/history` | MANAGER+ | View message history |

---

### 🛠 Admin (`/api/v1/admin`)

| Method | Path | Roles | Description |
|---|---|---|---|
| `GET` | `/dashboard` | MANAGER+ | Admin dashboard stats |
| `GET` | `/customers` | MANAGER+ | All customers with full details |
| `GET` | `/users` | ADMIN | List all users |
| `POST` | `/users` | ADMIN | Create a user |
| `PUT` | `/users/:id` | ADMIN | Update a user |
| `GET` | `/reports/sales` | MANAGER+ | Sales report |
| `GET` | `/reports/inventory` | MANAGER+ | Inventory report |

---

### ⚙️ Settings (`/api/v1/settings`)

| Method | Path | Roles | Description |
|---|---|---|---|
| `GET` | `/` | All | Get system settings |
| `PUT` | `/` | ADMIN | Update system settings |

---

## 🔑 Role-Based Access Control

The system uses four roles with escalating privileges:

```
CASHIER  ──►  MANAGER  ──►  ANALYST  ──►  ADMIN
```

| Permission | CASHIER | MANAGER | ANALYST | ADMIN |
|---|:---:|:---:|:---:|:---:|
| Create transactions | ✅ | ✅ | ❌ | ✅ |
| View transactions | ✅ | ✅ | ✅ | ✅ |
| Refund transactions | ❌ | ✅ | ❌ | ✅ |
| View products | ✅ | ✅ | ✅ | ✅ |
| Create / edit products | ❌ | ✅ | ❌ | ✅ |
| Delete products | ❌ | ❌ | ❌ | ✅ |
| Update stock | ❌ | ✅ | ❌ | ✅ |
| Create customers | ✅ | ✅ | ❌ | ✅ |
| Edit customers | ❌ | ✅ | ❌ | ✅ |
| View analytics / AI | ❌ | ✅ | ✅ | ✅ |
| Send messages / campaigns | ❌ | ✅ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ |
| System settings | ❌ | ❌ | ❌ | ✅ |

### Assigning roles

Roles are set at user creation by an ADMIN via `POST /api/v1/admin/users`:

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "secure-password",
  "role": "MANAGER"
}
```

---

## 💬 WhatsApp & SMS Setup

### 1. Create a Twilio account

1. Sign up at [twilio.com](https://www.twilio.com)
2. Go to **Console → Account Info** and note your **Account SID** and **Auth Token**

### 2. Set up WhatsApp Sandbox (development)

1. In the Twilio Console, go to **Messaging → Try it out → Send a WhatsApp message**
2. Follow the sandbox activation instructions (send a join code from your phone)
3. Use `whatsapp:+14155238886` as `TWILIO_WHATSAPP_NUMBER` during development

### 3. Set up SMS

1. In the Twilio Console, buy a phone number with SMS capability
2. Use that number as `TWILIO_SMS_FROM`

### 4. Update your `.env`

```bash
WHATSAPP_ENABLED=true
SMS_ENABLED=true

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_SMS_FROM=+15017122661
```

### 5. Test a message

```bash
curl -X POST http://localhost:3000/api/v1/messaging/send \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "<customer-uuid>",
    "channel": "WHATSAPP",
    "content": "Hello! Your loyalty points balance is 120. 🎉"
  }'
```

---

## 🛠 Development Guide

### Project structure

```
smart-pos/
├── backend/
│   ├── src/
│   │   ├── config/          # App configuration and feature flags
│   │   ├── controllers/     # Route handler functions
│   │   ├── middleware/       # auth, rateLimiter, errorHandler
│   │   ├── routes/          # Express router definitions
│   │   ├── services/        # Business logic (AI, messaging, etc.)
│   │   ├── types/           # Shared TypeScript types
│   │   ├── utils/           # Helpers (logger, etc.)
│   │   └── index.ts         # App entry point
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Database seeder
│   ├── Dockerfile
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── common/      # Layout, Navbar, Sidebar, Modal…
│   │   │   ├── pos/         # Cart, CartItem, PaymentModal, Receipt…
│   │   │   ├── inventory/   # ProductTable, ProductForm, StockAlert…
│   │   │   ├── customers/   # CustomerTable, CustomerForm, CustomerDetail…
│   │   │   └── admin/       # UserTable, UserForm, CampaignBuilder…
│   │   ├── pages/           # Top-level route components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API client functions (axios)
│   │   ├── store/           # Zustand state stores
│   │   ├── types/           # TypeScript interfaces
│   │   └── utils/           # Frontend helpers
│   ├── nginx.conf           # Production nginx config
│   ├── Dockerfile
│   └── vite.config.ts
│
├── docker-compose.yml
├── .env.example
├── Makefile
└── README.md
```

### Running in development mode

```bash
# Terminal 1 — backend (hot reload via nodemon)
cd backend && npm run dev

# Terminal 2 — frontend (HMR via Vite)
cd frontend && npm run dev
```

### Useful development commands

```bash
# Backend
npm run db:migrate       # Run pending Prisma migrations
npm run db:generate      # Regenerate Prisma client after schema change
npm run db:seed          # Seed sample data
npm run db:studio        # Open Prisma Studio GUI at localhost:5555
npm run build            # Compile TypeScript to dist/

# Frontend
npm run build            # Production build to dist/
npm run lint             # ESLint check
npm run preview          # Preview production build locally
```

### Adding a new API endpoint

1. Create/update the controller in `backend/src/controllers/`
2. Add the route in `backend/src/routes/`
3. Register the router in `backend/src/routes/index.ts` (if new file)
4. Add the corresponding service logic in `backend/src/services/`
5. Update the Prisma schema if new tables/columns are needed, then run `npm run db:migrate`

### Environment variables in the frontend

Vite exposes variables prefixed with `VITE_` to the browser:

```bash
# frontend/.env (for local dev)
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
```

Access in code via `import.meta.env.VITE_API_URL`.

---

## 🚢 Deployment Guide

### Docker (recommended)

1. **Provision a server** with Docker and Docker Compose installed.

2. **Copy project files** to the server:
   ```bash
   scp -r smart-pos/ user@your-server:/opt/smart-pos
   ```

3. **Create your production `.env`:**
   ```bash
   cp .env.example .env
   # Set strong secrets for JWT_SECRET and ADMIN_SECRET_KEY
   # Set DATABASE_URL, OPENAI_API_KEY, Twilio credentials as needed
   ```

4. **Start services:**
   ```bash
   docker-compose up -d --build
   ```

5. **Set up a reverse proxy** (e.g. nginx or Caddy) to terminate TLS and proxy:
   - `https://yourdomain.com` → `localhost:5173`
   - `https://api.yourdomain.com` → `localhost:3000`

### Sample Caddy configuration

```
yourdomain.com {
    reverse_proxy localhost:5173
}

api.yourdomain.com {
    reverse_proxy localhost:3000
}
```

### Production checklist

- [ ] `JWT_SECRET` is a long (≥ 32 chars) random string
- [ ] `ADMIN_SECRET_KEY` is changed from default
- [ ] `POSTGRES_PASSWORD` is not `password`
- [ ] TLS is enabled on the reverse proxy
- [ ] `NODE_ENV=production` is set
- [ ] Database backups are configured
- [ ] Firewall rules block direct access to ports `3000`, `5432`
- [ ] Log rotation is configured

### Updating

```bash
git pull
docker-compose up -d --build
docker-compose exec backend npx prisma migrate deploy
```

---

## 🔍 Troubleshooting

### Services won't start

```bash
# Check container status and recent logs
docker-compose ps
docker-compose logs
```

### Backend can't connect to the database

```bash
# Verify postgres is healthy
docker-compose ps postgres

# Check DATABASE_URL is correct
docker-compose exec backend env | grep DATABASE_URL

# Run health check manually
docker-compose exec postgres pg_isready -U postgres
```

### Prisma migration errors

```bash
# Reset database (⚠️ destroys all data)
docker-compose exec backend npx prisma migrate reset

# Or apply pending migrations only
docker-compose exec backend npx prisma migrate deploy
```

### Frontend shows blank page or API errors

1. Check the browser console for CORS or network errors.
2. Ensure `VITE_API_URL` points to the correct backend address.
3. Verify the backend is running: `curl http://localhost:3000/api/v1/health`

### AI features return errors

- Confirm `AI_ENABLED=true` in `.env`.
- For OpenAI: verify `OPENAI_API_KEY` is valid and has credits.
- For Ollama: confirm the service is running (`curl http://localhost:11434/api/tags`) and the model is pulled (`ollama pull llama2`).
- Inside Docker, use `OLLAMA_BASE_URL=http://host.docker.internal:11434`.

### WhatsApp / SMS messages not sending

- Confirm `WHATSAPP_ENABLED=true` or `SMS_ENABLED=true`.
- Verify Twilio credentials are correct.
- For WhatsApp sandbox, ensure your number has joined the sandbox.
- Check Twilio logs at [console.twilio.com](https://console.twilio.com).

### Port conflicts

```bash
# Change ports in docker-compose.yml if already in use
# e.g. change "5173:80" to "8080:80" for the frontend
```

### Makefile targets

```bash
make help          # Show all available commands
make setup         # Install deps and create .env
make start         # Start Docker services
make stop          # Stop Docker services
make clean         # Remove containers + volumes (⚠️ deletes data)
make seed          # Seed the database
make logs          # Tail backend logs
make dev-backend   # Run backend dev server
make dev-frontend  # Run frontend dev server
```

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
Built with ❤️ using Node.js, React, PostgreSQL, and TypeScript
</div>
