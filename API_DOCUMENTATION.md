# Smart POS — API Documentation

Base URL: `http://localhost:3001/api`

All endpoints (except `POST /auth/login`) require a **Bearer token** in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

All responses follow the envelope format:

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Error description" }
```

---

## Table of Contents

- [Authentication](#authentication)
- [POS Endpoints](#pos-endpoints)
- [Inventory Endpoints](#inventory-endpoints)
- [Customer Endpoints](#customer-endpoints)
- [AI Endpoints](#ai-endpoints)
- [Messaging Endpoints](#messaging-endpoints)
- [Analytics Endpoints](#analytics-endpoints)
- [Admin Endpoints](#admin-endpoints)
- [Settings Endpoints](#settings-endpoints)
- [WebSocket Events](#websocket-events)

---

## Role Hierarchy

| Role | Level | Capabilities |
|------|-------|-------------|
| `OWNER` | 4 | Full access including user management |
| `MANAGER` | 3 | All except user deletion; can manage campaigns |
| `ANALYST` | 2 | Read-only analytics and AI features |
| `CASHIER` | 1 | POS transactions only |

---

## Authentication

### `POST /auth/login`

Authenticate and receive a JWT token. **No token required.**

**Request:**
```json
{
  "email": "admin@shop.com",
  "password": "password123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "admin@shop.com",
      "name": "Admin User",
      "role": "OWNER"
    }
  }
}
```

**Response `401`:**
```json
{ "success": false, "message": "Invalid credentials" }
```

---

### `GET /auth/me`

Returns the authenticated user's profile.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@shop.com",
    "name": "Admin User",
    "role": "OWNER",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### `POST /auth/change-password`

**Request:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newSecurePassword!"
}
```

**Response `200`:**
```json
{ "success": true, "message": "Password updated" }
```

---

### `POST /auth/register`

Create a new user account. **Requires:** `OWNER` role.

**Request:**
```json
{
  "email": "newuser@shop.com",
  "password": "securepass",
  "name": "New User",
  "role": "CASHIER"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "newuser@shop.com",
    "name": "New User",
    "role": "CASHIER"
  }
}
```

---

## POS Endpoints

### `POST /pos/transactions`

Create a new sales transaction. **Requires:** Any authenticated user.

**Request:**
```json
{
  "customerId": "uuid-or-null",
  "items": [
    { "productId": "uuid", "quantity": 2, "price": 9.99, "discount": 0 }
  ],
  "paymentMethod": "CASH",
  "subtotal": 19.98,
  "tax": 1.60,
  "discount": 0,
  "total": 21.58,
  "notes": "Optional note"
}
```

`paymentMethod` options: `CASH` | `CARD` | `DIGITAL_WALLET`

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "receiptNumber": "RCP-00042",
    "customerId": null,
    "total": 21.58,
    "paymentMethod": "CASH",
    "paymentStatus": "COMPLETED",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### `GET /pos/transactions`

List transactions with optional filters. **Requires:** Any authenticated user.

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20, max: 100) |
| `customerId` | UUID | Filter by customer |
| `paymentMethod` | string | `CASH` \| `CARD` \| `DIGITAL_WALLET` |
| `paymentStatus` | string | `PENDING` \| `COMPLETED` \| `REFUNDED` |
| `startDate` | ISO date | Filter from date |
| `endDate` | ISO date | Filter to date |

**Response `200`:**
```json
{
  "success": true,
  "data": [ { "id": "uuid", "receiptNumber": "RCP-00042", "total": 21.58, ... } ],
  "meta": {
    "total": 250,
    "page": 1,
    "limit": 20,
    "totalPages": 13
  }
}
```

---

### `GET /pos/transactions/:id`

