package com.smartpos.refunds.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "refunded_quantity")
public class RefundedQuantity {

    @Id
    private UUID id;

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(name = "sale_id", nullable = false)
    private UUID saleId;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "quantity_refunded", nullable = false)
    private int quantityRefunded;

    protected RefundedQuantity() {
    }

    public RefundedQuantity(UUID storeId, UUID saleId, UUID productId, int quantityRefunded) {
        this.id = UUID.randomUUID();
        this.storeId = storeId;
        this.saleId = saleId;
        this.productId = productId;
        this.quantityRefunded = quantityRefunded;
    }

    public UUID getStoreId() { return storeId; }
    public UUID getSaleId() { return saleId; }
    public UUID getProductId() { return productId; }
    public int getQuantityRefunded() { return quantityRefunded; }

    public void addQuantity(int qty) {
        this.quantityRefunded += qty;
    }
}
