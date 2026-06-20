package com.smartpos.refunds.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "exchanges")
public class Exchange {

    @Id
    private UUID id;

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "original_sale_id", nullable = false)
    private UUID originalSaleId;

    @Column(name = "replacement_sale_id")
    private UUID replacementSaleId;

    @Column(nullable = false)
    private String status;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Exchange() {
    }

    public Exchange(UUID storeId, UUID accountId, UUID originalSaleId) {
        this.id = UUID.randomUUID();
        this.storeId = storeId;
        this.accountId = accountId;
        this.originalSaleId = originalSaleId;
        this.status = "PENDING";
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getStoreId() { return storeId; }
    public UUID getAccountId() { return accountId; }
    public UUID getOriginalSaleId() { return originalSaleId; }
    public UUID getReplacementSaleId() { return replacementSaleId; }
    public String getStatus() { return status; }
    public String getErrorMessage() { return errorMessage; }
    public Instant getCreatedAt() { return createdAt; }

    public void markCompleted(UUID replacementSaleId) {
        this.replacementSaleId = replacementSaleId;
        this.status = "COMPLETED";
    }

    public void markFailed(String message) {
        this.status = "FAILED";
        this.errorMessage = message;
    }

    public void markCompensated(String message) {
        this.status = "COMPENSATED";
        this.errorMessage = message;
    }

    public void setReplacementSaleId(UUID replacementSaleId) {
        this.replacementSaleId = replacementSaleId;
    }
}
