package com.smartpos.identity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * Represents a user in the identity system.
 *
 * <p>In Milestone 1, this entity supports the dev-login flow only.
 * Full user management (registration, password hashing, MFA) is planned for Milestone 2.</p>
 */
@Entity
@Table(name = "users")
public class DevUser {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "store_id")
    private UUID storeId;

    @Column(name = "platform_admin", nullable = false)
    private boolean platformAdmin;

    @Column(nullable = false)
    private String permissions;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    /** Default constructor required by JPA. */
    protected DevUser() {}

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public UUID getAccountId() { return accountId; }
    public UUID getStoreId() { return storeId; }
    public boolean isPlatformAdmin() { return platformAdmin; }
    public String getPermissions() { return permissions; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}
