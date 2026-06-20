package com.smartpos.tenant.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * Represents a tenant account in the multi-tenant platform.
 *
 * <p>An account is the top-level organizational unit that owns stores,
 * users, and all business data.</p>
 */
@Entity
@Table(name = "accounts")
public class Account {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String currency;

    @Column(nullable = false)
    private String locale;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    /** Default constructor required by JPA. */
    protected Account() {}

    /**
     * Creates a new account.
     *
     * @param name the account name
     * @param currency the default currency code
     * @param locale the default locale
     */
    public Account(String name, String currency, String locale) {
        this.id = UUID.randomUUID();
        this.name = name;
        this.currency = currency;
        this.locale = locale;
        this.status = "ACTIVE";
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }

    public String getName() { return name; }

    public String getCurrency() { return currency; }

    public String getLocale() { return locale; }

    public String getStatus() { return status; }

    public Instant getCreatedAt() { return createdAt; }
}