Get full transaction details including line items and receipt.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "receiptNumber": "RCP-00042",
    "transactionItems": [
      { "productId": "uuid", "product": { "name": "Coffee Beans 500g" }, "quantity": 2, "price": 9.99 }
    ],
    "customer": { "id": "uuid", "name": "Jane Smith" },
    "user": { "id": "uuid", "name": "Cashier Bob" },
    "receipt": { "format": "THERMAL", "emailSent": false }
  }
}
```

---

### `POST /pos/transactions/:id/refund`

Refund a transaction. **Requires:** `MANAGER` role.

**Response `200`:**
```json
{
  "success": true,
  "data": { "id": "uuid", "paymentStatus": "REFUNDED" }
}
```

---

### `GET /pos/transactions/:id/receipt`

Get receipt data for printing or sending.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "receiptNumber": "RCP-00042",
    "storeName": "My Shop",
    "items": [ ... ],
    "subtotal": 19.98,
    "tax": 1.60,
    "total": 21.58,
    "paymentMethod": "CASH",
    "cashierName": "Bob"
  }
}
```

---

## Inventory Endpoints

### `GET /inventory/products`

List all active products. **Requires:** Any authenticated user.

**Query parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Results per page |
| `category` | string | Filter by category |
| `search` | string | Search name or SKU |
| `lowStock` | boolean | Only show low-stock items |

---

### `GET /inventory/products/:id`

Get product details.

---

### `POST /inventory/products`

Create a new product. **Requires:** `MANAGER` role.

**Request:**
```json
{
  "name": "Coffee Beans 500g",
  "sku": "COFFEE-500",
  "barcode": "1234567890123",
  "price": 9.99,
  "costPrice": 4.50,
  "category": "Beverages",
  "stock": 100,
  "minStock": 10,
  "reorderPoint": 20,
  "expiryDate": "2025-06-01T00:00:00.000Z"
}
```

---

### `PUT /inventory/products/:id`

Update product details. **Requires:** `MANAGER` role.

---

### `DELETE /inventory/products/:id`

Soft-delete a product (sets `isActive: false`). **Requires:** `MANAGER` role.

---

### `POST /inventory/products/:id/stock`

Adjust stock level. **Requires:** `MANAGER` role.

**Request:**
```json
{
  "type": "ADDITION",
  "quantity": 50,
  "reason": "Restocked from supplier"
}
```

`type` options: `ADDITION` | `SUBTRACTION` | `WASTE` | `CORRECTION`

---

### `GET /inventory/low-stock`

Get all products where `stock <= minStock`. **Requires:** Any authenticated user.

---

### `GET /inventory/categories`

List all distinct product categories.

---

## Customer Endpoints

### `GET /customers`

List customers. **Requires:** Any authenticated user.

**Query parameters:** `page`, `limit`, `search` (name/email/phone), `segment`

`segment` options: `VIP` | `PREMIUM` | `REGULAR` | `NEW` | `INACTIVE`

---

### `POST /customers`

Create a new customer. **Requires:** Any authenticated user.

**Request:**
```json
{
  "name": "Jane Smith",
  "phone": "+15551234567",
  "email": "jane@example.com",
  "optInWhatsapp": true,
  "optInSms": false,
  "optInEmail": true,
  "notes": "Prefers oat milk"
}
```

---

### `GET /customers/:id`

Get full customer profile including transaction history.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Jane Smith",
    "loyaltyPoints": 1250,
    "totalSpent": 2500.00,
    "visitCount": 12,
    "segment": "VIP",
    "lastVisit": "2024-01-14T15:30:00.000Z",
    "transactions": [ ... ]
  }
}
```

---

### `PUT /customers/:id`

Update customer details. **Requires:** Any authenticated user.

---

### `POST /customers/:id/loyalty`

Add or redeem loyalty points. **Requires:** Any authenticated user.

**Request:**
```json
{
  "action": "redeem",
  "points": 100
}
```

`action` options: `add` | `redeem`

---

## AI Endpoints

All AI endpoints use 24-hour caching. First call triggers LLM inference; subsequent identical calls return cached results instantly.

See [AI_TOKEN_OPTIMIZATION.md](./AI_TOKEN_OPTIMIZATION.md) for how data is compressed before being sent to the AI.

### `POST /ai/demand-forecast`

Forecast demand for the next 30 days across all active products. **Requires:** `ANALYST` role.

No request body needed — the endpoint fetches product and sales data internally.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "product-uuid",
      "forecastedDemand": 145,
      "confidence": 0.82,
      "trend": "up",
      "recommendation": "Increase stock by 30% before weekend"
    }
  ]
}
```

