-- Plans, subscriptions, AI keys, and entitlements

CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    max_stores INTEGER NOT NULL DEFAULT 1,
    max_users INTEGER NOT NULL DEFAULT 10,
    ai_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS account_subscriptions (
    account_id UUID PRIMARY KEY,
    plan_id UUID NOT NULL REFERENCES plans(id),
    status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_hash VARCHAR(255) NOT NULL,
    last4 VARCHAR(4) NOT NULL,
    rotated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS account_ai_entitlements (
    account_id UUID PRIMARY KEY,
    ai_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO plans (id, name, max_stores, max_users, ai_enabled) VALUES
    ('20000000-0000-0000-0000-000000000001', 'starter', 1, 5, false),
    ('20000000-0000-0000-0000-000000000002', 'business', 5, 25, true),
    ('20000000-0000-0000-0000-000000000003', 'enterprise', 50, 500, true)
ON CONFLICT (name) DO NOTHING;
