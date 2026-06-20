-- Idempotency for at-least-once event consumption (outbox -> Kafka -> consumer).
-- One movement per (store, reference, product); multiple lines per sale remain valid via product_id.

ALTER TABLE inventory_movements
    ADD CONSTRAINT uq_movement_reference_product
    UNIQUE (store_id, reference_type, reference_id, product_id);
