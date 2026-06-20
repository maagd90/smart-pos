-- Milestone 1: Refunds

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY,
    store_id UUID NOT NULL,
    account_id UUID NOT NULL,
    sale_id UUID NOT NULL,
    total NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'AED',
    status VARCHAR(40) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refund_items (
    id UUID PRIMARY KEY,
    refund_id UUID NOT NULL REFERENCES refunds(id),
    product_id UUID NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    line_total NUMERIC(12,2) NOT NULL,
    resellable BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_refunds_store_id ON refunds(store_id);
CREATE INDEX idx_refund_items_refund_id ON refund_items(refund_id);
