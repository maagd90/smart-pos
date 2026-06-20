package com.smartpos.identity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * Represents a user in the identity system with real authentication.
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "password_hash")
    private String passwordHash;

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

    protected User() {}

    public User(UUID accountId, String email, String displayName, String passwordHash) {
        this.id = UUID.randomUUID();
        this.accountId = accountId;
        this.email = email;
        this.displayName = displayName;
        this.passwordHash = passwordHash;
        this.platformAdmin = false;
        this.permissions = "";
        this.status = "ACTIVE";
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getDisplayName() { return displayName; }
    public String getPasswordHash() { return passwordHash; }
    public UUID getAccountId() { return accountId; }
    public UUID getStoreId() { return storeId; }
    public boolean isPlatformAdmin() { return platformAdmin; }
    public String getPermissions() { return permissions; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }

    public void setPermissions(String permissions) { this.permissions = permissions; }
    public void setPlatformAdmin(boolean platformAdmin) { this.platformAdmin = platformAdmin; }
    public void setStoreId(UUID storeId) { this.storeId = storeId; }
}
