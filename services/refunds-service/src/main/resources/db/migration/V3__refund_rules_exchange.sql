-- Refund pricing, refunded quantity tracking, and exchanges

ALTER TABLE refund_items ADD COLUMN IF NOT EXISTS base_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE refund_items ADD COLUMN IF NOT EXISTS proration_pct NUMERIC(6,2) NOT NULL DEFAULT 100;
ALTER TABLE refund_items ADD COLUMN IF NOT EXISTS prorated_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE refund_items ADD COLUMN IF NOT EXISTS restocking_fee NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE refund_items ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(12,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS refunded_quantity (
    id UUID PRIMARY KEY,
    store_id UUID NOT NULL,
    sale_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity_refunded INTEGER NOT NULL DEFAULT 0,
    UNIQUE (store_id, sale_id, product_id)
);

CREATE INDEX idx_refunded_quantity_sale ON refunded_quantity(sale_id);

CREATE TABLE IF NOT EXISTS exchanges (
    id UUID PRIMARY KEY,
    store_id UUID NOT NULL,
    account_id UUID NOT NULL,
    original_sale_id UUID NOT NULL,
    replacement_sale_id UUID,
    status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exchanges_store_id ON exchanges(store_id);
CREATE INDEX idx_exchanges_original_sale ON exchanges(original_sale_id);
