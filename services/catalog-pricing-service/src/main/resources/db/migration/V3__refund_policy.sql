-- Refund/exchange policy: store defaults and product overrides

CREATE TABLE IF NOT EXISTS store_refund_policy (
    store_id UUID PRIMARY KEY,
    account_id UUID NOT NULL,
    default_refundable BOOLEAN NOT NULL DEFAULT TRUE,
    default_refund_window_days INTEGER NOT NULL DEFAULT 14,
    default_exchangeable BOOLEAN NOT NULL DEFAULT TRUE,
    default_exchange_window_days INTEGER NOT NULL DEFAULT 14,
    restocking_fee_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
    restocking_fee_flat NUMERIC(12,2) NOT NULL DEFAULT 0,
    refund_proration_tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS refundable BOOLEAN;
ALTER TABLE products ADD COLUMN IF NOT EXISTS refund_window_days INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS exchangeable BOOLEAN;
ALTER TABLE products ADD COLUMN IF NOT EXISTS exchange_window_days INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS restocking_fee_pct NUMERIC(6,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS restocking_fee_flat NUMERIC(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS refund_proration_tiers JSONB;

CREATE INDEX idx_store_refund_policy_account_id ON store_refund_policy(account_id);
