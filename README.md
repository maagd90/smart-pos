# Smart POS System

A complete Point-of-Sale system with AI-powered inventory analysis, demand forecasting, automated customer messaging, and profit-maximizing deal recommendations.

## Features

### Core POS
- **Sales / Checkout** – product grid, shopping cart, customer selection, payment methods, receipt
- **Inventory Management** – full CRUD for products with stock-level indicators
- **Customer Management** – customer profiles with full purchase history

### AI Capabilities (powered by OpenAI GPT-4o-mini)
- **Demand Analysis** – identifies top-selling, trending and under-performing products
- **Customer Insights** – analyses individual buying patterns and preferences
- **Deal Recommendations** – suggests promotions that maximise profit
- **Automated Messaging** – generates personalised promotional messages and sends them to customers

### Analytics Dashboard
- Revenue cards (today / week / month)
- Sales-over-time bar chart
- Revenue-by-category pie chart
- Top-selling products list
- Recent-sales table

---

## Project Structure

```
smart-pos/
├── backend/          # Node.js + Express + TypeScript + SQLite API
│   └── src/
│       ├── database/ # Schema + seed data
│       ├── routes/   # products, customers, sales, messages, ai
│       └── services/ # aiService (OpenAI), messageService
└── frontend/         # React + TypeScript + Material UI
    └── src/
        ├── api/      # Axios API modules
        ├── components/
        ├── pages/    # Dashboard, POS, Inventory, Customers, AI Insights, Messages
        └── types/
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- (Optional) OpenAI API key for live AI responses

### 1. Backend

```bash
cd backend
npm install

# (Optional) create a .env file with your OpenAI key
echo "OPENAI_API_KEY=sk-..." > .env

npm run seed    # load demo products, customers and sales
npm run dev     # starts API on http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm start       # starts UI on http://localhost:3000
```

Open http://localhost:3000 in your browser.

---

## API Overview

| Method | Path | Description |
|--------|------|-------------|
| GET/POST/PUT/DELETE | `/api/products` | Inventory CRUD |
| GET/POST/PUT/DELETE | `/api/customers` | Customer CRUD |
| GET | `/api/customers/:id/purchases` | Customer purchase history |
| POST | `/api/sales` | Create a sale |
| GET | `/api/sales` | List sales |
| GET | `/api/dashboard/stats` | Aggregated stats |
| POST | `/api/ai/analyze-demand` | AI demand analysis |
| POST | `/api/ai/customer-insights/:id` | AI customer insights |
| POST | `/api/ai/deal-recommendations` | AI deal recommendations |
| POST | `/api/ai/generate-message/:id` | Generate personalised message |
| POST | `/api/messages/send/:id` | Store / send a message |
| GET | `/api/messages` | All messages |
| GET | `/api/messages/:id` | Messages for a customer |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend server port |
| `OPENAI_API_KEY` | _(none)_ | OpenAI key (mock responses used if absent) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express, TypeScript |
| Database | SQLite (better-sqlite3) |
| AI | OpenAI GPT-4o-mini |
| Frontend | React 19, TypeScript |
| UI | Material UI v9 |
| Charts | Recharts |
| HTTP | Axios |