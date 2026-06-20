package com.smartpos.notificationsapprovals.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "action_tokens")
public class ActionToken {

    @Id
    @Column(name = "token_hash", nullable = false, columnDefinition = "bytea")
    private byte[] tokenHash;

    @Column(name = "notification_id", nullable = false)
    private UUID notificationId;

    @Column(name = "recipient_user_id", nullable = false)
    private UUID recipientUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Decision action;

    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ActionToken() {}

    public ActionToken(byte[] tokenHash, UUID notificationId, UUID recipientUserId,
                       Decision action, Instant expiresAt) {
        this.tokenHash = tokenHash;
        this.notificationId = notificationId;
        this.recipientUserId = recipientUserId;
        this.action = action;
        this.expiresAt = expiresAt;
        this.createdAt = Instant.now();
    }

    public byte[] getTokenHash() { return tokenHash; }
    public UUID getNotificationId() { return notificationId; }
    public UUID getRecipientUserId() { return recipientUserId; }
    public Decision getAction() { return action; }
    public Instant getUsedAt() { return usedAt; }
    public Instant getExpiresAt() { return expiresAt; }

    public boolean isUsed() { return usedAt != null; }
    public boolean isExpired() { return Instant.now().isAfter(expiresAt); }

    public void markUsed() { this.usedAt = Instant.now(); }
}
