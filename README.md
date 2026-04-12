# Smart POS System

A modern, AI-powered Point of Sale system built with **Node.js/TypeScript** (backend) and **React/TypeScript** (frontend). Designed for retail shops that want intelligent inventory management, customer relationship tools, and data-driven insights — all in one platform.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Default Credentials](#default-credentials)
- [Project Structure](#project-structure)
- [Documentation](#documentation)

---

## Overview

Smart POS combines a traditional point-of-sale terminal with AI-powered analytics, multi-channel customer messaging, and real-time inventory tracking. It runs on **PostgreSQL** for data persistence, **Redis** for caching, and optionally **Ollama** for free local LLM inference (no OpenAI costs).

**Tech stack:**
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, Socket.IO, node-cron
- **Frontend:** React, TypeScript, Tailwind CSS
- **Database:** PostgreSQL 15
- **Cache:** Redis 7 + in-memory NodeCache
- **AI:** OpenAI GPT-3.5-turbo (default) or Ollama (local/free)
- **Messaging:** WhatsApp (Twilio), SMS (Twilio), Email (SendGrid)

---

## Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Point of Sale** | Cart management, barcode scanning, multi-payment methods, receipt generation |
| 2 | **Inventory Management** | Real-time stock tracking, low-stock alerts, expiry date monitoring |
| 3 | **Customer Management** | Customer profiles, loyalty points, purchase history, segmentation |
| 4 | **AI Demand Forecasting** | 30-day demand predictions per product using historical sales data |
| 5 | **AI Customer Segmentation** | Automatic VIP/Premium/Regular/New/Inactive classification |
| 6 | **AI Price Recommendations** | Margin-aware pricing suggestions with expected revenue impact |
| 7 | **AI Inventory Optimization** | Smart reorder recommendations with urgency scoring |
| 8 | **Multi-Channel Messaging** | WhatsApp, SMS, and Email campaigns with spam protection |
| 9 | **AI-Personalized Messages** | LLM-generated personalized marketing messages per customer |
| 10 | **Analytics Dashboard** | Sales trends, product performance, customer insights, staff metrics |
| 11 | **Multi-Machine Support** | Real-time POS terminal status via WebSocket |
| 12 | **Role-Based Access Control** | Owner, Manager, Cashier, and Analyst roles with granular permissions |

> See [FEATURES.md](./FEATURES.md) for detailed documentation on every feature.

---

## Quick Start

### Option 1: Docker (Recommended)

```bash
# 1. Clone the repository
git clone <repo-url> smart-pos
cd smart-pos

# 2. Copy and configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys (optional for basic usage)

# 3. Start all services
docker compose up -d

# 4. Run database migrations and seed data
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run seed

# 5. Open the app
open http://localhost:3000
```

### Option 2: Manual Setup

```bash
# Prerequisites: Node.js 18+, PostgreSQL 15, Redis 7

# 1. Install backend dependencies
cd backend && npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL and JWT_SECRET

# 3. Run database migrations
npx prisma migrate dev
npx prisma generate

# 4. Seed the database
npm run seed

# 5. Start the backend (port 3001)
npm run dev

# 6. In a new terminal — install and start frontend
cd ../frontend && npm install
npm start   # Opens http://localhost:3000
```

> See [SETUP.md](./SETUP.md) for the complete step-by-step guide including troubleshooting.

---

## Environment Configuration

Create `backend/.env` from the example below. Only `DATABASE_URL` and `JWT_SECRET` are required for basic operation.

```env
# ── Required ──────────────────────────────────────────────
DATABASE_URL=postgresql://smartpos:smartpos@localhost:5432/smartpos
JWT_SECRET=your-super-secret-key-change-in-production

# ── Server ────────────────────────────────────────────────
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# ── Redis (optional — falls back to in-memory cache) ──────
REDIS_URL=redis://localhost:6379

# ── AI Provider (choose one) ──────────────────────────────
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo

# OR use local Ollama (free, no API key needed):
USE_OLLAMA=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# ── Messaging (all optional) ──────────────────────────────
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
TWILIO_WHATSAPP_NUMBER=whatsapp:+1...
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@yourshop.com

# ── Tuning ────────────────────────────────────────────────
AI_CACHE_TTL=86400          # 24 hours — cache AI results to save tokens
MAX_MESSAGES_PER_MONTH=4    # Per-customer messaging limit
MESSAGE_GAP_DAYS=7          # Minimum days between messages to same customer
JWT_EXPIRES_IN=7d
```

---

## Default Credentials

After running `npm run seed`:

| Role | Email | Password |
|------|-------|----------|
| **Owner** | `admin@shop.com` | `password123` |
| **Manager** | `manager@shop.com` | `password123` |
| **Cashier** | `cashier@shop.com` | `password123` |
| **Analyst** | `analyst@shop.com` | `password123` |

> ⚠️ Change all passwords immediately before deploying to production.

---

## Project Structure

```
smart-pos/
├── backend/
│   ├── src/
│   │   ├── api/            # Route handlers (auth, pos, inventory, customers, ai, …)
│   │   ├── services/
│   │   │   ├── ai/         # aiService, tokenOptimizer, aiCache
│   │   │   ├── pos/        # transactionService, receiptService
│   │   │   ├── messaging/  # emailService, smsService, whatsappService
│   │   │   ├── inventory/  # inventoryService
│   │   │   └── analytics/  # analyticsService
│   │   ├── middleware/     # auth, permissions, errorHandler
│   │   ├── db/             # Prisma client, schema, seed script
│   │   ├── socket/         # WebSocket handler
│   │   └── utils/          # constants, formatters, validators
│   ├── prisma/             # Migrations
│   └── docker-compose.yml  # Backend-only services (postgres + redis)
├── frontend/
│   └── src/                # React application
├── docker-compose.yml      # Full-stack compose (frontend + backend + infra)
├── README.md
├── SETUP.md
├── API_DOCUMENTATION.md
├── FEATURES.md
├── OLLAMA_SETUP.md
└── AI_TOKEN_OPTIMIZATION.md
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [SETUP.md](./SETUP.md) | Detailed installation guide, prerequisites, troubleshooting |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | Complete REST API & WebSocket reference |
| [FEATURES.md](./FEATURES.md) | Deep-dive into all 12 features |
| [OLLAMA_SETUP.md](./OLLAMA_SETUP.md) | Run AI locally for free with Ollama |
| [AI_TOKEN_OPTIMIZATION.md](./AI_TOKEN_OPTIMIZATION.md) | How token costs are reduced by ~89% |

---

## License

MIT