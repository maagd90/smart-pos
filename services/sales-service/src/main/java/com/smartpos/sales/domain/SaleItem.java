package com.smartpos.sales.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Represents a line item within a sale transaction.
 */
@Entity
@Table(name = "sale_items")
public class SaleItem {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    @Column(name = "line_total", nullable = false)
    private BigDecimal lineTotal;

    @Column(name = "cost_price", nullable = false)
    private BigDecimal costPrice;

    @Column(name = "line_cost", nullable = false)
    private BigDecimal lineCost;

    protected SaleItem() {
    }

    /**
     * Creates a sale item with cost tracking.
     */
    public SaleItem(Sale sale, UUID productId, String productName, int quantity,
                    BigDecimal unitPrice, BigDecimal lineTotal, BigDecimal costPrice, BigDecimal lineCost) {
        this.id = UUID.randomUUID();
        this.sale = sale;
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.lineTotal = lineTotal;
        this.costPrice = costPrice;
        this.lineCost = lineCost;
    }

    public UUID getId() { return id; }
    public Sale getSale() { return sale; }
    public UUID getProductId() { return productId; }
    public String getProductName() { return productName; }
    public int getQuantity() { return quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public BigDecimal getLineTotal() { return lineTotal; }
    public BigDecimal getCostPrice() { return costPrice; }
    public BigDecimal getLineCost() { return lineCost; }
}
