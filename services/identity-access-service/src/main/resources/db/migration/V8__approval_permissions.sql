-- Approval permissions for deal and inventory change workflows

INSERT INTO permissions (id, key, description) VALUES
    ('00000000-0000-0000-0000-000000000021', 'deal.approve', 'Approve or reject AI deal proposals'),
    ('00000000-0000-0000-0000-000000000022', 'inventory.change.approve', 'Approve or reject inventory change requests'),
    ('00000000-0000-0000-0000-000000000023', 'deal.create', 'Create AI deal proposals')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role_id, p.id
FROM permissions p
CROSS JOIN (VALUES
    ('10000000-0000-0000-0000-000000000002'::uuid),
    ('10000000-0000-0000-0000-000000000003'::uuid),
    ('10000000-0000-0000-0000-000000000006'::uuid)
) AS roles(role_id)
WHERE p.key IN ('deal.approve', 'inventory.change.approve')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT '10000000-0000-0000-0000-000000000006', id FROM permissions WHERE key = 'deal.create'
ON CONFLICT DO NOTHING;