---

### `POST /ai/price-recommendations`

Get AI-powered price suggestions. **Requires:** `MANAGER` role.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "product-uuid",
      "suggestedPrice": 11.99,
      "expectedImpactPct": 8.5,
      "reasoning": "High velocity item with 42% margin headroom"
    }
  ]
}
```

---

### `POST /ai/customer-insights`

Segment customers and generate personalized offer suggestions. **Requires:** `ANALYST` role.

**Query parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Number of customers to analyze (default: 50) |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "customer-uuid",
      "segment": "VIP",
      "reasoning": "High spend, frequent visits, recent activity",
      "suggestedOffer": "Exclusive 15% loyalty discount on next purchase"
    }
  ]
}
```

---

### `POST /ai/inventory-analysis`

Get AI reorder recommendations for all low/critical stock items. **Requires:** `ANALYST` role.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "product-uuid",
      "action": "order",
      "suggestedOrderQty": 200,
      "urgency": "high",
      "reasoning": "3.2 days until stockout at current sales rate"
    }
  ]
}
```

---

### `POST /ai/generate-message`

Generate a personalized marketing message for one customer. **Requires:** `MANAGER` role.

**Request:**
```json
{
  "customerId": "uuid",
  "channel": "SMS",
  "offers": ["10% off Electronics", "Free coffee with purchase over $20"]
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "message": "Hi Jane! 🎉 As a VIP customer, enjoy 10% off Electronics this week. See you soon!",
    "subject": "Your exclusive VIP offer",
    "emoji": true
  }
}
```

---

## Messaging Endpoints

### `GET /messaging/campaigns`

List all campaigns. **Requires:** `MANAGER` role.

---

### `POST /messaging/campaigns`

Create a new campaign. **Requires:** `MANAGER` role.

**Request:**
```json
{
  "name": "Summer Sale",
  "description": "Seasonal promotion",
  "channel": "EMAIL",
  "template": "Hi {{name}}, enjoy 20% off all summer items!",
  "segment": "VIP",
  "status": "DRAFT",
  "scheduledAt": "2024-07-01T09:00:00.000Z"
}
```

`channel` options: `WHATSAPP` | `SMS` | `EMAIL`
`segment` options: `VIP` | `PREMIUM` | `REGULAR` | `NEW` | `INACTIVE` | `null` (all)

---

### `POST /messaging/send`

Send a single message to one customer. **Requires:** `MANAGER` role.

**Request:**
```json
{
  "customerId": "uuid",
  "channel": "WHATSAPP",
  "content": "Hi Jane! Your loyalty points expire soon — redeem them today.",
  "subject": "Loyalty Points Expiring",
  "skipSpamCheck": false
}
```

The messaging service enforces:
- Maximum `MAX_MESSAGES_PER_MONTH` messages per customer per month (default: 4)
- Minimum `MESSAGE_GAP_DAYS` between messages (default: 7 days)
- Customer opt-in per channel must be enabled

**Response `200`:**
```json
{ "success": true, "data": { "messageId": "uuid", "status": "SENT" } }
```

**Response `429`:**
```json
{ "success": false, "message": "Customer has reached monthly message limit" }
```

---

### `GET /messaging/history`

Get message history with filters. **Requires:** `MANAGER` role.

**Query parameters:** `page`, `limit`, `customerId`, `channel`, `status`, `campaignId`

---

## Analytics Endpoints

All analytics endpoints require `ANALYST` role and accept `startDate` / `endDate` query parameters (ISO 8601). Default range: last 30 days.

### `GET /analytics/dashboard`

High-level KPIs for the dashboard.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 48250.00,
    "totalTransactions": 1245,
    "avgBasketSize": 38.75,
    "newCustomers": 87,
    "topProducts": [ ... ],
    "revenueByDay": [ { "date": "2024-01-15", "revenue": 1520.00 } ]
  }
}
```

