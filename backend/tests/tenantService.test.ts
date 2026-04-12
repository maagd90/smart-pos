import { createTenant, listTenants, getTenantById, updateTenant, deleteTenant, getTenantStatus } from '../src/services/tenantService';

const mockTenant = {
  id: 'tenant-1',
  name: 'Acme Corp',
  slug: 'acme-corp',
  domain: 'acme-corp.smartpos.app',
  adminEmail: 'admin@acme.com',
  adminName: 'John Doe',
  status: 'CREATING' as const,
  subscriptionPlan: 'FREE' as const,
  maxStaff: 5,
  ipWhitelist: [],
  ipRestrictEnabled: false,
  aiEnabled: false,
  whatsappEnabled: true,
  smsEnabled: false,
  emailEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  setup: { id: 'setup-1', tenantId: 'tenant-1', currentStep: 'CREATE_RECORD', steps: [], createdAt: new Date(), updatedAt: new Date() },
};

const makePrisma = (overrides: Partial<any> = {}) => ({
  tenant: {
    findFirst: jest.fn().mockResolvedValue(null),
    findUnique: jest.fn().mockResolvedValue(mockTenant),
    create: jest.fn().mockResolvedValue(mockTenant),
    findMany: jest.fn().mockResolvedValue([mockTenant]),
    count: jest.fn().mockResolvedValue(1),
    update: jest.fn().mockResolvedValue({ ...mockTenant, status: 'ACTIVE' }),
    delete: jest.fn().mockResolvedValue(mockTenant),
  },
  tenantSetup: {
    findUnique: jest.fn().mockResolvedValue(mockTenant.setup),
  },
  ...overrides,
});

describe('tenantService', () => {
  describe('createTenant', () => {
    it('creates a tenant with auto-generated slug and domain', async () => {
      const prisma = makePrisma() as any;
      const result = await createTenant(prisma, {
        name: 'Acme Corp',
        adminEmail: 'admin@acme.com',
        adminName: 'John Doe',
      });
      expect(prisma.tenant.findFirst).toHaveBeenCalledWith({
        where: { OR: [{ slug: 'acme-corp' }, { domain: 'acme-corp.smartpos.app' }] },
      });
      expect(prisma.tenant.create).toHaveBeenCalled();
      expect(result).toEqual(mockTenant);
    });

    it('throws if tenant with same slug or domain exists', async () => {
      const prisma = makePrisma({
        tenant: {
          ...makePrisma().tenant,
          findFirst: jest.fn().mockResolvedValue(mockTenant),
        },
      }) as any;
      await expect(
        createTenant(prisma, { name: 'Acme Corp', adminEmail: 'admin@acme.com', adminName: 'John' })
      ).rejects.toThrow('A tenant with this name or domain already exists');
    });

    it('uses provided custom domain', async () => {
      const prisma = makePrisma() as any;
      await createTenant(prisma, {
        name: 'Acme Corp',
        domain: 'custom.example.com',
        adminEmail: 'admin@acme.com',
        adminName: 'John',
      });
      expect(prisma.tenant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ domain: 'custom.example.com' }),
        })
      );
    });
  });

  describe('listTenants', () => {
    it('returns paginated tenants', async () => {
      const prisma = makePrisma() as any;
      const result = await listTenants(prisma, 1, 20);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('filters by status when provided', async () => {
      const prisma = makePrisma() as any;
      await listTenants(prisma, 1, 20, 'ACTIVE' as any);
      expect(prisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'ACTIVE' } })
      );
    });
  });

  describe('getTenantById', () => {
    it('returns tenant with setup and apiKeys', async () => {
      const prisma = makePrisma() as any;
      const result = await getTenantById(prisma, 'tenant-1');
      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        include: { setup: true, apiKeys: { where: { status: 'ACTIVE' } } },
      });
      expect(result).toEqual(mockTenant);
    });
  });

  describe('updateTenant', () => {
    it('updates tenant and returns updated record', async () => {
      const prisma = makePrisma() as any;
      const result = await updateTenant(prisma, 'tenant-1', { status: 'ACTIVE' as any });
      expect(prisma.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'tenant-1' } })
      );
      expect(result.status).toBe('ACTIVE');
    });

    it('throws if tenant not found', async () => {
      const prisma = makePrisma({
        tenant: { ...makePrisma().tenant, findUnique: jest.fn().mockResolvedValue(null) },
      }) as any;
      await expect(updateTenant(prisma, 'not-found', {})).rejects.toThrow('Tenant not found');
    });
  });

  describe('deleteTenant', () => {
    it('deletes tenant and returns success', async () => {
      const prisma = makePrisma() as any;
      const result = await deleteTenant(prisma, 'tenant-1');
      expect(prisma.tenant.delete).toHaveBeenCalledWith({ where: { id: 'tenant-1' } });
      expect(result).toEqual({ deleted: true });
    });

    it('throws if tenant not found', async () => {
      const prisma = makePrisma({
        tenant: { ...makePrisma().tenant, findUnique: jest.fn().mockResolvedValue(null) },
      }) as any;
      await expect(deleteTenant(prisma, 'not-found')).rejects.toThrow('Tenant not found');
    });
  });

  describe('getTenantStatus', () => {
    it('returns tenant status and setup', async () => {
      const prisma = makePrisma() as any;
      prisma.tenant.findUnique = jest.fn().mockResolvedValue({ status: 'CREATING', name: 'Acme Corp' });
      const result = await getTenantStatus(prisma, 'tenant-1');
      expect(result.tenantStatus).toBe('CREATING');
      expect(result.name).toBe('Acme Corp');
      expect(result.setup).toBeDefined();
    });

    it('throws if tenant not found', async () => {
      const prisma = makePrisma({
        tenant: { ...makePrisma().tenant, findUnique: jest.fn().mockResolvedValue(null) },
        tenantSetup: { findUnique: jest.fn().mockResolvedValue(null) },
      }) as any;
      await expect(getTenantStatus(prisma, 'not-found')).rejects.toThrow('Tenant not found');
    });
  });
});
