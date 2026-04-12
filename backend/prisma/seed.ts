import { PrismaClient, Role, CustomerSegment, PaymentMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateReceiptNumber } from '../src/utils/helpers';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartpos.com' },
    update: {},
    create: {
      email: 'admin@smartpos.com',
      password: adminPassword,
      name: 'System Admin',
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // Create manager
  const managerPassword = await bcrypt.hash('Manager@123', 12);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@smartpos.com' },
    update: {},
    create: {
      email: 'manager@smartpos.com',
      password: managerPassword,
      name: 'Store Manager',
      role: Role.MANAGER,
      isActive: true,
    },
  });
  console.log(`✅ Manager user: ${manager.email}`);

  // Create cashier
  const cashierPassword = await bcrypt.hash('Cashier@123', 12);
  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@smartpos.com' },
    update: {},
    create: {
      email: 'cashier@smartpos.com',
      password: cashierPassword,
      name: 'John Cashier',
      role: Role.CASHIER,
      isActive: true,
    },
  });
  console.log(`✅ Cashier user: ${cashier.email}`);

  // Create analyst
  const analystPassword = await bcrypt.hash('Analyst@123', 12);
  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@smartpos.com' },
    update: {},
    create: {
      email: 'analyst@smartpos.com',
      password: analystPassword,
      name: 'Data Analyst',
      role: Role.ANALYST,
      isActive: true,
    },
  });
  console.log(`✅ Analyst user: ${analyst.email}`);

  // Create products
  const productsData = [
    { name: 'Coca-Cola 330ml', sku: 'BEV-001', category: 'Beverages', price: 1.5, cost: 0.8, barcode: '5000112637922', initialStock: 200, reorderPoint: 30 },
    { name: 'Pepsi 330ml', sku: 'BEV-002', category: 'Beverages', price: 1.5, cost: 0.75, barcode: '5000112654683', initialStock: 150, reorderPoint: 30 },
    { name: 'Water Bottle 500ml', sku: 'BEV-003', category: 'Beverages', price: 0.99, cost: 0.3, barcode: '5010477313046', initialStock: 300, reorderPoint: 50 },
    { name: 'Chocolate Bar', sku: 'SNK-001', category: 'Snacks', price: 1.2, cost: 0.6, barcode: '7622210449283', initialStock: 100, reorderPoint: 20 },
    { name: 'Chips Regular', sku: 'SNK-002', category: 'Snacks', price: 1.8, cost: 0.9, barcode: '5060122887564', initialStock: 80, reorderPoint: 15 },
    { name: 'White Bread Loaf', sku: 'BAK-001', category: 'Bakery', price: 2.5, cost: 1.2, barcode: '5010123456789', initialStock: 50, reorderPoint: 10 },
    { name: 'Whole Milk 1L', sku: 'DAI-001', category: 'Dairy', price: 1.8, cost: 1.0, barcode: '5000169005092', initialStock: 120, reorderPoint: 20 },
    { name: 'Cheddar Cheese 200g', sku: 'DAI-002', category: 'Dairy', price: 3.5, cost: 2.0, barcode: '5051426100029', initialStock: 60, reorderPoint: 10 },
    { name: 'Chicken Breast 500g', sku: 'MEA-001', category: 'Meat', price: 5.99, cost: 3.5, barcode: '5010217059462', initialStock: 40, reorderPoint: 8 },
    { name: 'Pasta 500g', sku: 'GRO-001', category: 'Grocery', price: 1.2, cost: 0.6, barcode: '8004005590013', initialStock: 90, reorderPoint: 15 },
    { name: 'Tomato Sauce 400g', sku: 'GRO-002', category: 'Grocery', price: 1.5, cost: 0.7, barcode: '5010056002606', initialStock: 70, reorderPoint: 15 },
    { name: 'Orange Juice 1L', sku: 'BEV-004', category: 'Beverages', price: 2.8, cost: 1.5, barcode: '5029037007079', initialStock: 85, reorderPoint: 15 },
  ];

  const products = [];
  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        name: p.name,
        sku: p.sku,
        category: p.category,
        price: p.price,
        cost: p.cost,
        barcode: p.barcode,
        isActive: true,
        inventory: {
          create: {
            quantity: p.initialStock,
            reorderPoint: p.reorderPoint,
            reorderQuantity: p.reorderPoint * 3,
          },
        },
      },
    });
    products.push(product);
  }
  console.log(`✅ Created ${products.length} products`);

  // Create customers
  const customersData = [
    { name: 'Alice Johnson', phone: '+1234567001', email: 'alice@example.com', segment: CustomerSegment.VIP, loyaltyPoints: 1500 },
    { name: 'Bob Smith', phone: '+1234567002', email: 'bob@example.com', segment: CustomerSegment.REGULAR, loyaltyPoints: 320 },
    { name: 'Carol Williams', phone: '+1234567003', email: 'carol@example.com', segment: CustomerSegment.NEW, loyaltyPoints: 50 },
    { name: 'David Brown', phone: '+1234567004', email: 'david@example.com', segment: CustomerSegment.INACTIVE, loyaltyPoints: 800 },
    { name: 'Emma Davis', phone: '+1234567005', email: 'emma@example.com', segment: CustomerSegment.VIP, loyaltyPoints: 2200 },
    { name: 'Frank Miller', phone: '+1234567006', email: 'frank@example.com', segment: CustomerSegment.REGULAR, loyaltyPoints: 450 },
  ];

  const customers = [];
  for (const c of customersData) {
    const customer = await prisma.customer.upsert({
      where: { email: c.email },
      update: {},
      create: c,
    });
    customers.push(customer);
  }
  console.log(`✅ Created ${customers.length} customers`);

  // Create sample transactions
  for (let i = 0; i < 5; i++) {
    const customer = customers[i % customers.length];
    const product1 = products[i % products.length];
    const product2 = products[(i + 1) % products.length];

    const subtotal = product1.price * 2 + product2.price * 1;
    const tax = subtotal * 0.085;
    const total = subtotal + tax;

    await prisma.transaction.create({
      data: {
        customerId: customer?.id,
        cashierId: cashier.id,
        subtotal,
        tax,
        discount: 0,
        total,
        paymentMethod: i % 2 === 0 ? PaymentMethod.CASH : PaymentMethod.CARD,
        receiptNumber: generateReceiptNumber(),
        items: {
          create: [
            {
              productId: product1.id,
              quantity: 2,
              unitPrice: product1.price,
              discount: 0,
              total: product1.price * 2,
            },
            {
              productId: product2.id,
              quantity: 1,
              unitPrice: product2.price,
              discount: 0,
              total: product2.price,
            },
          ],
        },
      },
    });
  }
  console.log(`✅ Created 5 sample transactions`);

  // Default settings
  await prisma.settings.upsert({
    where: { key: 'store' },
    update: {},
    create: {
      key: 'store',
      value: {
        storeName: 'Smart POS Store',
        storeAddress: '123 Main Street, City, State 12345',
        storePhone: '+1234567890',
        storeEmail: 'store@smartpos.com',
        currency: 'USD',
        taxRate: 8.5,
        loyaltyPointsRate: 1,
        receiptFooter: 'Thank you for shopping with us!',
        timezone: 'UTC',
      },
    },
  });
  console.log('✅ Default settings created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('  Admin:    admin@smartpos.com    / Admin@123456');
  console.log('  Manager:  manager@smartpos.com  / Manager@123');
  console.log('  Cashier:  cashier@smartpos.com  / Cashier@123');
  console.log('  Analyst:  analyst@smartpos.com  / Analyst@123');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
