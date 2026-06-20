package com.smartpos.refunds.domain;

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
@Table(name = "refund_items")
public class RefundItem {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "refund_id", nullable = false)
    private Refund refund;

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

    @Column(nullable = false)
    private boolean resellable;

    @Column(name = "base_amount", nullable = false)
    private BigDecimal baseAmount = BigDecimal.ZERO;

    @Column(name = "proration_pct", nullable = false)
    private BigDecimal prorationPct = BigDecimal.valueOf(100);

    @Column(name = "prorated_amount", nullable = false)
    private BigDecimal proratedAmount = BigDecimal.ZERO;

    @Column(name = "restocking_fee", nullable = false)
    private BigDecimal restockingFee = BigDecimal.ZERO;

    @Column(name = "refund_amount", nullable = false)
    private BigDecimal refundAmount = BigDecimal.ZERO;

    protected RefundItem() {
    }

    public RefundItem(Refund refund, UUID productId, String productName, int quantity,
                      BigDecimal unitPrice, BigDecimal lineTotal, boolean resellable,
                      BigDecimal baseAmount, BigDecimal prorationPct, BigDecimal proratedAmount,
                      BigDecimal restockingFee, BigDecimal refundAmount) {
        this.id = UUID.randomUUID();
        this.refund = refund;
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.lineTotal = lineTotal;
        this.resellable = resellable;
        this.baseAmount = baseAmount;
        this.prorationPct = prorationPct;
        this.proratedAmount = proratedAmount;
        this.restockingFee = restockingFee;
        this.refundAmount = refundAmount;
    }

    public UUID getId() { return id; }
    public UUID getProductId() { return productId; }
    public String getProductName() { return productName; }
    public int getQuantity() { return quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public BigDecimal getLineTotal() { return lineTotal; }
    public boolean isResellable() { return resellable; }
    public BigDecimal getBaseAmount() { return baseAmount; }
    public BigDecimal getProrationPct() { return prorationPct; }
    public BigDecimal getProratedAmount() { return proratedAmount; }
    public BigDecimal getRestockingFee() { return restockingFee; }
    public BigDecimal getRefundAmount() { return refundAmount; }
}
