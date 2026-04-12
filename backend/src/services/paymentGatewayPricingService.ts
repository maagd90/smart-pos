import { PrismaClient } from '@prisma/client';

export async function getAllPricings(prisma: PrismaClient) {
  return prisma.paymentGatewayPricing.findMany({
    orderBy: { displayName: 'asc' },
  });
}

export async function updateGatewayPricing(
  prisma: PrismaClient,
  gatewayName: string,
  setupFee: number
) {
  const pricing = await prisma.paymentGatewayPricing.findUnique({ where: { gatewayName } });
  if (!pricing) throw new Error(`Gateway pricing for "${gatewayName}" not found`);

  return prisma.paymentGatewayPricing.update({
    where: { gatewayName },
    data: { setupFee },
  });
}

export async function toggleGatewayAvailability(
  prisma: PrismaClient,
  gatewayName: string,
  isAvailable: boolean
) {
  const pricing = await prisma.paymentGatewayPricing.findUnique({ where: { gatewayName } });
  if (!pricing) throw new Error(`Gateway pricing for "${gatewayName}" not found`);

  return prisma.paymentGatewayPricing.update({
    where: { gatewayName },
    data: { isAvailable },
  });
}

export async function createNewGateway(
  prisma: PrismaClient,
  gatewayName: string,
  displayName: string,
  setupFee: number,
  description?: string
) {
  const existing = await prisma.paymentGatewayPricing.findUnique({ where: { gatewayName } });
  if (existing) throw new Error(`Gateway "${gatewayName}" already exists`);

  return prisma.paymentGatewayPricing.create({
    data: { gatewayName, displayName, setupFee, description },
  });
}

export async function getGatewayByName(prisma: PrismaClient, gatewayName: string) {
  const pricing = await prisma.paymentGatewayPricing.findUnique({ where: { gatewayName } });
  if (!pricing) throw new Error(`Gateway "${gatewayName}" not found`);
  return pricing;
}
