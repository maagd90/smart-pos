package com.smartpos.identity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * Global permission catalog entry.
 */
@Entity
@Table(name = "permissions")
public class Permission {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String key;

    private String description;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Permission() {}

    public UUID getId() { return id; }
    public String getKey() { return key; }
    public String getDescription() { return description; }
    public Instant getCreatedAt() { return createdAt; }
}
