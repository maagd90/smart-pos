-- Refund policy management and exchange permissions

INSERT INTO permissions (id, key, description) VALUES
    ('00000000-0000-0000-0000-000000000018', 'store.refund_policy.manage', 'Manage store refund and exchange policy'),
    ('00000000-0000-0000-0000-000000000019', 'exchange.create', 'Create product exchanges')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT '10000000-0000-0000-0000-000000000003', id FROM permissions
WHERE key IN ('store.refund_policy.manage', 'exchange.create')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT '10000000-0000-0000-0000-000000000005', id FROM permissions
WHERE key = 'exchange.create'
ON CONFLICT DO NOTHING;
