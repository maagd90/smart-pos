# Smart POS - Multi-Tenant Point of Sale System

A production-grade, multi-tenant SaaS Point of Sale system similar to Shopify's architecture — multiple shops can be deployed on the same platform, each with their own isolated data and admin panel.

## 🏗️ Architecture

```
smart-pos/
├── backend/        # Node.js + Express + TypeScript + Prisma
└── frontend/       # React + TypeScript + Tailwind CSS
```

## 🔑 Key Features

- **Multi-tenant isolation** — each shop has completely isolated data
- **5-tier RBAC** — Platform Admin → Shop Admin → Manager → Cashier → Analyst
- **AES-256-GCM encryption** — phone numbers and Twilio credentials encrypted at rest
- **JWT authentication** — access tokens (15min) + refresh tokens (7 days)
- **Account lockout** — locks after 5 failed attempts for 30 minutes
- **WhatsApp messaging** — configurable Twilio integration per shop
- **Real-time inventory** — stock management per shop

## 🧪 Test Suite

### Running Backend Tests

```bash
cd backend
npm install
npm test
```

**190 tests** across 12 test suites — all pass ✅

| Test Suite | Coverage |
|---|---|
| `auth.test.ts` | JWT, bcrypt, token lifecycle |
| `auth.routes.test.ts` | Auth API endpoints |
| `encryption.test.ts` | AES-256-GCM encrypt/decrypt (22 tests) |
| `shop-isolation.test.ts` | Multi-tenant isolation (25 tests) |
| `rbac.test.ts` | Role-based access control (30 tests) |
| `validation.test.ts` | Input validation + injection prevention (42 tests) |
| `security.test.ts` | Security headers, auth, injection (30 tests) |
| `integration.test.ts` | End-to-end flows (35 tests) |
| `shops.test.ts` | Shop CRUD API |
| `products.test.ts` | Product management API |
| `customers.test.ts` | Customer management API |
| `transactions.test.ts` | Transaction processing API |

### Running Frontend Tests

```bash
cd frontend
npm install
npm test -- --watchAll=false
```

**76 tests** across 4 test suites — all pass ✅

| Test Suite | Coverage |
|---|---|
| `Login.test.tsx` | Login page (15 tests) |
| `Navigation.test.tsx` | Role-based sidebar navigation (16 tests) |
| `POS.test.tsx` | POS terminal (26 tests) |
| `AdminPanel.test.tsx` | Admin panel (19 tests) |

### Total: 266 tests — all passing ✅

## 🚀 Quick Start

### Backend

```bash
cd backend
cp .env.example .env        # Configure your env vars
npm install
npx prisma migrate dev      # Run database migrations
npm run dev                 # Start development server
```

### Frontend

```bash
cd frontend
npm install
npm start                   # Start React dev server
```

### Required Environment Variables (Backend)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/smartpos"
JWT_SECRET="your-32-char-secret-here"
ENCRYPTION_KEY="your-32-char-encryption-key-here"
REFRESH_TOKEN_SECRET="your-refresh-token-secret-here"
```

## 🔐 Security

- JWT tokens in HTTP-only cookies (not localStorage)
- AES-256-GCM field-level encryption for PII
- Helmet.js security headers
- Rate limiting on auth endpoints
- Input validation and sanitization
- SQL injection prevention via Prisma ORM
- XSS prevention via input sanitization

## 📊 Roles & Permissions

| Role | Capabilities |
|------|---|
| **Platform Admin** | Manage all shops, create/delete shops, view all data |
| **Shop Admin** | Manage their own shop, add/remove staff, configure messaging |
| **Manager** | CRUD products, view customers, view analytics |
| **Cashier** | Process transactions, create customers, view products |
| **Analyst** | View analytics, reports, transactions (read-only) |

## 📱 WhatsApp Configuration

Each shop can configure their own Twilio credentials via the Shop Admin panel:
1. Enter Twilio Account SID and Auth Token (encrypted at rest)
2. Set WhatsApp-enabled phone number
3. Test send a message
4. Enable for the shop

Only the designated authorized user can send messages to prevent spam.
