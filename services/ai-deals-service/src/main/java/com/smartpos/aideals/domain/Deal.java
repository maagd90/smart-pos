package com.smartpos.aideals.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "deals")
public class Deal {

    @Id
    private UUID id;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(name = "offer_summary", nullable = false)
    private String offerSummary;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Deal() {}

    public Deal(UUID accountId, UUID storeId, String offerSummary) {
        this.id = UUID.randomUUID();
        this.accountId = accountId;
        this.storeId = storeId;
        this.offerSummary = offerSummary;
        this.status = "PENDING_APPROVAL";
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getAccountId() { return accountId; }
    public UUID getStoreId() { return storeId; }
    public String getOfferSummary() { return offerSummary; }
    public String getStatus() { return status; }

    public void approve() {
        if ("APPROVED".equals(status) || "REJECTED".equals(status)) {
            return;
        }
        this.status = "APPROVED";
        this.updatedAt = Instant.now();
    }

    public void reject() {
        if ("APPROVED".equals(status) || "REJECTED".equals(status)) {
            return;
        }
        this.status = "REJECTED";
        this.updatedAt = Instant.now();
    }
}
