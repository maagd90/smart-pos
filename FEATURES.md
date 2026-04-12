# Smart POS — Feature Documentation

Detailed documentation for all 12 major features of the Smart POS system.

---

## Table of Contents

1. [Point of Sale (POS)](#1-point-of-sale-pos)
2. [Inventory Management](#2-inventory-management)
3. [Customer Management](#3-customer-management)
4. [AI Demand Forecasting](#4-ai-demand-forecasting)
5. [AI Customer Segmentation](#5-ai-customer-segmentation)
6. [AI Price Recommendations](#6-ai-price-recommendations)
7. [AI Inventory Optimization](#7-ai-inventory-optimization)
8. [Multi-Channel Messaging](#8-multi-channel-messaging)
9. [AI-Personalized Messages](#9-ai-personalized-messages)
10. [Analytics Dashboard](#10-analytics-dashboard)
11. [Multi-Machine Support](#11-multi-machine-support)
12. [Role-Based Access Control](#12-role-based-access-control)

---

## 1. Point of Sale (POS)

The core transaction engine of the system.

### Capabilities

- **Cart management** — add items by barcode scan, SKU search, or category browse
- **Multi-payment methods** — Cash, Card, Digital Wallet
- **Discount application** — per-item and per-transaction discounts
- **Tax calculation** — configurable tax rate from Settings
- **Loyalty points** — automatic accrual at 1 point per $1 spent; redemption at $0.01 per point
- **Receipt generation** — Thermal, A4, and Digital formats
- **Receipt delivery** — print, email, and WhatsApp send
- **Transaction history** — searchable, filterable log of all transactions
- **Refunds** — full transaction refund with stock restoration (Manager+)

### Receipt Formats

| Format | Use Case |
|--------|----------|
| `THERMAL` | 80mm thermal printer paper |
| `A4` | Standard printer for formal receipts |
| `DIGITAL` | Email/WhatsApp PDF attachment |

### Payment Flow

```
Cart → Apply discounts → Calculate tax → Choose payment → Complete transaction
                                                            ↓
                                              Update stock levels
                                              Award loyalty points
                                              Send receipt (optional)
                                              Emit WebSocket event
```

### API: `POST /api/pos/transactions`

---

## 2. Inventory Management

Real-time stock tracking with proactive alerting.

### Capabilities

- **Product catalogue** — name, SKU, barcode, category, cost price, selling price
- **Stock levels** — track current stock, minimum stock threshold, and reorder point
- **Stock adjustments** — Addition, Subtraction, Waste, Correction (with audit trail)
- **Low-stock alerts** — products at or below `minStock` surface as alerts and WebSocket events
- **Expiry date tracking** — flag products approaching or past expiry
- **Category management** — auto-generated from product categories
- **Barcode search** — instant product lookup by barcode scanner
- **Soft delete** — deactivate products without losing history

### Stock Adjustment Types

| Type | Description |
|------|-------------|
| `ADDITION` | New stock received from supplier |
| `SUBTRACTION` | Manual removal (damage, sample) |
| `WASTE` | Expired or spoiled goods |
| `CORRECTION` | Inventory count correction |

### Low Stock Logic

A product is flagged as low stock when `stock <= minStock`. The AI inventory analysis uses `reorderPoint` to predict when to reorder before hitting the minimum.

### API: `/api/inventory/*`

---

## 3. Customer Management

A lightweight CRM built directly into the POS.

### Capabilities

- **Customer profiles** — name, phone, email, notes
- **Opt-in preferences** — per-channel messaging consent (WhatsApp, SMS, Email)
- **Loyalty programme** — accumulate points with every purchase; redeem at checkout
- **Purchase history** — full transaction history per customer
- **Segment tracking** — automatic segment assignment (updated by AI batch or manually)
- **Visit statistics** — total spend, visit count, average basket size, last visit date
- **Search** — by name, email, or phone number

### Loyalty Programme

```
Every $1 spent = 1 loyalty point
100 points = $1 discount at checkout (1 point = $0.01)

Example: Customer spends $50 → earns 50 points
         Redeems 500 points → $5 off next purchase
```

### Customer Segments

| Segment | Typical Profile |
|---------|----------------|
| `VIP` | High spend, frequent visits, recent activity |
| `PREMIUM` | Good spend, regular visits |
| `REGULAR` | Average engagement |
| `NEW` | Joined < 30 days ago |
| `INACTIVE` | No visit in 90+ days |

Segments are assigned automatically by the AI segmentation engine (see [Feature 5](#5-ai-customer-segmentation)) or can be set manually.

### API: `/api/customers/*`

---

## 4. AI Demand Forecasting

Uses historical sales data to predict product demand for the next 30 days.

### How It Works

1. Fetches up to 50 active products with their 30-day and 90-day sales history
2. Compresses data into a token-efficient format (see [AI_TOKEN_OPTIMIZATION.md](./AI_TOKEN_OPTIMIZATION.md))
3. Sends compressed data to the LLM with a structured prompt
4. LLM returns forecast per product with confidence score and trend direction
5. Results are cached for 24 hours

### Output Per Product

```json
{
  "id": "product-uuid",
  "forecastedDemand": 145,
  "confidence": 0.82,
  "trend": "up",
  "recommendation": "Increase stock by 30% before weekend"
}
```

### `trend` Values

- `up` — demand expected to rise
- `down` — demand expected to fall
- `stable` — demand expected to remain constant

### Use Cases

- Pre-order planning before weekends / holidays
- Avoiding overstock on slow-moving items
- Identifying seasonal patterns

### Required Role: `ANALYST`

### API: `POST /api/ai/demand-forecast`

---

## 5. AI Customer Segmentation

Automatically classifies customers into actionable segments and generates personalized offer ideas.

### How It Works

1. Fetches up to 50 customers with aggregated statistics (no PII sent — see privacy note)
2. Compresses customer data (spend, visits, categories, recency) into a compact format
3. LLM assigns each customer to a segment with reasoning
4. LLM suggests a personalized offer for each customer
5. Results cached for 24 hours; a cron job re-runs segmentation every 6 hours in the background

### Output Per Customer

```json
{
  "id": "customer-uuid",
  "segment": "VIP",
  "reasoning": "High total spend ($2500), 12 visits, last visited 7 days ago",
  "suggestedOffer": "Exclusive 15% loyalty bonus on Electronics purchases"
}
```

### Privacy

The AI receives customer IDs (last 6 characters only), spend statistics, visit counts, category preferences, and days since last visit. **No names, emails, or phone numbers are sent to the AI.** See [AI_TOKEN_OPTIMIZATION.md](./AI_TOKEN_OPTIMIZATION.md).

### Required Role: `ANALYST`

### API: `POST /api/ai/customer-insights`

---

## 6. AI Price Recommendations

Suggests optimal pricing based on margin, sales velocity, and category context.

### How It Works

1. Fetches up to 50 active products with their cost price, current price, and 30-day sales
2. Calculates current margin per product
3. LLM analyses pricing opportunities (margin headroom, velocity, competitive positioning)
4. Returns suggested price and expected revenue impact percentage

### Output Per Product

```json
{
  "id": "product-uuid",
  "suggestedPrice": 11.99,
  "expectedImpactPct": 8.5,
  "reasoning": "High-velocity item with 42% margin headroom; 20% price increase unlikely to reduce demand"
}
```

### Use Cases

- Pricing new products based on category benchmarks
- Identifying underpriced high-velocity items
- Finding overpriced slow-moving inventory

### Required Role: `MANAGER`

### API: `POST /api/ai/price-recommendations`

---

## 7. AI Inventory Optimization

Analyses current stock levels against sales velocity to produce reorder recommendations.

### How It Works

1. Fetches all active products with stock levels, reorder points, and daily sales rate
2. Calculates `daysUntilStockout` = `currentStock / avgDailySales`
3. LLM assigns urgency and recommended order quantity per item
4. Results cached for 24 hours

### Output Per Item

```json
{
  "id": "product-uuid",
  "action": "order",
  "suggestedOrderQty": 200,
  "urgency": "high",
  "reasoning": "3.2 days until stockout at current 12.5 units/day sales rate"
}
```

### `action` Values

| Action | Meaning |
|--------|---------|
| `order` | Place a reorder now |
| `watch` | Monitor closely, reorder soon |
| `ok` | Stock levels healthy |

### `urgency` Values: `high` | `medium` | `low`

### Required Role: `ANALYST`

### API: `POST /api/ai/inventory-analysis`

---

## 8. Multi-Channel Messaging

Send targeted messages to customers via WhatsApp, SMS, or Email with built-in spam protection.

### Channels

| Channel | Provider | Use Case |
|---------|----------|----------|
| WhatsApp | Twilio WhatsApp Business API | Rich messages, high open rates |
| SMS | Twilio Programmable SMS | Universal reach, time-sensitive alerts |
| Email | SendGrid | Newsletters, receipts, promotions |

### Spam Protection

The messaging service enforces hard limits:

1. **Monthly cap** — max `MAX_MESSAGES_PER_MONTH` messages per customer (default: 4)
2. **Gap enforcement** — minimum `MESSAGE_GAP_DAYS` between messages to the same customer (default: 7 days)
3. **Opt-in check** — customers must have opted in for the specific channel

Any message that violates these rules is rejected with a `429` response.

### Campaigns

Campaigns allow bulk messaging to a customer segment:

1. Create a campaign with a template, channel, and target segment
2. Schedule it for a future date or run immediately
3. Track delivery status per message

### Message Status Lifecycle

```
PENDING → SENT → DELIVERED → READ
                    ↓
                  FAILED
```

### API: `/api/messaging/*`

---

## 9. AI-Personalized Messages

Uses the LLM to write tailored marketing messages for individual customers.

### How It Works

1. Manager selects a customer and provides available offers
2. The system passes the customer's segment, spend profile, and category preferences to the LLM
3. LLM generates a friendly, personalized message optimized for the target channel
4. For SMS: kept under 160 characters
5. Returns both a message body and an email subject line

### Example Output

**Input:**
- Customer: VIP, $2500 total spent, avg basket $208, top categories: Electronics, Coffee
- Offers: "10% off Electronics", "Free coffee with $20+ purchase"

**Output:**
```json
{
  "message": "Hi! 🎉 As a VIP, enjoy 10% off Electronics + free coffee on $20+ this week. You've earned it!",
  "subject": "Your exclusive VIP rewards are waiting",
  "emoji": true
}
```

### Privacy

Customer **names** are passed to the AI for message personalisation (this is the only case where a name is used — the message would be useless without it). All other AI features use anonymized IDs only.

### Required Role: `MANAGER`

### API: `POST /api/ai/generate-message`

---

## 10. Analytics Dashboard

Comprehensive business intelligence across sales, inventory, customers, and staff.

### Dashboard KPIs

- Total revenue (current period vs. previous period)
- Total transactions and average basket size
- New vs. returning customers
- Top-selling products
- Revenue by day (line chart)
- Payment method breakdown

### Sales Analytics

- Revenue and transaction volume over time
- Hourly/daily/weekly/monthly breakdowns
- Payment method distribution
- Discount and tax totals

### Product Analytics

- Best and worst performing products
- Revenue contribution per category
- Margin analysis
- Sell-through rate

### Customer Analytics

- Segment distribution (pie chart)
- Customer retention rate
- Lifetime value by segment
- New customer acquisition trend

### Inventory Health

- Items at risk of stockout
- Dead stock (no sales in 90+ days)
- Expiry risk report (items expiring within 30 days)
- Stock turnover rate

### Messaging Metrics

- Messages sent per channel
- Delivery and failure rates
- Campaign performance

### Staff Performance

- Transactions processed per user
- Revenue generated per cashier
- Average basket per staff member

### Date Range Filtering

All analytics endpoints accept `startDate` and `endDate` parameters. Default is the last 30 days.

### Required Role: `ANALYST`

### API: `/api/analytics/*`

---

## 11. Multi-Machine Support

Real-time monitoring and management of multiple POS terminals.

### How It Works

Each POS terminal runs the frontend app and connects to the WebSocket server. Terminals identify themselves with a `machineId` and send periodic heartbeats to signal they are online.

```
Terminal A ──heartbeat──► WebSocket Server ──status broadcast──► All connected clients
Terminal B ──heartbeat──►
```

### Machine States

| State | Meaning |
|-------|---------|
| `ONLINE` | Terminal is active and sending heartbeats |
| `OFFLINE` | No heartbeat received; terminal disconnected |
| `MAINTENANCE` | Manually set to maintenance mode |

### Machine Data Model

```
Machine {
  id        UUID
  name      string        (e.g. "POS-001", "Counter 2")
  status    ONLINE | OFFLINE | MAINTENANCE
  lastSeen  DateTime
  userId    UUID?         (last logged-in user)
}
```

### Real-Time Events

```javascript
// Terminal sends heartbeat
socket.emit('machine:heartbeat', { machineId: 'POS-001' });

// All clients receive status update
socket.on('machine:status', ({ machineId, status }) => {
  updateTerminalStatus(machineId, status);
});
```

### API: `GET /api/admin/machines`

---

## 12. Role-Based Access Control

Fine-grained permission system protecting every endpoint and UI section.

### Roles

| Role | Description |
|------|-------------|
| `OWNER` | Full system access; manages users; sees all data |
| `MANAGER` | Manages inventory, customers, campaigns, settings; creates reports |
| `ANALYST` | Read-only access to analytics and AI features; cannot transact |
| `CASHIER` | POS transactions only; limited customer data access |

### Permission Matrix

| Resource | CASHIER | ANALYST | MANAGER | OWNER |
|----------|---------|---------|---------|-------|
| Run POS transactions | ✓ | — | ✓ | ✓ |
| View inventory | ✓ | ✓ | ✓ | ✓ |
| Manage products | — | — | ✓ | ✓ |
| View customers | ✓ | ✓ | ✓ | ✓ |
| Edit customers | ✓ | — | ✓ | ✓ |
| View analytics | — | ✓ | ✓ | ✓ |
| AI features | — | ✓ | ✓ | ✓ |
| Send messages | — | — | ✓ | ✓ |
| Manage campaigns | — | — | ✓ | ✓ |
| Manage settings | — | — | ✓ | ✓ |
| Create users | — | — | — | ✓ |
| Delete users | — | — | — | ✓ |
| View audit logs | — | — | ✓ | ✓ |
| Issue refunds | — | — | ✓ | ✓ |

### Implementation

Permissions are enforced in two layers:

1. **Backend middleware** — `requireMinRole('MANAGER')` and `requireRole('OWNER')` protect every API route.
2. **Frontend** — UI elements are conditionally rendered based on the authenticated user's role.

### Audit Trail

Every significant action is recorded in the `AuditLog` table with:
- `userId` — who performed the action
- `action` — what was done (e.g. `CREATE_TRANSACTION`, `UPDATE_PRODUCT`)
- `resource` / `resourceId` — what was affected
- `ipAddress` — where the request came from
- `createdAt` — when it happened

Audit logs are immutable and accessible to `MANAGER` and `OWNER` roles via `GET /api/admin/audit-logs`.
