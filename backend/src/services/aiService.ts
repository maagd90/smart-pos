import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

interface SaleItem {
  product_name: string;
  category: string;
  quantity: number;
  total_price: number;
  sale_date: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
}

interface Customer {
  id: number;
  name: string;
  email: string;
}

async function callOpenAI(prompt: string): Promise<string> {
  if (!client) {
    return 'AI analysis unavailable: No OpenAI API key configured. Please set OPENAI_API_KEY environment variable.';
  }
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1000,
  });
  return response.choices[0]?.message?.content ?? 'No response from AI.';
}

export async function analyzeDemand(salesData: SaleItem[]): Promise<string> {
  if (!salesData.length) {
    return 'No sales data available for analysis.';
  }

  const summary = salesData.reduce<Record<string, { qty: number; revenue: number; category: string }>>((acc, item) => {
    if (!acc[item.product_name]) {
      acc[item.product_name] = { qty: 0, revenue: 0, category: item.category };
    }
    acc[item.product_name].qty += item.quantity;
    acc[item.product_name].revenue += item.total_price;
    return acc;
  }, {});

  const prompt = `You are a retail analytics expert. Analyze the following sales data and provide insights on demand patterns, top performers, and underperforming products. Be specific and actionable.

Sales Summary (last 30 days):
${JSON.stringify(summary, null, 2)}

Provide:
1. Top 3 best-selling products and why they might be popular
2. Products with declining or low demand
3. Category-level trends
4. Actionable recommendations for inventory management`;

  if (!client) {
    return `Mock Demand Analysis:
Top Performers: Based on the sales data, Wireless Earbuds and Yoga Mat show strong demand.
Low Performers: USB-C Hub may need promotional push.
Recommendation: Consider bundling electronics accessories for higher average order value.
Note: Configure OPENAI_API_KEY for real AI analysis.`;
  }

  return callOpenAI(prompt);
}

export async function getCustomerInsights(customer: Customer, purchases: SaleItem[]): Promise<string> {
  if (!purchases.length) {
    return `No purchase history found for customer ${customer.name}.`;
  }

  const prompt = `You are a customer success analyst. Analyze this customer's purchase history and provide actionable insights.

Customer: ${customer.name} (${customer.email})

Purchase History:
${JSON.stringify(purchases, null, 2)}

Provide:
1. Customer segment (e.g., high-value, occasional, category-specific)
2. Preferred product categories and price range
3. Purchase frequency patterns
4. Churn risk assessment
5. Personalized recommendations to increase loyalty`;

  if (!client) {
    return `Mock Customer Insights for ${customer.name}:
Segment: Regular buyer with consistent purchase patterns.
Preferences: Shows interest in multiple categories.
Frequency: Purchases approximately every 7-10 days.
Churn Risk: Low - active buyer.
Recommendation: Offer loyalty discount on next purchase.
Note: Configure OPENAI_API_KEY for real AI analysis.`;
  }

  return callOpenAI(prompt);
}

export async function getDealRecommendations(inventory: Product[], salesData: SaleItem[]): Promise<string> {
  const lowStock = inventory.filter(p => p.quantity < 20);
  const overstocked = inventory.filter(p => p.quantity > 100);

  const salesSummary = salesData.reduce<Record<string, number>>((acc, item) => {
    acc[item.product_name] = (acc[item.product_name] || 0) + item.quantity;
    return acc;
  }, {});

  const prompt = `You are a retail promotions strategist. Recommend deals and promotions to maximize profit.

Current Inventory Status:
- Overstocked items (qty > 100): ${JSON.stringify(overstocked.map(p => ({ name: p.name, qty: p.quantity, price: p.price, cost: p.cost })))}
- Low stock items (qty < 20): ${JSON.stringify(lowStock.map(p => ({ name: p.name, qty: p.quantity, price: p.price, cost: p.cost })))}

Recent Sales Volume:
${JSON.stringify(salesSummary)}

Provide:
1. 3-5 specific promotional deals with discount percentages
2. Bundle recommendations
3. Flash sale candidates
4. Cross-sell opportunities
5. Expected impact on revenue and profit margin`;

  if (!client) {
    return `Mock Deal Recommendations:
1. Bundle Deal: Electronics accessories bundle (Case + Earbuds) at 15% off
2. Flash Sale: Overstocked clothing items at 20% off for 48 hours
3. BOGO: Buy 2 food items, get 10% off
4. Loyalty Reward: 5% cashback on orders over $50
5. Category Promotion: Sports equipment bundle discount
Note: Configure OPENAI_API_KEY for real AI analysis.`;
  }

  return callOpenAI(prompt);
}

export async function generateCustomerMessage(
  customer: Customer,
  insights: string,
  dealType: string
): Promise<string> {
  const prompt = `You are a marketing copywriter for a retail store. Write a personalized, friendly promotional message for this customer.

Customer Name: ${customer.name}
Deal Type: ${dealType}
Customer Insights: ${insights}

Requirements:
- Keep it under 150 words
- Be personal and warm, use their first name
- Include a specific call-to-action
- Make the deal sound exciting but not pushy
- Sound like it comes from a real person, not a bot

Write only the message content, no subject line or metadata.`;

  if (!client) {
    const firstName = customer.name.split(' ')[0];
    return `Hi ${firstName}! We've been thinking about you and wanted to share something special. As one of our valued customers, you're getting exclusive access to our latest deals curated just for you. Stop by today and enjoy 10% off your next purchase — our way of saying thank you for your loyalty. We have some amazing new arrivals we think you'll love! See you soon. 😊`;
  }

  return callOpenAI(prompt);
}
