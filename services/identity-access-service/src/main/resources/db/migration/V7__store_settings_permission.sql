-- Store settings permission for store managers

INSERT INTO permissions (id, key, description) VALUES
    ('00000000-0000-0000-0000-000000000020', 'store.settings.manage', 'Manage store operating settings')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT role_id, p.id
FROM permissions p
CROSS JOIN (VALUES
    ('10000000-0000-0000-0000-000000000002'::uuid),
    ('10000000-0000-0000-0000-000000000003'::uuid)
) AS roles(role_id)
WHERE p.key = 'store.settings.manage'
ON CONFLICT DO NOTHING;
