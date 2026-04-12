import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 10;

async function main() {
  console.log('🌱 Seeding database...');

  // Users
  const ownerPassword = await bcrypt.hash('password123', BCRYPT_ROUNDS);
  const owner = await prisma.user.upsert({
    where: { email: 'admin@shop.com' },
    update: {},
    create: { email: 'admin@shop.com', name: 'Admin Owner', password: ownerPassword, role: 'OWNER' },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@shop.com' },
    update: {},
    create: { email: 'manager@shop.com', name: 'Store Manager', password: ownerPassword, role: 'MANAGER' },
  });

  const cashier1 = await prisma.user.upsert({
    where: { email: 'cashier1@shop.com' },
    update: {},
    create: { email: 'cashier1@shop.com', name: 'John Cashier', password: ownerPassword, role: 'CASHIER' },
  });

  await prisma.user.upsert({
    where: { email: 'cashier2@shop.com' },
    update: {},
    create: { email: 'cashier2@shop.com', name: 'Jane Cashier', password: ownerPassword, role: 'CASHIER' },
  });

  console.log('✅ Users created');

  // Products
  const categories = ['Electronics', 'Food & Beverages', 'Clothing', 'Health & Beauty', 'Home & Garden'];

  const products = [
    { name: 'Wireless Headphones', sku: 'ELEC-001', price: 79.99, costPrice: 35.00, category: 'Electronics', stock: 50, minStock: 10 },
    { name: 'USB-C Charger', sku: 'ELEC-002', price: 29.99, costPrice: 8.00, category: 'Electronics', stock: 100, minStock: 20 },
    { name: 'Bluetooth Speaker', sku: 'ELEC-003', price: 49.99, costPrice: 20.00, category: 'Electronics', stock: 30, minStock: 5 },
    { name: 'Phone Case', sku: 'ELEC-004', price: 14.99, costPrice: 3.00, category: 'Electronics', stock: 200, minStock: 30 },
    { name: 'Screen Protector', sku: 'ELEC-005', price: 9.99, costPrice: 1.50, category: 'Electronics', stock: 150, minStock: 25 },
    { name: 'Organic Coffee Beans', sku: 'FOOD-001', price: 12.99, costPrice: 5.00, category: 'Food & Beverages', stock: 80, minStock: 15 },
    { name: 'Green Tea Pack', sku: 'FOOD-002', price: 8.99, costPrice: 3.00, category: 'Food & Beverages', stock: 60, minStock: 10 },
    { name: 'Protein Bar', sku: 'FOOD-003', price: 3.49, costPrice: 1.20, category: 'Food & Beverages', stock: 120, minStock: 20 },
    { name: 'Mineral Water (500ml)', sku: 'FOOD-004', price: 1.99, costPrice: 0.50, category: 'Food & Beverages', stock: 300, minStock: 50 },
    { name: 'Energy Drink', sku: 'FOOD-005', price: 2.99, costPrice: 0.80, category: 'Food & Beverages', stock: 200, minStock: 40 },
    { name: 'Cotton T-Shirt (L)', sku: 'CLTH-001', price: 24.99, costPrice: 8.00, category: 'Clothing', stock: 40, minStock: 8 },
    { name: 'Denim Jeans', sku: 'CLTH-002', price: 59.99, costPrice: 22.00, category: 'Clothing', stock: 25, minStock: 5 },
    { name: 'Sports Socks (3 pack)', sku: 'CLTH-003', price: 12.99, costPrice: 3.50, category: 'Clothing', stock: 80, minStock: 15 },
    { name: 'Hooded Sweatshirt', sku: 'CLTH-004', price: 44.99, costPrice: 16.00, category: 'Clothing', stock: 30, minStock: 6 },
    { name: 'Baseball Cap', sku: 'CLTH-005', price: 19.99, costPrice: 6.00, category: 'Clothing', stock: 50, minStock: 10 },
    { name: 'Vitamin C Supplement', sku: 'HLTH-001', price: 16.99, costPrice: 5.50, category: 'Health & Beauty', stock: 60, minStock: 12 },
    { name: 'Hand Sanitizer', sku: 'HLTH-002', price: 4.99, costPrice: 1.20, category: 'Health & Beauty', stock: 100, minStock: 20 },
    { name: 'Face Moisturizer', sku: 'HLTH-003', price: 22.99, costPrice: 8.00, category: 'Health & Beauty', stock: 45, minStock: 8 },
    { name: 'Toothbrush Set', sku: 'HLTH-004', price: 9.99, costPrice: 2.50, category: 'Health & Beauty', stock: 70, minStock: 15 },
    { name: 'Shampoo (300ml)', sku: 'HLTH-005', price: 8.99, costPrice: 2.80, category: 'Health & Beauty', stock: 55, minStock: 10 },
    { name: 'Scented Candle', sku: 'HOME-001', price: 18.99, costPrice: 5.00, category: 'Home & Garden', stock: 35, minStock: 7 },
    { name: 'Plant Pot (Medium)', sku: 'HOME-002', price: 14.99, costPrice: 4.50, category: 'Home & Garden', stock: 40, minStock: 8 },
  ];

  const createdProducts = await Promise.all(
    products.map((p) =>
      prisma.product.upsert({
        where: { sku: p.sku },
        update: {},
        create: { ...p, reorderPoint: p.minStock * 2 },
      })
    )
  );

  console.log('✅ Products created');

  // Customers
  const segments = ['VIP', 'PREMIUM', 'REGULAR', 'NEW', 'INACTIVE'] as const;
  const customerData = [
    { name: 'Alice Johnson', email: 'alice@email.com', phone: '+15551001001', segment: 'VIP' as const, totalSpent: 2500, visitCount: 24, loyaltyPoints: 2500 },
    { name: 'Bob Smith', email: 'bob@email.com', phone: '+15551001002', segment: 'VIP' as const, totalSpent: 1800, visitCount: 18, loyaltyPoints: 1800 },
    { name: 'Carol Davis', email: 'carol@email.com', phone: '+15551001003', segment: 'PREMIUM' as const, totalSpent: 900, visitCount: 12, loyaltyPoints: 900 },
    { name: 'David Wilson', email: 'david@email.com', phone: '+15551001004', segment: 'PREMIUM' as const, totalSpent: 750, visitCount: 10, loyaltyPoints: 750 },
    { name: 'Eve Martinez', email: 'eve@email.com', phone: '+15551001005', segment: 'REGULAR' as const, totalSpent: 320, visitCount: 8, loyaltyPoints: 320 },
    { name: 'Frank Brown', email: 'frank@email.com', phone: '+15551001006', segment: 'REGULAR' as const, totalSpent: 280, visitCount: 7, loyaltyPoints: 280 },
    { name: 'Grace Lee', email: 'grace@email.com', phone: '+15551001007', segment: 'NEW' as const, totalSpent: 45, visitCount: 1, loyaltyPoints: 45 },
    { name: 'Hank Taylor', email: 'hank@email.com', phone: '+15551001008', segment: 'NEW' as const, totalSpent: 30, visitCount: 1, loyaltyPoints: 30 },
    { name: 'Iris Chen', email: 'iris@email.com', phone: '+15551001009', segment: 'INACTIVE' as const, totalSpent: 150, visitCount: 4, loyaltyPoints: 150 },
    { name: 'Jack White', email: 'jack@email.com', phone: '+15551001010', segment: 'INACTIVE' as const, totalSpent: 80, visitCount: 2, loyaltyPoints: 80 },
    { name: 'Karen Black', email: 'karen@email.com', phone: '+15551001011', segment: 'REGULAR' as const, totalSpent: 410, visitCount: 9, loyaltyPoints: 410 },
    { name: 'Leo Garcia', email: 'leo@email.com', phone: '+15551001012', segment: 'PREMIUM' as const, totalSpent: 680, visitCount: 11, loyaltyPoints: 680 },
    { name: 'Mia Johnson', email: 'mia@email.com', phone: '+15551001013', segment: 'VIP' as const, totalSpent: 3200, visitCount: 30, loyaltyPoints: 3200 },
    { name: 'Nathan Davis', email: 'nathan@email.com', phone: '+15551001014', segment: 'REGULAR' as const, totalSpent: 220, visitCount: 6, loyaltyPoints: 220 },
    { name: 'Olivia Wilson', email: 'olivia@email.com', phone: '+15551001015', segment: 'NEW' as const, totalSpent: 65, visitCount: 2, loyaltyPoints: 65 },
  ];

  const createdCustomers = await Promise.all(
    customerData.map((c) =>
      prisma.customer.upsert({
        where: { email: c.email },
        update: {},
        create: {
          ...c,
          optInEmail: true,
          optInSms: c.segment !== 'INACTIVE',
          optInWhatsapp: c.segment === 'VIP' || c.segment === 'PREMIUM',
          lastVisit: new Date(Date.now() - Math.random() * 30 * 86400000),
        },
      })
    )
  );

  console.log('✅ Customers created');

  // Transactions
  const paymentMethods = ['CASH', 'CARD', 'DIGITAL_WALLET'] as const;
  const txCount = 100;

  for (let i = 0; i < txCount; i++) {
    const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
    const user = Math.random() > 0.5 ? cashier1 : manager;
    const numItems = Math.floor(Math.random() * 3) + 1;
    const selectedProducts = [...createdProducts].sort(() => Math.random() - 0.5).slice(0, numItems);

    const items = selectedProducts.map((p) => ({
      productId: p.id,
      productName: p.name,
      quantity: Math.floor(Math.random() * 3) + 1,
      price: p.price,
      discount: 0,
    }));

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;
    const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}-${i.toString(36).toUpperCase()}`;

    const daysAgo = Math.floor(Math.random() * 60);
    const createdAt = new Date(Date.now() - daysAgo * 86400000);

    const tx = await prisma.transaction.create({
      data: {
        receiptNumber,
        customerId: customer.id,
        userId: user.id,
        items,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        paymentStatus: 'COMPLETED',
        createdAt,
      },
    });

    await prisma.receipt.create({
      data: { transactionId: tx.id, receiptNumber, createdAt },
    });

    for (const item of items) {
      await prisma.transactionItem.create({
        data: {
          transactionId: tx.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          discount: 0,
        },
      });
    }
  }

  console.log('✅ Transactions created');

  // Default settings
  const defaultSettings = [
    { key: 'store:name', value: 'Smart POS Store', description: 'Store name' },
    { key: 'store:currency', value: 'USD', description: 'Currency' },
    { key: 'store:taxRate', value: '0.08', description: 'Tax rate' },
    { key: 'store:address', value: '123 Main St, City, State', description: 'Store address' },
    { key: 'ai:model', value: 'gpt-3.5-turbo', description: 'AI model to use' },
    { key: 'ai:cacheEnabled', value: 'true', description: 'Enable AI response caching' },
    { key: 'messaging:maxPerMonth', value: '4', description: 'Max messages per customer per month' },
    { key: 'messaging:gapDays', value: '7', description: 'Min days between messages to same customer' },
  ];

  await Promise.all(
    defaultSettings.map((s) =>
      prisma.setting.upsert({
        where: { key: s.key },
        update: {},
        create: s,
      })
    )
  );

  console.log('✅ Settings created');
  console.log('\n🎉 Seed complete!');
  console.log('📧 Login: admin@shop.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
