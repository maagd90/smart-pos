-- Milestone 1: Sales and sale items

CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY,
    store_id UUID NOT NULL,
    account_id UUID NOT NULL,
    total NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'AED',
    status VARCHAR(40) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES sales(id),
    product_id UUID NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    line_total NUMERIC(12,2) NOT NULL
);

CREATE INDEX idx_sales_store_id ON sales(store_id);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
