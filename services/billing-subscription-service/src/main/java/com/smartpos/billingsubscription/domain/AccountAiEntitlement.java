package com.smartpos.billingsubscription.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "account_ai_entitlements")
public class AccountAiEntitlement {

    @Id
    @Column(name = "account_id")
    private UUID accountId;

    @Column(name = "ai_enabled", nullable = false)
    private boolean aiEnabled;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected AccountAiEntitlement() {
    }

    public AccountAiEntitlement(UUID accountId, boolean aiEnabled) {
        this.accountId = accountId;
        this.aiEnabled = aiEnabled;
        this.updatedAt = Instant.now();
    }

    public UUID getAccountId() { return accountId; }
    public boolean isAiEnabled() { return aiEnabled; }

    public void setAiEnabled(boolean aiEnabled) {
        this.aiEnabled = aiEnabled;
        this.updatedAt = Instant.now();
    }
}
