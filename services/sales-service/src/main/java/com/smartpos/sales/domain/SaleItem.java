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

    @Column(nullable = false)
    private boolean refundable = true;

    @Column(name = "refund_window_days", nullable = false)
    private int refundWindowDays = 14;

    @Column(nullable = false)
    private boolean exchangeable = true;

    @Column(name = "exchange_window_days", nullable = false)
    private int exchangeWindowDays = 14;

    @Column(name = "restocking_fee_pct", nullable = false)
    private BigDecimal restockingFeePct = BigDecimal.ZERO;

    @Column(name = "restocking_fee_flat", nullable = false)
    private BigDecimal restockingFeeFlat = BigDecimal.ZERO;

    @Column(name = "refund_proration_tiers", nullable = false)
    private String refundProrationTiersJson = "[]";

    protected SaleItem() {
    }

    public SaleItem(Sale sale, UUID productId, String productName, int quantity,
                    BigDecimal unitPrice, BigDecimal lineTotal, BigDecimal costPrice, BigDecimal lineCost,
                    boolean refundable, int refundWindowDays, boolean exchangeable, int exchangeWindowDays,
                    BigDecimal restockingFeePct, BigDecimal restockingFeeFlat, String refundProrationTiersJson) {
        this.id = UUID.randomUUID();
        this.sale = sale;
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.lineTotal = lineTotal;
        this.costPrice = costPrice;
        this.lineCost = lineCost;
        this.refundable = refundable;
        this.refundWindowDays = refundWindowDays;
        this.exchangeable = exchangeable;
        this.exchangeWindowDays = exchangeWindowDays;
        this.restockingFeePct = restockingFeePct;
        this.restockingFeeFlat = restockingFeeFlat;
        this.refundProrationTiersJson = refundProrationTiersJson != null ? refundProrationTiersJson : "[]";
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
    public boolean isRefundable() { return refundable; }
    public int getRefundWindowDays() { return refundWindowDays; }
    public boolean isExchangeable() { return exchangeable; }
    public int getExchangeWindowDays() { return exchangeWindowDays; }
    public BigDecimal getRestockingFeePct() { return restockingFeePct; }
    public BigDecimal getRestockingFeeFlat() { return restockingFeeFlat; }
    public String getRefundProrationTiersJson() { return refundProrationTiersJson; }
}