---

### `GET /analytics/sales`

Detailed sales analytics broken down by payment method, time, and trends.

---

### `GET /analytics/products`

Product performance — top sellers, revenue contribution, margin analysis.

---

### `GET /analytics/customers`

Customer analytics — segment distribution, retention rate, lifetime value.

---

### `GET /analytics/inventory`

Inventory health — turnover rate, dead stock, expiry risk.

---

### `GET /analytics/messaging`

Messaging performance — delivery rates, open rates, campaign ROI.

---

### `GET /analytics/staff`

Staff performance — transactions per cashier, average basket, hours worked.

---

## Admin Endpoints

All admin endpoints require `MANAGER` role minimum. User creation/deletion requires `OWNER`.

### `GET /admin/users`

List all staff users (paginated).

---

### `POST /admin/users`

Create a new staff user. **Requires:** `OWNER` role.

**Request:**
```json
{
  "email": "staff@shop.com",
  "password": "securepassword",
  "name": "Staff Member",
  "role": "CASHIER"
}
```

---

### `PUT /admin/users/:id`

Update user details or role. **Requires:** `OWNER` role.

---

### `DELETE /admin/users/:id`

Deactivate a user account. **Requires:** `OWNER` role.

---

### `GET /admin/audit-logs`

View audit trail of all system actions. **Requires:** `MANAGER` role.

**Query parameters:** `page`, `limit`, `userId`, `action`, `resource`, `startDate`, `endDate`

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action": "CREATE_TRANSACTION",
      "resource": "transactions",
      "resourceId": "uuid",
      "user": { "name": "Bob Cashier" },
      "ipAddress": "192.168.1.10",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### `GET /admin/machines`

List all registered POS machines with online/offline status.

---

## Settings Endpoints

### `GET /settings`

Get all application settings as a key-value map. **Requires:** Any authenticated user.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "store_name": "My Shop",
    "store_address": "123 Main St",
    "tax_rate": "0.08",
    "currency": "USD",
    "receipt_footer": "Thank you for shopping with us!",
    "loyalty_enabled": "true"
  }
}
```

---

### `PUT /settings`

Update one or more settings. **Requires:** `MANAGER` role.

**Request:**
```json
{
  "store_name": "My Updated Shop",
  "tax_rate": "0.10"
}
```

---

## WebSocket Events

Connect to the WebSocket server with your JWT token:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: { token: 'your-jwt-token' }
});
```

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `machine:heartbeat` | `{ machineId: string }` | Register machine as online |
| `machine:offline` | `{ machineId: string }` | Mark machine as offline |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `machine:status` | `{ machineId: string, status: "ONLINE" \| "OFFLINE" }` | Machine status change |
| `transaction:new` | `{ transaction: TransactionObject }` | New transaction completed |
| `inventory:low-stock` | `{ product: ProductObject }` | Product stock dropped below minimum |
| `ai:batch-complete` | `{ type: "segmentation" \| "forecast" }` | AI batch job completed |

### Room-based events

After authenticating, the server automatically joins the socket to a role-based room (e.g. `role:OWNER`). Events targeting specific roles are emitted to these rooms.

### Reconnection handling

```javascript
socket.on('disconnect', () => {
  console.log('Disconnected, attempting reconnect...');
});

socket.on('connect', () => {
  // Re-send machine heartbeat after reconnection
  socket.emit('machine:heartbeat', { machineId: 'POS-001' });
});
```

---

## Error Codes

| HTTP Status | Meaning |
|-------------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Validation error — check `errors` array in response |
| `401` | Missing or invalid JWT token |
| `403` | Insufficient role permissions |
| `404` | Resource not found |
| `409` | Conflict (e.g. duplicate email) |
| `429` | Rate limit exceeded |
| `500` | Internal server error |
