/**
 * Token optimization strategies:
 * 1. Data compression - send summaries not raw data
 * 2. Batch processing - multiple items in one call
 * 3. Structured prompts - minimal tokens while retaining context
 */

export interface ProductSummary {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  soldLast30Days: number;
  soldLast90Days: number;
}

export interface CustomerSummary {
  id: string;
  name: string;
  totalSpent: number;
  visitCount: number;
  avgBasket: number;
  topCategories: string[];
  daysSinceLastVisit: number;
  daysSinceJoined: number;
  loyaltyPoints: number;
}

export interface PricingData {
  id: string;
  name: string;
  category: string;
  currentPrice: number;
  costPrice: number;
  currentMargin: number;
  soldLast30Days: number;
  competitorPriceRange?: { min: number; max: number };
}

export interface StockSummary {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  reorderPoint: number;
  avgDailySales: number;
  daysUntilStockout: number;
}

export function compressCustomerData(customers: CustomerSummary[]): string {
  return customers
    .map(
      (c) =>
        `[${c.id.slice(-6)}] ${c.name}: spent=${c.totalSpent.toFixed(0)}, visits=${c.visitCount}, avg=${c.avgBasket.toFixed(0)}, cats=${c.topCategories.join('/')}, lastVisit=${c.daysSinceLastVisit}d, joined=${c.daysSinceJoined}d, pts=${c.loyaltyPoints}`
    )
    .join('\n');
}

export function compressProductData(products: ProductSummary[]): string {
  return products
    .map(
      (p) =>
        `[${p.id.slice(-6)}] ${p.name} (${p.category}): price=${p.price}, stock=${p.stock}/${p.minStock}, sold30d=${p.soldLast30Days}, sold90d=${p.soldLast90Days}`
    )
    .join('\n');
}

export function compressStockData(items: StockSummary[]): string {
  return items
    .map(
      (s) =>
        `[${s.id.slice(-6)}] ${s.name}: stock=${s.currentStock}/${s.reorderPoint}, avgDaily=${s.avgDailySales.toFixed(1)}, daysLeft=${s.daysUntilStockout}`
    )
    .join('\n');
}

export function buildDemandForecastPrompt(data: string): string {
  return `Analyze these products and forecast demand for the next 30 days. Return JSON array with id, forecastedDemand, confidence, trend (up/down/stable), recommendation.

Products:
${data}

Return only valid JSON array, no explanation.`;
}

export function buildSegmentationPrompt(data: string): string {
  return `Segment these customers into VIP/PREMIUM/REGULAR/NEW/INACTIVE and suggest personalized offers. Return JSON array with id, segment, reasoning, suggestedOffer.

Customers:
${data}

Return only valid JSON array, no explanation.`;
}

export function buildPricingPrompt(data: string): string {
  return `Analyze these products and suggest optimal pricing. Return JSON array with id, suggestedPrice, expectedImpactPct, reasoning.

Products:
${data}

Return only valid JSON array, no explanation.`;
}

export function buildInventoryPrompt(data: string): string {
  return `Analyze these inventory levels and recommend reorder actions. Return JSON array with id, action (order/watch/ok), suggestedOrderQty, urgency (high/medium/low), reasoning.

Items:
${data}

Return only valid JSON array, no explanation.`;
}

export function buildMessagePrompt(
  customerName: string,
  segment: string,
  totalSpent: number,
  avgBasket: number,
  topCategories: string[],
  offers: string[]
): string {
  return `Write a personalized, friendly marketing message for this customer. Keep it under 160 characters for SMS.

Customer: ${customerName}, segment: ${segment}, total spent: $${totalSpent.toFixed(0)}, avg basket: $${avgBasket.toFixed(0)}, interests: ${topCategories.join(', ')}.
Available offers: ${offers.join('; ')}.

Return JSON with: message (string), subject (for email), emoji (bool).`;
}
