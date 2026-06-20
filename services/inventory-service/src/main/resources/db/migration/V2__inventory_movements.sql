-- Milestone 1: Inventory movements (append-only stock ledger)

CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY,
    store_id UUID NOT NULL,
    account_id UUID NOT NULL,
    product_id UUID NOT NULL,
    movement_type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(60),
    reference_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_movements_store_product ON inventory_movements(store_id, product_id);
CREATE INDEX idx_movements_store_id ON inventory_movements(store_id);
