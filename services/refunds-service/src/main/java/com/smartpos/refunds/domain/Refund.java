package com.smartpos.refunds.domain;

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
 * Represents a refund transaction against an original sale.
 */
@Entity
@Table(name = "refunds")
public class Refund {

    @Id
    private UUID id;

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "sale_id", nullable = false)
    private UUID saleId;

    @Column(nullable = false)
    private BigDecimal total;

    @Column(nullable = false)
    private String currency;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "refund", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RefundItem> items = new ArrayList<>();

    protected Refund() {
    }

    /**
     * Creates a new refund.
     *
     * @param storeId the store
     * @param accountId the tenant account
     * @param saleId the original sale being refunded
     * @param currency the currency
     */
    public Refund(UUID storeId, UUID accountId, UUID saleId, String currency) {
        this.id = UUID.randomUUID();
        this.storeId = storeId;
        this.accountId = accountId;
        this.saleId = saleId;
        this.total = BigDecimal.ZERO;
        this.currency = currency;
        this.status = "COMPLETED";
        this.createdAt = Instant.now();
    }

    /**
     * Adds a refund item.
     */
    public void addItem(UUID productId, String productName, int quantity, BigDecimal unitPrice, boolean resellable) {
        BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
        RefundItem item = new RefundItem(this, productId, productName, quantity, unitPrice, lineTotal, resellable);
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

    public UUID getSaleId() {
        return saleId;
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

    public List<RefundItem> getItems() {
        return items;
    }
}
