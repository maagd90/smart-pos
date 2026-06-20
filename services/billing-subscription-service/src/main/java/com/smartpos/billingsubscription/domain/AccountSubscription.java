package com.smartpos.billingsubscription.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "account_subscriptions")
public class AccountSubscription {

    @Id
    @Column(name = "account_id")
    private UUID accountId;

    @Column(name = "plan_id", nullable = false)
    private UUID planId;

    @Column(nullable = false)
    private String status;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected AccountSubscription() {
    }

    public AccountSubscription(UUID accountId, UUID planId) {
        this.accountId = accountId;
        this.planId = planId;
        this.status = "ACTIVE";
        this.updatedAt = Instant.now();
    }

    public UUID getAccountId() { return accountId; }
    public UUID getPlanId() { return planId; }
    public String getStatus() { return status; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setPlanId(UUID planId) {
        this.planId = planId;
        this.updatedAt = Instant.now();
    }

    public void setStatus(String status) {
        this.status = status;
        this.updatedAt = Instant.now();
    }
}
