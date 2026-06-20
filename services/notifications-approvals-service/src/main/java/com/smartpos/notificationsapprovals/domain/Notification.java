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
@Table(name = "notifications")
public class Notification {

    @Id
    private UUID id;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(name = "recipient_user_id", nullable = false)
    private UUID recipientUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationKind kind;

    @Enumerated(EnumType.STRING)
    @Column(name = "ref_type", nullable = false)
    private RefType refType;

    @Column(name = "ref_id", nullable = false)
    private UUID refId;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, length = 500)
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationStatus status;

    @Enumerated(EnumType.STRING)
    private Decision decision;

    @Enumerated(EnumType.STRING)
    @Column(name = "decided_via")
    private DecidedVia decidedVia;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    protected Notification() {}

    public Notification(UUID accountId, UUID storeId, UUID recipientUserId, NotificationKind kind,
                        RefType refType, UUID refId, String title, String body, Instant expiresAt) {
        this.id = UUID.randomUUID();
        this.accountId = accountId;
        this.storeId = storeId;
        this.recipientUserId = recipientUserId;
        this.kind = kind;
        this.refType = refType;
        this.refId = refId;
        this.title = title;
        this.body = body;
        this.status = NotificationStatus.PENDING;
        this.createdAt = Instant.now();
        this.expiresAt = expiresAt;
    }

    public UUID getId() { return id; }
    public UUID getAccountId() { return accountId; }
    public UUID getStoreId() { return storeId; }
    public UUID getRecipientUserId() { return recipientUserId; }
    public NotificationKind getKind() { return kind; }
    public RefType getRefType() { return refType; }
    public UUID getRefId() { return refId; }
    public String getTitle() { return title; }
    public String getBody() { return body; }
    public NotificationStatus getStatus() { return status; }
    public Decision getDecision() { return decision; }
    public DecidedVia getDecidedVia() { return decidedVia; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getExpiresAt() { return expiresAt; }

    public void markDecided(Decision decision, DecidedVia via) {
        this.status = NotificationStatus.DECIDED;
        this.decision = decision;
        this.decidedVia = via;
    }

    public void markExpired() {
        this.status = NotificationStatus.EXPIRED;
    }

    public boolean isPending() {
        return status == NotificationStatus.PENDING && Instant.now().isBefore(expiresAt);
    }
}
