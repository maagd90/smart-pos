package com.smartpos.identity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * Persistent audit trail entry for security-sensitive actions.
 */
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    private UUID id;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(nullable = false)
    private String action;

    @Column(name = "resource_type")
    private String resourceType;

    @Column(name = "resource_id")
    private UUID resourceId;

    @Column(columnDefinition = "jsonb")
    private String details;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    /** JPA default constructor. */
    protected AuditLog() {}

    /**
     * Creates a new audit log record.
     *
     * @param accountId tenant account identifier
     * @param userId acting user identifier (nullable for system actions)
     * @param action action key, e.g. auth.login
     * @param resourceType affected resource type
     * @param resourceId affected resource identifier
     * @param details optional JSON payload as string
     * @param ipAddress client IP address when available
     */
    public AuditLog(UUID accountId, UUID userId, String action, String resourceType,
                    UUID resourceId, String details, String ipAddress) {
        this.id = UUID.randomUUID();
        this.accountId = accountId;
        this.userId = userId;
        this.action = action;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.details = details;
        this.ipAddress = ipAddress;
        this.createdAt = Instant.now();
    }
}
