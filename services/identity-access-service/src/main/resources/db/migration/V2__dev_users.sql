-- Development-only seed data for local testing.
-- In production, user management is handled through proper registration flows.

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    account_id UUID NOT NULL,
    store_id UUID,
    platform_admin BOOLEAN NOT NULL DEFAULT FALSE,
    permissions TEXT NOT NULL DEFAULT '',
    status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dev seed user (only used for local development and smoke tests)
INSERT INTO users (id, email, account_id, store_id, platform_admin, permissions, status)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'owner@example.com',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    true,
    'pos:sale,pos:refund,inventory:receive,inventory:adjust,catalog:manage,reports:view,accounts:manage,stores:manage',
    'ACTIVE'
) ON CONFLICT (email) DO NOTHING;
