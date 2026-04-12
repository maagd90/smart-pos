import db from './db';

function seedDatabase() {
  // Clear existing data
  db.exec(`
    DELETE FROM messages;
    DELETE FROM sale_items;
    DELETE FROM sales;
    DELETE FROM customers;
    DELETE FROM products;
  `);

  // Insert products
  const insertProduct = db.prepare(`
    INSERT INTO products (name, description, price, cost, quantity, category, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const products = [
    ['iPhone 15 Case', 'Premium protective case for iPhone 15', 29.99, 8.50, 150, 'Electronics', 'https://example.com/iphone-case.jpg'],
    ['Wireless Earbuds', 'Bluetooth 5.0 wireless earbuds with 24hr battery', 79.99, 25.00, 85, 'Electronics', 'https://example.com/earbuds.jpg'],
    ['USB-C Hub', '7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader', 49.99, 18.00, 60, 'Electronics', 'https://example.com/usb-hub.jpg'],
    ['Organic Coffee Beans', 'Single-origin Ethiopian coffee, 500g', 18.99, 7.50, 200, 'Food', 'https://example.com/coffee.jpg'],
    ['Green Tea Set', 'Premium Japanese green tea collection, 20 bags', 14.99, 4.00, 180, 'Food', 'https://example.com/tea.jpg'],
    ['Protein Bar Pack', 'Chocolate peanut butter protein bars, 12 pack', 24.99, 10.00, 120, 'Food', 'https://example.com/protein-bars.jpg'],
    ['Classic T-Shirt', '100% cotton unisex t-shirt, multiple colors', 22.99, 6.00, 300, 'Clothing', 'https://example.com/tshirt.jpg'],
    ['Running Shorts', 'Lightweight moisture-wicking running shorts', 34.99, 12.00, 95, 'Clothing', 'https://example.com/shorts.jpg'],
    ['Yoga Mat', 'Non-slip premium yoga mat, 6mm thick', 44.99, 15.00, 70, 'Sports', 'https://example.com/yoga-mat.jpg'],
    ['Water Bottle', 'Insulated stainless steel 32oz water bottle', 32.99, 11.00, 110, 'Sports', 'https://example.com/water-bottle.jpg'],
  ];

  const productIds: number[] = [];
  for (const product of products) {
    const result = insertProduct.run(...product);
    productIds.push(result.lastInsertRowid as number);
  }

  // Insert customers
  const insertCustomer = db.prepare(`
    INSERT INTO customers (name, email, phone, address)
    VALUES (?, ?, ?, ?)
  `);

  const customers = [
    ['Alice Johnson', 'alice@example.com', '555-0101', '123 Main St, Springfield, IL 62701'],
    ['Bob Martinez', 'bob@example.com', '555-0102', '456 Oak Ave, Chicago, IL 60601'],
    ['Carol White', 'carol@example.com', '555-0103', '789 Pine Rd, Naperville, IL 60540'],
    ['David Lee', 'david@example.com', '555-0104', '321 Elm St, Rockford, IL 61101'],
    ['Emma Davis', 'emma@example.com', '555-0105', '654 Maple Dr, Peoria, IL 61602'],
  ];

  const customerIds: number[] = [];
  for (const customer of customers) {
    const result = insertCustomer.run(...customer);
    customerIds.push(result.lastInsertRowid as number);
  }

  // Insert sales over the past 30 days
  const insertSale = db.prepare(`
    INSERT INTO sales (customer_id, total_amount, payment_method, created_at)
    VALUES (?, ?, ?, ?)
  `);

  const insertSaleItem = db.prepare(`
    INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price)
    VALUES (?, ?, ?, ?, ?)
  `);

  const paymentMethods = ['cash', 'card', 'digital'];

  const salesData = [
    // Alice buys electronics frequently
    { customerId: customerIds[0], daysAgo: 2, items: [[productIds[0], 1, 29.99], [productIds[1], 1, 79.99]] },
    { customerId: customerIds[0], daysAgo: 8, items: [[productIds[2], 1, 49.99]] },
    { customerId: customerIds[0], daysAgo: 15, items: [[productIds[1], 1, 79.99], [productIds[9], 1, 32.99]] },
    { customerId: customerIds[0], daysAgo: 22, items: [[productIds[0], 2, 29.99]] },

    // Bob buys food and sports
    { customerId: customerIds[1], daysAgo: 1, items: [[productIds[3], 2, 18.99], [productIds[4], 1, 14.99]] },
    { customerId: customerIds[1], daysAgo: 5, items: [[productIds[5], 1, 24.99], [productIds[8], 1, 44.99]] },
    { customerId: customerIds[1], daysAgo: 12, items: [[productIds[3], 1, 18.99], [productIds[9], 1, 32.99]] },
    { customerId: customerIds[1], daysAgo: 19, items: [[productIds[5], 2, 24.99]] },
    { customerId: customerIds[1], daysAgo: 28, items: [[productIds[4], 3, 14.99]] },

    // Carol buys clothing
    { customerId: customerIds[2], daysAgo: 3, items: [[productIds[6], 3, 22.99], [productIds[7], 1, 34.99]] },
    { customerId: customerIds[2], daysAgo: 10, items: [[productIds[7], 2, 34.99]] },
    { customerId: customerIds[2], daysAgo: 17, items: [[productIds[6], 2, 22.99], [productIds[8], 1, 44.99]] },

    // David buys mixed
    { customerId: customerIds[3], daysAgo: 4, items: [[productIds[2], 1, 49.99], [productIds[3], 1, 18.99]] },
    { customerId: customerIds[3], daysAgo: 11, items: [[productIds[9], 2, 32.99], [productIds[5], 1, 24.99]] },
    { customerId: customerIds[3], daysAgo: 25, items: [[productIds[0], 1, 29.99]] },

    // Emma buys sports and food
    { customerId: customerIds[4], daysAgo: 2, items: [[productIds[8], 1, 44.99], [productIds[9], 1, 32.99]] },
    { customerId: customerIds[4], daysAgo: 7, items: [[productIds[4], 2, 14.99], [productIds[5], 1, 24.99]] },
    { customerId: customerIds[4], daysAgo: 14, items: [[productIds[3], 2, 18.99]] },
    { customerId: customerIds[4], daysAgo: 21, items: [[productIds[8], 1, 44.99]] },
    { customerId: customerIds[4], daysAgo: 29, items: [[productIds[9], 1, 32.99], [productIds[6], 1, 22.99]] },
  ];

  for (let i = 0; i < salesData.length; i++) {
    const saleData = salesData[i];
    const date = new Date();
    date.setDate(date.getDate() - saleData.daysAgo);
    const createdAt = date.toISOString();

    const totalAmount = saleData.items.reduce((sum, item) => sum + (item[1] as number) * (item[2] as number), 0);
    const paymentMethod = paymentMethods[i % paymentMethods.length];

    const saleResult = insertSale.run(saleData.customerId, totalAmount, paymentMethod, createdAt);
    const saleId = saleResult.lastInsertRowid as number;

    for (const item of saleData.items) {
      const [productId, qty, unitPrice] = item as [number, number, number];
      insertSaleItem.run(saleId, productId, qty, unitPrice, qty * unitPrice);
    }
  }

  console.log('✅ Database seeded successfully!');
  console.log(`   - ${products.length} products`);
  console.log(`   - ${customers.length} customers`);
  console.log(`   - ${salesData.length} sales transactions`);
}

seedDatabase();
