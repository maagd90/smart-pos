package com.smartpos.sales.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Represents a completed sale transaction.
 */
@Entity
@Table(name = "sales")
public class Sale {

    @Id
    private UUID id;

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(nullable = false)
    private BigDecimal total;

    @Column(nullable = false)
    private String currency;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SaleItem> items = new ArrayList<>();

    protected Sale() {
    }

    /**
     * Creates a new sale.
     *
     * @param storeId the store where the sale occurred
     * @param accountId the tenant account
     * @param currency the transaction currency
     */
    public Sale(UUID storeId, UUID accountId, String currency) {
        this.id = UUID.randomUUID();
        this.storeId = storeId;
        this.accountId = accountId;
        this.total = BigDecimal.ZERO;
        this.currency = currency;
        this.status = "COMPLETED";
        this.createdAt = Instant.now();
    }

    /**
     * Adds an item to the sale and updates the total.
     *
     * @param productId the product sold
     * @param productName the product name at time of sale
     * @param quantity the quantity sold
     * @param unitPrice the unit price at time of sale
     */
    public void addItem(UUID productId, String productName, int quantity, BigDecimal unitPrice) {
        BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
        SaleItem item = new SaleItem(this, productId, productName, quantity, unitPrice, lineTotal);
        this.items.add(item);
        this.total = this.total.add(lineTotal);
    }

    public UUID getId() {
        return id;
    }

    public UUID getStoreId() {
        return storeId;
    }

    public UUID getAccountId() {
        return accountId;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public String getCurrency() {
        return currency;
    }

    public String getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public List<SaleItem> getItems() {
        return items;
    }
}
