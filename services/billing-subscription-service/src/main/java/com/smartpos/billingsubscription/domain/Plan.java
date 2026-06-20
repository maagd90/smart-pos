package com.smartpos.billingsubscription.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "plans")
public class Plan {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "max_stores", nullable = false)
    private int maxStores;

    @Column(name = "max_users", nullable = false)
    private int maxUsers;

    @Column(name = "ai_enabled", nullable = false)
    private boolean aiEnabled;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Plan() {
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public int getMaxStores() { return maxStores; }
    public int getMaxUsers() { return maxUsers; }
    public boolean isAiEnabled() { return aiEnabled; }
}
