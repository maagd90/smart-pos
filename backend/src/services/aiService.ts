import { prisma } from '../config/database';
import { env } from '../config/environment';
import { AppError } from '../middleware/errorHandler';
import { AIAnalyticsType } from '@prisma/client';
import { DemandForecastDto, PriceSuggestionDto } from '../types';
import { logger } from '../config/logger';

function requireAiEnabled(): void {
  if (!env.features.aiEnabled) {
    throw new AppError('AI features are not enabled', 503);
  }
}

async function callLLM(prompt: string): Promise<string> {
  if (env.llm.type === 'ollama') {
    const response = await fetch(`${env.llm.ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: env.llm.ollamaModel,
        prompt,
        stream: false,
      }),
    });
    if (!response.ok) throw new AppError('Ollama request failed', 502);
    const data = await response.json() as { response: string };
    return data.response;
  } else {
    // OpenAI
    if (!env.llm.openaiApiKey) throw new AppError('OpenAI API key not configured', 503);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.llm.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      logger.error('OpenAI error', { status: response.status, body: err });
      throw new AppError('OpenAI request failed', 502);
    }
    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content ?? '';
  }
}

export async function getDemandForecast(dto: DemandForecastDto): Promise<object> {
  requireAiEnabled();

  const days = dto.days ?? 30;

  // Gather historical sales data
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const where: Record<string, unknown> = { createdAt: { gte: since } };
  if (dto.productId) where['productId'] = dto.productId;

  const salesData = await prisma.transactionItem.groupBy({
    by: ['productId'],
    where: dto.productId ? { productId: dto.productId } : undefined,
    _sum: { quantity: true },
    _count: { id: true },
  });

  const products = await prisma.product.findMany({
    where: {
      id: { in: salesData.map((s) => s.productId) },
      ...(dto.category ? { category: dto.category } : {}),
    },
    include: { inventory: true },
  });

  const prompt = `You are a retail demand forecasting AI. Based on the following 90-day sales data, predict demand for the next ${days} days.

Sales data (JSON):
${JSON.stringify(
  salesData.map((s) => {
    const product = products.find((p) => p.id === s.productId);
    return {
      product: product?.name,
      category: product?.category,
      totalSold: s._sum.quantity,
      transactions: s._count.id,
      currentStock: product?.inventory?.quantity,
    };
  }),
  null,
  2
)}

Return a JSON array with forecasts. Each item: { productId, productName, predictedDemand, confidence, recommendation }.`;

  try {
    const aiResponse = await callLLM(prompt);
    let parsed: unknown;
    try {
      const match = aiResponse.match(/\[[\s\S]*\]/);
      parsed = match ? JSON.parse(match[0]) : { rawResponse: aiResponse };
    } catch {
      parsed = { rawResponse: aiResponse };
    }

    const analytics = await prisma.aIAnalytics.create({
      data: {
        type: AIAnalyticsType.DEMAND_FORECAST,
        data: parsed as object,
        confidence: 0.75,
      },
    });

    return { forecast: parsed, analyticsId: analytics.id, generatedAt: new Date() };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to generate demand forecast', 502);
  }
}

export async function getCustomerRecommendations(customerId: string): Promise<object> {
  requireAiEnabled();

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          items: { include: { product: true } },
        },
      },
    },
  });
  if (!customer) throw new AppError('Customer not found', 404);

  const purchaseHistory = customer.transactions.flatMap((t) =>
    t.items.map((i) => ({ product: i.product.name, category: i.product.category, quantity: i.quantity }))
  );

  const prompt = `You are a retail recommendation AI. Based on this customer's purchase history, suggest 5 products they might want to buy.

Customer: ${customer.name}, Segment: ${customer.segment}, Loyalty Points: ${customer.loyaltyPoints}

Recent purchases:
${JSON.stringify(purchaseHistory, null, 2)}

Return a JSON array of recommendations: { productName, category, reason, confidence }.`;

  try {
    const aiResponse = await callLLM(prompt);
    let recommendations: unknown;
    try {
      const match = aiResponse.match(/\[[\s\S]*\]/);
      recommendations = match ? JSON.parse(match[0]) : { rawResponse: aiResponse };
    } catch {
      recommendations = { rawResponse: aiResponse };
    }

    const analytics = await prisma.aIAnalytics.create({
      data: {
        type: AIAnalyticsType.CUSTOMER_SEGMENT,
        data: { customerId, recommendations } as object,
        confidence: 0.7,
      },
    });

    return { recommendations, analyticsId: analytics.id, generatedAt: new Date() };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to generate recommendations', 502);
  }
}

export async function getPriceSuggestions(dto: PriceSuggestionDto): Promise<object> {
  requireAiEnabled();
  if (!env.features.dynamicPricingEnabled) {
    throw new AppError('Dynamic pricing feature is not enabled', 503);
  }

  const product = await prisma.product.findUnique({
    where: { id: dto.productId },
    include: { inventory: true },
  });
  if (!product) throw new AppError('Product not found', 404);

  const salesHistory = await prisma.transactionItem.findMany({
    where: { productId: dto.productId },
    orderBy: { transaction: { createdAt: 'desc' } },
    take: 100,
    include: { transaction: { select: { createdAt: true } } },
  });

  const prompt = `You are a retail pricing AI. Suggest an optimal price for the following product.

Product: ${product.name}
Current Price: $${product.price}
Cost: $${product.cost}
Current Stock: ${product.inventory?.quantity ?? 0}
Target Margin: ${dto.targetMargin ?? 30}%
Competitor Prices: ${dto.competitorPrices?.join(', ') ?? 'not provided'}

Sales data (last 100 transactions):
- Average quantity per transaction: ${salesHistory.length > 0 ? (salesHistory.reduce((s, i) => s + i.quantity, 0) / salesHistory.length).toFixed(2) : 0}
- Total units sold: ${salesHistory.reduce((s, i) => s + i.quantity, 0)}

Return JSON: { suggestedPrice, minPrice, maxPrice, expectedMargin, rationale, confidence }.`;

  try {
    const aiResponse = await callLLM(prompt);
    let suggestion: unknown;
    try {
      const match = aiResponse.match(/\{[\s\S]*\}/);
      suggestion = match ? JSON.parse(match[0]) : { rawResponse: aiResponse };
    } catch {
      suggestion = { rawResponse: aiResponse };
    }

    const analytics = await prisma.aIAnalytics.create({
      data: {
        type: AIAnalyticsType.PRICE_SUGGESTION,
        data: { productId: dto.productId, suggestion } as object,
        confidence: 0.65,
      },
    });

    return { suggestion, product: { id: product.id, name: product.name, currentPrice: product.price }, analyticsId: analytics.id };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to generate price suggestion', 502);
  }
}

export async function getInsights(): Promise<object> {
  requireAiEnabled();

  const recent = await prisma.aIAnalytics.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const salesSummary = await prisma.transaction.aggregate({
    _sum: { total: true },
    _count: { id: true },
    where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
  });

  const topProducts = await prisma.transactionItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { total: 'desc' } },
    take: 5,
  });

  return {
    recentAnalytics: recent,
    weekSummary: {
      totalRevenue: salesSummary._sum.total ?? 0,
      totalTransactions: salesSummary._count.id,
    },
    topProducts,
    generatedAt: new Date(),
  };
}
