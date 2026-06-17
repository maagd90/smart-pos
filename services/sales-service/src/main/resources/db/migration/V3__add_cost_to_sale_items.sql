-- Add cost tracking to sale_items for COGS calculation

ALTER TABLE sale_items ADD COLUMN cost_price NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE sale_items ADD COLUMN line_cost NUMERIC(12,2) NOT NULL DEFAULT 0;
