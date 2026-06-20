package com.smartpos.inventory.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "inventory_change_requests")
public class InventoryChangeRequest {

    @Id
    private UUID id;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false)
    private String summary;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected InventoryChangeRequest() {}

    public InventoryChangeRequest(UUID accountId, UUID storeId, UUID productId, int quantity, String summary) {
        this.id = UUID.randomUUID();
        this.accountId = accountId;
        this.storeId = storeId;
        this.productId = productId;
        this.quantity = quantity;
        this.summary = summary;
        this.status = "PENDING";
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getAccountId() { return accountId; }
    public UUID getStoreId() { return storeId; }
    public UUID getProductId() { return productId; }
    public int getQuantity() { return quantity; }
    public String getSummary() { return summary; }
    public String getStatus() { return status; }

    public void approve() {
        if (!"PENDING".equals(status)) {
            return;
        }
        this.status = "APPROVED";
        this.updatedAt = Instant.now();
    }

    public void reject() {
        if (!"PENDING".equals(status)) {
            return;
        }
        this.status = "REJECTED";
        this.updatedAt = Instant.now();
    }
}
