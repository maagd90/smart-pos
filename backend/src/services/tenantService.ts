import { PrismaClient, TenantStatus, SubscriptionPlan } from '@prisma/client';
import { generateSlug, generateDomain } from '../utils/generateSecrets';

export interface CreateTenantInput {
  name: string;
  domain?: string;
  adminEmail: string;
  adminName: string;
  subscriptionPlan?: SubscriptionPlan;
  maxStaff?: number;
  ipWhitelist?: string[];
  ipRestrictEnabled?: boolean;
  aiEnabled?: boolean;
  whatsappEnabled?: boolean;
  smsEnabled?: boolean;
  emailEnabled?: boolean;
}

export interface UpdateTenantInput {
  name?: string;
  domain?: string;
  adminEmail?: string;
  adminName?: string;
  subscriptionPlan?: SubscriptionPlan;
  maxStaff?: number;
  ipWhitelist?: string[];
  ipRestrictEnabled?: boolean;
  status?: TenantStatus;
  aiEnabled?: boolean;
  whatsappEnabled?: boolean;
  smsEnabled?: boolean;
  emailEnabled?: boolean;
}

export async function createTenant(prisma: PrismaClient, input: CreateTenantInput) {
  const slug = generateSlug(input.name);
  const domain = input.domain || generateDomain(input.name, process.env.BASE_DOMAIN || 'smartpos.app');

  const existing = await prisma.tenant.findFirst({
    where: { OR: [{ slug }, { domain }] },
  });
  if (existing) {
    throw new Error('A tenant with this name or domain already exists');
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: input.name,
      slug,
      domain,
      adminEmail: input.adminEmail,
      adminName: input.adminName,
      subscriptionPlan: input.subscriptionPlan || 'FREE',
      maxStaff: input.maxStaff || 5,
      ipWhitelist: input.ipWhitelist || [],
      ipRestrictEnabled: input.ipRestrictEnabled || false,
      aiEnabled: input.aiEnabled || false,
      whatsappEnabled: input.whatsappEnabled !== false,
      smsEnabled: input.smsEnabled || false,
      emailEnabled: input.emailEnabled !== false,
      status: 'CREATING',
      setup: {
        create: {
          currentStep: 'CREATE_RECORD',
          steps: [],
        },
      },
    },
    include: { setup: true },
  });

  return tenant;
}

export async function listTenants(
  prisma: PrismaClient,
  page = 1,
  limit = 20,
  status?: TenantStatus
) {
  const skip = (page - 1) * limit;
  const where = status ? { status } : {};

  const [items, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { setup: true, _count: { select: { apiKeys: true } } },
    }),
    prisma.tenant.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getTenantById(prisma: PrismaClient, id: string) {
  return prisma.tenant.findUnique({
    where: { id },
    include: { setup: true, apiKeys: { where: { status: 'ACTIVE' } } },
  });
}

export async function updateTenant(prisma: PrismaClient, id: string, input: UpdateTenantInput) {
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) throw new Error('Tenant not found');

  return prisma.tenant.update({
    where: { id },
    data: input,
    include: { setup: true },
  });
}

export async function deleteTenant(prisma: PrismaClient, id: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) throw new Error('Tenant not found');

  await prisma.tenant.delete({ where: { id } });
  return { deleted: true };
}

export async function getTenantStatus(prisma: PrismaClient, id: string) {
  const setup = await prisma.tenantSetup.findUnique({ where: { tenantId: id } });
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: { status: true, name: true },
  });
  if (!tenant) throw new Error('Tenant not found');
  return { tenantStatus: tenant.status, name: tenant.name, setup };
}

export function isIpAllowed(clientIp: string, whitelist: string[]): boolean {
  if (!whitelist || whitelist.length === 0) return true;
  if (whitelist.includes('0.0.0.0/0')) return true;

  for (const entry of whitelist) {
    if (entry.includes('/')) {
      if (ipMatchesCidr(clientIp, entry)) return true;
    } else if (entry.includes('-')) {
      if (ipInRange(clientIp, entry)) return true;
    } else if (entry === clientIp) {
      return true;
    }
  }
  return false;
}

function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function ipMatchesCidr(ip: string, cidr: string): boolean {
  try {
    const [network, bits] = cidr.split('/');
    const mask = ~((1 << (32 - parseInt(bits, 10))) - 1) >>> 0;
    return (ipToNumber(ip) & mask) === (ipToNumber(network) & mask);
  } catch {
    return false;
  }
}

function ipInRange(ip: string, range: string): boolean {
  try {
    const [start, end] = range.split('-').map((s) => s.trim());
    const ipNum = ipToNumber(ip);
    return ipNum >= ipToNumber(start) && ipNum <= ipToNumber(end);
  } catch {
    return false;
  }
}
