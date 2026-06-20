package com.smartpos.identity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * Maps a user to a role, optionally scoped to a store.
 * If store_id is NULL, the role applies account-wide (all stores).
 */
@Entity
@Table(name = "user_roles")
public class UserRole {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "role_id", nullable = false)
    private UUID roleId;

    @Column(name = "store_id")
    private UUID storeId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected UserRole() {}

    public UserRole(UUID userId, UUID roleId, UUID storeId) {
        this.id = UUID.randomUUID();
        this.userId = userId;
        this.roleId = roleId;
        this.storeId = storeId;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public UUID getRoleId() { return roleId; }
    public UUID getStoreId() { return storeId; }
    public Instant getCreatedAt() { return createdAt; }
}
