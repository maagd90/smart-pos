package com.smartpos.tenant.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * Represents a physical or virtual store belonging to a tenant account.
 *
 * <p>Each store operates in a specific timezone and all store-scoped
 * business data (products, inventory, sales) is linked to a store.</p>
 */
@Entity
@Table(name = "stores")
public class Store {

    @Id
    private UUID id;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String timezone;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    /** Default constructor required by JPA. */
    protected Store() {}

    /**
     * Creates a new store under the given account.
     *
     * @param accountId the owning account's ID
     * @param name the store name
     * @param timezone the store's timezone
     */
    public Store(UUID accountId, String name, String timezone) {
        this.id = UUID.randomUUID();
        this.accountId = accountId;
        this.name = name;
        this.timezone = timezone;
        this.status = "ACTIVE";
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }

    public UUID getAccountId() { return accountId; }

    public String getName() { return name; }

    public String getTimezone() { return timezone; }

    public String getStatus() { return status; }

    public Instant getCreatedAt() { return createdAt; }

    public void setStatus(String status) { this.status = status; }
}
