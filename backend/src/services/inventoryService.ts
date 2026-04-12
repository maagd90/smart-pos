import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  CreateProductDto,
  UpdateProductDto,
  UpdateStockDto,
  PaginationQuery,
  PaginatedResponse,
} from '../types';
import { Prisma } from '@prisma/client';

export async function getProducts(
  query: PaginationQuery & { category?: string; isActive?: string }
): Promise<PaginatedResponse<object>> {
  const page = parseInt(query.page ?? '1', 10);
  const limit = parseInt(query.limit ?? '20', 10);
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {};
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { sku: { contains: query.search, mode: 'insensitive' } },
      { barcode: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.category) where.category = query.category;
  if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

  const orderBy: Prisma.ProductOrderByWithRelationInput = query.sortBy
    ? { [query.sortBy]: query.sortOrder ?? 'asc' }
    : { name: 'asc' };

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: { inventory: true },
    }),
    prisma.product.count({ where }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getProductById(id: string): Promise<object> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { inventory: true },
  });
  if (!product) throw new AppError('Product not found', 404);
  return product;
}

export async function createProduct(dto: CreateProductDto): Promise<object> {
  const existing = await prisma.product.findFirst({
    where: { OR: [{ sku: dto.sku }, ...(dto.barcode ? [{ barcode: dto.barcode }] : [])] },
  });
  if (existing) throw new AppError('Product with this SKU or barcode already exists', 409);

  const product = await prisma.product.create({
    data: {
      name: dto.name,
      sku: dto.sku,
      description: dto.description,
      price: dto.price,
      cost: dto.cost ?? 0,
      category: dto.category,
      barcode: dto.barcode,
      imageUrl: dto.imageUrl,
      inventory: {
        create: {
          quantity: dto.initialStock ?? 0,
          reorderPoint: dto.reorderPoint ?? 10,
          reorderQuantity: dto.reorderQuantity ?? 50,
          location: dto.location,
        },
      },
    },
    include: { inventory: true },
  });

  return product;
}

export async function updateProduct(id: string, dto: UpdateProductDto): Promise<object> {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new AppError('Product not found', 404);

  return prisma.product.update({
    where: { id },
    data: dto,
    include: { inventory: true },
  });
}

export async function deleteProduct(id: string): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError('Product not found', 404);

  await prisma.product.update({ where: { id }, data: { isActive: false } });
}

export async function updateStock(productId: string, dto: UpdateStockDto): Promise<object> {
  const inventory = await prisma.inventory.findUnique({ where: { productId } });
  if (!inventory) throw new AppError('Product inventory not found', 404);

  let newQuantity: number;
  if (dto.operation === 'set') newQuantity = dto.quantity;
  else if (dto.operation === 'add') newQuantity = inventory.quantity + dto.quantity;
  else {
    if (inventory.quantity < dto.quantity) throw new AppError('Insufficient stock', 400);
    newQuantity = inventory.quantity - dto.quantity;
  }

  return prisma.inventory.update({
    where: { productId },
    data: {
      quantity: newQuantity,
      ...(dto.location && { location: dto.location }),
      ...(dto.batchNumber && { batchNumber: dto.batchNumber }),
      ...(dto.expiryDate && { expiryDate: new Date(dto.expiryDate) }),
    },
    include: { product: true },
  });
}

export async function getLowStockAlerts(): Promise<object[]> {
  const lowStock = await prisma.inventory.findMany({
    where: {
      quantity: { lte: prisma.inventory.fields.reorderPoint },
      product: { isActive: true },
    },
    include: { product: true },
  });

  // Fallback: use raw comparison
  const all = await prisma.inventory.findMany({
    where: { product: { isActive: true } },
    include: { product: true },
  });

  return all.filter((inv) => inv.quantity <= inv.reorderPoint).map((inv) => ({
    ...inv,
    status: inv.quantity === 0 ? 'out_of_stock' : 'low_stock',
    deficit: inv.reorderPoint - inv.quantity,
  }));
}

export async function getInventoryReport(): Promise<object> {
  const inventories = await prisma.inventory.findMany({
    where: { product: { isActive: true } },
    include: { product: true },
  });

  const items = inventories.map((inv) => ({
    id: inv.product.id,
    name: inv.product.name,
    sku: inv.product.sku,
    quantity: inv.quantity,
    reorderPoint: inv.reorderPoint,
    value: inv.quantity * inv.product.cost,
    status: inv.quantity === 0 ? 'out' : inv.quantity <= inv.reorderPoint ? 'low' : 'ok',
  }));

  return {
    totalProducts: items.length,
    lowStockItems: items.filter((i) => i.status === 'low').length,
    outOfStockItems: items.filter((i) => i.status === 'out').length,
    totalValue: items.reduce((sum, i) => sum + i.value, 0),
    items,
  };
}
