-- Milestone 1: Product catalog with pricing

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY,
    store_id UUID NOT NULL,
    account_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    category VARCHAR(100),
    cost_price NUMERIC(12,2) NOT NULL,
    pricing_mode VARCHAR(20) NOT NULL DEFAULT 'markup',
    markup_percent NUMERIC(6,2),
    selling_price NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'AED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_account_id ON products(account_id);
