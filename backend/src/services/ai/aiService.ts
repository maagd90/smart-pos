import OpenAI from 'openai';
import { prisma } from '../../db/prismaClient';
import { getCachedAI, setCachedAI, buildCacheKey } from './aiCache';
import {
  compressCustomerData,
  compressProductData,
  compressStockData,
  buildDemandForecastPrompt,
  buildSegmentationPrompt,
  buildPricingPrompt,
  buildInventoryPrompt,
  buildMessagePrompt,
  CustomerSummary,
  ProductSummary,
  PricingData,
  StockSummary,
} from './tokenOptimizer';
import { logger } from '../../utils/constants';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
const useOllama = process.env.USE_OLLAMA === 'true';
const ollamaModel = process.env.OLLAMA_MODEL || 'llama2';
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

async function callLLM(prompt: string): Promise<string> {
  if (useOllama) {
    const res = await fetch(`${ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: ollamaModel, prompt, stream: false }),
    });
    const data = await res.json() as { response: string };
    return data.response;
  }

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 1000,
  });
  return completion.choices[0]?.message?.content ?? '';
}

function parseJsonResponse<T>(raw: string): T | null {
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as T;
    return null;
  } catch {
    logger.error('Failed to parse AI JSON response', { raw });
    return null;
  }
}

export async function analyzeDemand(products: ProductSummary[]) {
  const cacheKey = buildCacheKey('demand', { ids: products.map((p) => p.id).join(',') });
  const cached = await getCachedAI(cacheKey);
  if (cached) return cached;

  const prompt = buildDemandForecastPrompt(compressProductData(products));
  const raw = await callLLM(prompt);
  const result = parseJsonResponse<unknown[]>(raw) ?? [];

  await setCachedAI(cacheKey, result);
  return result;
}

export async function segmentCustomers(customers: CustomerSummary[]) {
  const cacheKey = buildCacheKey('segment', { ids: customers.map((c) => c.id).join(',') });
  const cached = await getCachedAI(cacheKey);
  if (cached) return cached;

  const prompt = buildSegmentationPrompt(compressCustomerData(customers));
  const raw = await callLLM(prompt);
  const result = parseJsonResponse<unknown[]>(raw) ?? [];

  await setCachedAI(cacheKey, result);
  return result;
}

export async function generatePriceRecommendations(products: PricingData[]) {
  const cacheKey = buildCacheKey('pricing', { ids: products.map((p) => p.id).join(',') });
  const cached = await getCachedAI(cacheKey);
  if (cached) return cached;

  const prompt = buildPricingPrompt(
    products
      .map(
        (p) =>
          `[${p.id.slice(-6)}] ${p.name} (${p.category}): price=${p.currentPrice}, cost=${p.costPrice}, margin=${p.currentMargin.toFixed(1)}%, sold30d=${p.soldLast30Days}`
      )
      .join('\n')
  );
  const raw = await callLLM(prompt);
  const result = parseJsonResponse<unknown[]>(raw) ?? [];

  await setCachedAI(cacheKey, result);
  return result;
}

export async function analyzeInventoryNeeds(items: StockSummary[]) {
  const cacheKey = buildCacheKey('inventory', { ids: items.map((i) => i.id).join(',') });
  const cached = await getCachedAI(cacheKey);
  if (cached) return cached;

  const prompt = buildInventoryPrompt(compressStockData(items));
  const raw = await callLLM(prompt);
  const result = parseJsonResponse<unknown[]>(raw) ?? [];

  await setCachedAI(cacheKey, result);
  return result;
}

export async function generateMessageContent(
  customerId: string,
  offers: string[]
): Promise<{ message: string; subject: string; emoji: boolean }> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      transactions: {
        include: { transactionItems: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!customer) {
    return { message: 'Hello! We have special offers for you.', subject: 'Special Offer', emoji: true };
  }

  const categories: Record<string, number> = {};
  for (const t of customer.transactions) {
    for (const item of t.transactionItems) {
      const cat = item.product.category;
      categories[cat] = (categories[cat] ?? 0) + item.quantity;
    }
  }
  const topCategories = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c]) => c);

  const avgBasket = customer.visitCount > 0 ? customer.totalSpent / customer.visitCount : 0;

  const cacheKey = buildCacheKey('message', {
    customerId: customer.id,
    segment: customer.segment,
    offers: offers.join('|'),
  });
  const cached = await getCachedAI(cacheKey);
  if (cached) return cached as { message: string; subject: string; emoji: boolean };

  const prompt = buildMessagePrompt(
    customer.name,
    customer.segment,
    customer.totalSpent,
    avgBasket,
    topCategories,
    offers
  );
  const raw = await callLLM(prompt);
  const result = parseJsonResponse<{ message: string; subject: string; emoji: boolean }>(raw) ?? {
    message: `Hi ${customer.name}! We have great offers for you. Visit us today!`,
    subject: 'Special Offer Just For You',
    emoji: true,
  };

  await setCachedAI(cacheKey, result, 3600); // Cache for 1 hour
  return result;
}

export async function getCustomerInsights(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      transactions: {
        include: { transactionItems: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!customer) return null;

  const categories: Record<string, number> = {};
  let totalItems = 0;
  for (const t of customer.transactions) {
    for (const item of t.transactionItems) {
      const cat = item.product.category;
      categories[cat] = (categories[cat] ?? 0) + item.price * item.quantity;
      totalItems += item.quantity;
    }
  }

  const daysSinceLastVisit = customer.lastVisit
    ? Math.floor((Date.now() - customer.lastVisit.getTime()) / 86400000)
    : 999;

  const summary: CustomerSummary = {
    id: customer.id,
    name: customer.name,
    totalSpent: customer.totalSpent,
    visitCount: customer.visitCount,
    avgBasket: customer.visitCount > 0 ? customer.totalSpent / customer.visitCount : 0,
    topCategories: Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([c]) => c),
    daysSinceLastVisit,
    daysSinceJoined: Math.floor((Date.now() - customer.createdAt.getTime()) / 86400000),
    loyaltyPoints: customer.loyaltyPoints,
  };

  const cacheKey = buildCacheKey('insights', { customerId });
  const cached = await getCachedAI(cacheKey);
  if (cached) return cached;

  const prompt = `Analyze this customer and provide insights. Return JSON with: churnRisk (low/medium/high), nextPurchasePrediction (days), recommendedOffers (array of strings), lifetimeValueCategory (low/medium/high), personalizedNotes.

Customer: ${compressCustomerData([summary])}

Return only valid JSON object.`;

  const raw = await callLLM(prompt);
  const insights = parseJsonResponse<Record<string, unknown>>(raw) ?? {
    churnRisk: 'low',
    nextPurchasePrediction: 14,
    recommendedOffers: [],
    lifetimeValueCategory: 'medium',
    personalizedNotes: 'Regular customer',
  };

  const result = { customer: summary, insights, totalItems };
  await setCachedAI(cacheKey, result, 3600);
  return result;
}
