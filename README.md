# Smart POS — Multi-Tenant Point of Sale System

A production-ready, multi-tenant POS system built with Node.js + Express + TypeScript + Prisma (backend) and React + TypeScript + Vite (frontend).

## Architecture

```
smart-pos/
├── backend/          # Node.js + Express + TypeScript + Prisma
│   ├── prisma/       # Database schema & migrations
│   └── src/
│       ├── config/   # Database & Redis clients
│       ├── middleware/  # Auth, RBAC, audit, rate limiting, shop isolation
│       ├── routes/   # API endpoints
│       └── services/ # Encryption, validation, account security
└── frontend/         # React + TypeScript + Vite
    └── src/
        ├── components/  # Layout, navigation
        ├── contexts/    # Auth & Shop contexts
        ├── pages/       # Platform admin & shop pages
        ├── services/    # API & auth services
        └── types/       # TypeScript types
```

## Prerequisites

- Node.js ≥ 18
- PostgreSQL 14+
- Redis 6+ (optional but recommended)

## Quick Start

### 1. Clone & install dependencies

```bash
git clone <repo-url>
cd smart-pos
npm install          # installs workspace dependencies
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
# Edit .env with your database URL, JWT secrets, and encryption key
```

### 3. Set up the database

```bash
cd backend
npm run db:generate   # generate Prisma client
npm run db:migrate    # run migrations (creates tables)
```

### 4. Start development servers

```bash
# Terminal 1 — Backend (port 3000)
npm run dev:backend

# Terminal 2 — Frontend (port 5173)
npm run dev:frontend
```

Open http://localhost:5173 in your browser.

## User Roles

| Role             | Access                                               |
|------------------|------------------------------------------------------|
| `PLATFORM_ADMIN` | All shops, subscriptions, platform analytics         |
| `SHOP_ADMIN`     | Full access to their own shop                        |
| `MANAGER`        | Products, customers, orders, offers, analytics       |
| `CASHIER`        | POS, customer lookup                                 |
| `ANALYST`        | Analytics only                                       |

## API Endpoints

### Authentication
- `POST /api/auth/login` — Login
- `POST /api/auth/refresh` — Refresh token
- `POST /api/auth/logout` — Logout
- `POST /api/auth/register` — Register user (platform admin only)
- `GET  /api/auth/me` — Get current user

### Platform Admin
- `GET/POST /api/platform/shops` — List / create shops
- `GET/PUT/DELETE /api/platform/shops/:id` — Get / update / delete shop
- `GET /api/platform/shops/platform/analytics` — Cross-shop analytics

### Shop Routes (`/api/shops/:shopId/...`)
- `staff` — CRUD staff members
- `products` — CRUD products
- `customers` — CRUD customers
- `orders` — Create & list orders (POS)
- `messaging` — WhatsApp/Twilio config & test
- `offers` — CRUD campaigns/offers
- `analytics` — Shop analytics
- `audit` — Audit logs
- `shortcuts` — Navigation shortcuts

## Security Features

- JWT access tokens (15min) + refresh token rotation (7 days)
- Token blacklisting on logout
- Account lockout after 5 failed login attempts
- AES-256-GCM encryption for PII (phone numbers, Twilio credentials)
- Role-Based Access Control (RBAC)
- Shop isolation middleware (users can only access their own shop)
- Helmet.js with Content Security Policy
- CORS configured per environment
- Rate limiting (100 req/min general, 5 attempts/15min for login)
- Comprehensive audit logging

## Environment Variables

See `backend/.env.example` for all required variables.

| Variable               | Description                         |
|------------------------|-------------------------------------|
| `DATABASE_URL`         | PostgreSQL connection string        |
| `REDIS_URL`            | Redis connection string             |
| `JWT_SECRET`           | Secret for access tokens            |
| `JWT_REFRESH_SECRET`   | Secret for refresh tokens           |
| `ENCRYPTION_KEY`       | 32+ char key for AES-256 encryption |
| `FRONTEND_URL`         | Allowed CORS origin                 |
| `PORT`                 | Backend port (default: 3000)        |

## Frontend Pages

**Platform Admin**
- `/platform/dashboard` — Stats overview
- `/platform/shops` — Manage all shops
- `/platform/subscriptions` — Subscription plan management
- `/platform/analytics` — Cross-shop analytics

**Shop Admin/Manager**
- `/shop/:shopId/admin` — Shop dashboard
- `/shop/:shopId/admin/staff` — Staff management
- `/shop/:shopId/admin/products` — Product catalog
- `/shop/:shopId/admin/customers` — Customer management
- `/shop/:shopId/admin/messaging` — WhatsApp setup wizard
- `/shop/:shopId/admin/offers` — Campaigns & offers
- `/shop/:shopId/inventory` — Stock management

**Cashier/All Staff**
- `/shop/:shopId/pos` — Point of Sale terminal
- `/shop/:shopId/analytics` — Shop analytics
- `/shop/:shopId/customers` — Customer lookup