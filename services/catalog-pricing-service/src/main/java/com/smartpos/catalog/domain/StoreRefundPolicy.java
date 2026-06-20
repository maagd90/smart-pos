package com.smartpos.catalog.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "store_refund_policy")
public class StoreRefundPolicy {

    @Id
    @Column(name = "store_id")
    private UUID storeId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "default_refundable", nullable = false)
    private boolean defaultRefundable = true;

    @Column(name = "default_refund_window_days", nullable = false)
    private int defaultRefundWindowDays = 14;

    @Column(name = "default_exchangeable", nullable = false)
    private boolean defaultExchangeable = true;

    @Column(name = "default_exchange_window_days", nullable = false)
    private int defaultExchangeWindowDays = 14;

    @Column(name = "restocking_fee_pct", nullable = false)
    private BigDecimal restockingFeePct = BigDecimal.ZERO;

    @Column(name = "restocking_fee_flat", nullable = false)
    private BigDecimal restockingFeeFlat = BigDecimal.ZERO;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "refund_proration_tiers", nullable = false)
    private String refundProrationTiersJson = "[]";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected StoreRefundPolicy() {
    }

    public static StoreRefundPolicy createDefault(UUID storeId, UUID accountId) {
        StoreRefundPolicy policy = new StoreRefundPolicy();
        policy.storeId = storeId;
        policy.accountId = accountId;
        Instant now = Instant.now();
        policy.createdAt = now;
        policy.updatedAt = now;
        return policy;
    }

    public UUID getStoreId() { return storeId; }
    public UUID getAccountId() { return accountId; }
    public boolean isDefaultRefundable() { return defaultRefundable; }
    public int getDefaultRefundWindowDays() { return defaultRefundWindowDays; }
    public boolean isDefaultExchangeable() { return defaultExchangeable; }
    public int getDefaultExchangeWindowDays() { return defaultExchangeWindowDays; }
    public BigDecimal getRestockingFeePct() { return restockingFeePct; }
    public BigDecimal getRestockingFeeFlat() { return restockingFeeFlat; }
    public String getRefundProrationTiersJson() { return refundProrationTiersJson; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void applyUpdate(boolean defaultRefundable, int defaultRefundWindowDays,
                            boolean defaultExchangeable, int defaultExchangeWindowDays,
                            BigDecimal restockingFeePct, BigDecimal restockingFeeFlat,
                            String refundProrationTiersJson) {
        this.defaultRefundable = defaultRefundable;
        this.defaultRefundWindowDays = defaultRefundWindowDays;
        this.defaultExchangeable = defaultExchangeable;
        this.defaultExchangeWindowDays = defaultExchangeWindowDays;
        this.restockingFeePct = restockingFeePct;
        this.restockingFeeFlat = restockingFeeFlat;
        this.refundProrationTiersJson = refundProrationTiersJson;
        this.updatedAt = Instant.now();
    }
}
