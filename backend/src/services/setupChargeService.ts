import { PrismaClient } from '@prisma/client';

export type SetupChargeStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface EnableGatewayInput {
  tenantId: string;
  gatewayName: string;
}

export async function getAvailableGateways(prisma: PrismaClient) {
  return prisma.paymentGatewayPricing.findMany({
    where: { isAvailable: true },
    orderBy: { displayName: 'asc' },
  });
}

export async function calculateRemainingSetupFees(prisma: PrismaClient, tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('Tenant not found');

  const availableGateways = await prisma.paymentGatewayPricing.findMany({
    where: { isAvailable: true },
  });

  const existingCharges = await prisma.gatewaySetupCharge.findMany({
    where: { tenantId, status: { in: ['PAID'] } },
  });

  const paidGateways = new Set(existingCharges.map((c) => c.gatewayName));

  const remaining = availableGateways
    .filter((g) => !paidGateways.has(g.gatewayName))
    .map((g) => ({
      gatewayName: g.gatewayName,
      displayName: g.displayName,
      setupFee: g.setupFee,
      description: g.description,
    }));

  return {
    tenantId,
    subscriptionPlan: tenant.subscriptionPlan,
    maxGatewaysIncluded: tenant.maxGatewaysIncluded,
    enabledGatewayCount: tenant.enabledGatewayCount,
    remainingGateways: remaining,
  };
}

export async function enableGateway(
  prisma: PrismaClient,
  tenantId: string,
  gatewayName: string
) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('Tenant not found');

  const pricing = await prisma.paymentGatewayPricing.findUnique({
    where: { gatewayName },
  });
  if (!pricing) throw new Error(`Gateway "${gatewayName}" not found`);
  if (!pricing.isAvailable) throw new Error(`Gateway "${gatewayName}" is not available`);

  const existing = await prisma.gatewaySetupCharge.findUnique({
    where: { tenantId_gatewayName: { tenantId, gatewayName } },
  });
  if (existing) {
    if (existing.status === 'PAID') {
      throw new Error(`Gateway "${gatewayName}" is already enabled for this tenant`);
    }
    if (existing.status === 'PENDING') {
      throw new Error(`A pending setup charge already exists for gateway "${gatewayName}"`);
    }
  }

  const charge = await prisma.gatewaySetupCharge.create({
    data: {
      tenantId,
      gatewayName,
      setupFee: pricing.setupFee,
      status: 'PENDING',
    },
  });

  return charge;
}

export async function markSetupFeePaid(prisma: PrismaClient, chargeId: string) {
  const charge = await prisma.gatewaySetupCharge.findUnique({ where: { id: chargeId } });
  if (!charge) throw new Error('Setup charge not found');
  if (charge.status === 'PAID') throw new Error('Setup charge is already paid');

  const updated = await prisma.gatewaySetupCharge.update({
    where: { id: chargeId },
    data: { status: 'PAID', paidDate: new Date() },
  });

  await prisma.tenant.update({
    where: { id: charge.tenantId },
    data: { enabledGatewayCount: { increment: 1 } },
  });

  return updated;
}

export async function getSetupChargeHistory(prisma: PrismaClient, tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('Tenant not found');

  return prisma.gatewaySetupCharge.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAdminRevenue(prisma: PrismaClient, year: number, month: number) {
  const periodString = `${year}-${String(month).padStart(2, '0')}`;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const paidCharges = await prisma.gatewaySetupCharge.findMany({
    where: {
      status: 'PAID',
      paidDate: { gte: startDate, lt: endDate },
    },
  });

  const setupFeeRevenue = paidCharges.reduce((sum, c) => sum + c.setupFee, 0);

  const setupFeeByGateway: Record<string, number> = {};
  for (const charge of paidCharges) {
    setupFeeByGateway[charge.gatewayName] =
      (setupFeeByGateway[charge.gatewayName] || 0) + charge.setupFee;
  }

  const existing = await prisma.adminRevenueSummary.findUnique({
    where: { periodString },
  });

  const subscriptionRevenue = existing?.subscriptionRevenue ?? 0;
  const totalRevenue = subscriptionRevenue + setupFeeRevenue;

  const summary = await prisma.adminRevenueSummary.upsert({
    where: { periodString },
    update: { setupFeeRevenue, totalRevenue, setupFeeByGateway },
    create: {
      year,
      month,
      periodString,
      subscriptionRevenue,
      setupFeeRevenue,
      totalRevenue,
      setupFeeByGateway,
    },
  });

  return summary;
}

export async function listAllSetupCharges(
  prisma: PrismaClient,
  status?: string,
  tenantId?: string
) {
  const where: Record<string, unknown> = {};
  if (status) where['status'] = status;
  if (tenantId) where['tenantId'] = tenantId;

  return prisma.gatewaySetupCharge.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { tenant: { select: { name: true, slug: true } } },
  });
}
