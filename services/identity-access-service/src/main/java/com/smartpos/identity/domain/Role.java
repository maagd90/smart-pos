package com.smartpos.identity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * Represents a role within an account's RBAC model.
 */
@Entity
@Table(name = "roles")
public class Role {

    @Id
    private UUID id;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(nullable = false)
    private String name;

    @Column(name = "is_system", nullable = false)
    private boolean system;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Role() {}

    public Role(UUID accountId, String name, boolean system) {
        this.id = UUID.randomUUID();
        this.accountId = accountId;
        this.name = name;
        this.system = system;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getAccountId() { return accountId; }
    public String getName() { return name; }
    public boolean isSystem() { return system; }
    public Instant getCreatedAt() { return createdAt; }
}
