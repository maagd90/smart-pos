#!/usr/bin/env node
'use strict';

const { PrismaClient } = require('@prisma/client');

async function seedTenant() {
  const tenantSlug = process.env.TENANT_SLUG;
  const tenantId = process.env.TENANT_ID;

  if (!tenantSlug || !tenantId) {
    console.error('TENANT_SLUG and TENANT_ID are required');
    process.exit(1);
  }

  const dbUrl = process.env.TENANT_DATABASE_URL || process.env.DATABASE_URL;
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

  try {
    console.log(`Seeding data for tenant: ${tenantSlug}`);

    // Create default shop
    const shop = await prisma.shop.create({
      data: {
        name: `${tenantSlug} Main Shop`,
        slug: `${tenantSlug}-main`,
        isActive: true,
      },
    }).catch(() => null);

    if (shop) {
      await prisma.product.createMany({
        data: [
          { shopId: shop.id, name: 'Sample Product 1', price: 9.99, stock: 100, category: 'General' },
          { shopId: shop.id, name: 'Sample Product 2', price: 19.99, stock: 50, category: 'General' },
        ],
        skipDuplicates: true,
      }).catch(() => null);
    }

    console.log(`Seeding complete for tenant: ${tenantSlug}`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedTenant();
