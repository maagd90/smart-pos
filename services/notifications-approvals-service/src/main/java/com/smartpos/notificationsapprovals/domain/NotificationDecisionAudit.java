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
@Table(name = "notification_decision_audit")
public class NotificationDecisionAudit {

    @Id
    private UUID id;

    @Column(name = "notification_id", nullable = false)
    private UUID notificationId;

    @Column(name = "recipient_user_id", nullable = false)
    private UUID recipientUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "ref_type", nullable = false)
    private RefType refType;

    @Column(name = "ref_id", nullable = false)
    private UUID refId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Decision decision;

    @Enumerated(EnumType.STRING)
    @Column(name = "decided_via", nullable = false)
    private DecidedVia decidedVia;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected NotificationDecisionAudit() {}

    public NotificationDecisionAudit(UUID notificationId, UUID recipientUserId, RefType refType,
                                     UUID refId, Decision decision, DecidedVia decidedVia) {
        this.id = UUID.randomUUID();
        this.notificationId = notificationId;
        this.recipientUserId = recipientUserId;
        this.refType = refType;
        this.refId = refId;
        this.decision = decision;
        this.decidedVia = decidedVia;
        this.createdAt = Instant.now();
    }
}
