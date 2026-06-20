-- Milestone 2: Seed permission catalog and system roles
-- Permission checks are always key-based, never by role name.

-- Permission catalog
INSERT INTO permissions (id, key, description) VALUES
    ('00000000-0000-0000-0000-000000000001', 'sale.create', 'Create a sale transaction'),
    ('00000000-0000-0000-0000-000000000002', 'sale.view', 'View sales'),
    ('00000000-0000-0000-0000-000000000003', 'sale.void', 'Void a sale'),
    ('00000000-0000-0000-0000-000000000004', 'refund.create', 'Create a refund'),
    ('00000000-0000-0000-0000-000000000005', 'refund.view', 'View refunds'),
    ('00000000-0000-0000-0000-000000000006', 'inventory.receive', 'Receive stock'),
    ('00000000-0000-0000-0000-000000000007', 'inventory.adjust', 'Adjust stock levels'),
    ('00000000-0000-0000-0000-000000000008', 'inventory.view', 'View inventory'),
    ('00000000-0000-0000-0000-000000000009', 'catalog.create', 'Create products'),
    ('00000000-0000-0000-0000-000000000010', 'catalog.edit', 'Edit products'),
    ('00000000-0000-0000-0000-000000000011', 'catalog.view', 'View products'),
    ('00000000-0000-0000-0000-000000000012', 'reports.view', 'View reports'),
    ('00000000-0000-0000-0000-000000000013', 'reports.export', 'Export reports'),
    ('00000000-0000-0000-0000-000000000014', 'accounts.manage', 'Manage account settings'),
    ('00000000-0000-0000-0000-000000000015', 'stores.manage', 'Manage stores'),
    ('00000000-0000-0000-0000-000000000016', 'users.manage', 'Manage users and roles'),
    ('00000000-0000-0000-0000-000000000017', 'users.view', 'View user profiles')
ON CONFLICT (key) DO NOTHING;

-- System roles (account_id = all-zeros means template/system role for seeding)
-- These are copied to each account at creation time.
-- Using a well-known "system" account_id for the templates.
INSERT INTO roles (id, account_id, name, is_system) VALUES
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'platform_admin', true),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'account_admin', true),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'store_manager', true),
    ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'cashier', true),
    ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'refund_manager', true),
    ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'inventory_manager', true)
ON CONFLICT (account_id, name) DO NOTHING;

-- platform_admin: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '10000000-0000-0000-0000-000000000001', id FROM permissions
ON CONFLICT DO NOTHING;

-- account_admin: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '10000000-0000-0000-0000-000000000002', id FROM permissions
ON CONFLICT DO NOTHING;

-- store_manager: all store-level permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '10000000-0000-0000-0000-000000000003', id FROM permissions
WHERE key IN ('sale.create', 'sale.view', 'sale.void', 'refund.create', 'refund.view',
              'inventory.receive', 'inventory.adjust', 'inventory.view',
              'catalog.create', 'catalog.edit', 'catalog.view',
              'reports.view', 'reports.export', 'users.view')
ON CONFLICT DO NOTHING;

-- cashier: POS operations
INSERT INTO role_permissions (role_id, permission_id)
SELECT '10000000-0000-0000-0000-000000000004', id FROM permissions
WHERE key IN ('sale.create', 'sale.view', 'catalog.view', 'inventory.view')
ON CONFLICT DO NOTHING;

-- refund_manager: refund + view
INSERT INTO role_permissions (role_id, permission_id)
SELECT '10000000-0000-0000-0000-000000000005', id FROM permissions
WHERE key IN ('refund.create', 'refund.view', 'sale.view', 'catalog.view', 'inventory.view')
ON CONFLICT DO NOTHING;

-- inventory_manager: stock operations
INSERT INTO role_permissions (role_id, permission_id)
SELECT '10000000-0000-0000-0000-000000000006', id FROM permissions
WHERE key IN ('inventory.receive', 'inventory.adjust', 'inventory.view', 'catalog.view', 'catalog.create', 'catalog.edit')
ON CONFLICT DO NOTHING;
