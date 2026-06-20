package com.smartpos.catalog.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

/**
 * Represents a product in the store catalog with pricing information.
 *
 * <p>Supports two pricing modes:</p>
 * <ul>
 *   <li><strong>markup</strong> - selling price is calculated as costPrice * (1 + markupPercent/100)</li>
 *   <li><strong>fixed</strong> - selling price is set directly by the user</li>
 * </ul>
 */
@Entity
@Table(name = "products")
public class Product {

    @Id
    private UUID id;

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(nullable = false)
    private String name;

    private String sku;

    private String category;

    @Column(name = "cost_price", nullable = false)
    private BigDecimal costPrice;

    @Column(name = "pricing_mode", nullable = false)
    private String pricingMode;

    @Column(name = "markup_percent")
    private BigDecimal markupPercent;

    @Column(name = "selling_price", nullable = false)
    private BigDecimal sellingPrice;

    @Column(nullable = false)
    private String currency;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "refundable")
    private Boolean refundable;

    @Column(name = "refund_window_days")
    private Integer refundWindowDays;

    @Column(name = "exchangeable")
    private Boolean exchangeable;

    @Column(name = "exchange_window_days")
    private Integer exchangeWindowDays;

    @Column(name = "restocking_fee_pct")
    private BigDecimal restockingFeePct;

    @Column(name = "restocking_fee_flat")
    private BigDecimal restockingFeeFlat;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "refund_proration_tiers")
    private String refundProrationTiersJson;

    /** Default constructor required by JPA. */
    protected Product() {}

    /**
     * Creates a product with markup pricing.
     *
     * @param storeId the owning store ID
     * @param accountId the owning account ID
     * @param name the product name
     * @param sku the stock keeping unit
     * @param category the product category
     * @param costPrice the cost price
     * @param markupPercent the markup percentage
     * @param currency the currency code
     * @return a new product with calculated selling price
     */
    public static Product withMarkup(UUID storeId, UUID accountId, String name, String sku,
                                     String category, BigDecimal costPrice, BigDecimal markupPercent, String currency) {
        Product p = new Product();
        p.id = UUID.randomUUID();
        p.storeId = storeId;
        p.accountId = accountId;
        p.name = name;
        p.sku = sku;
        p.category = category;
        p.costPrice = costPrice;
        p.pricingMode = "markup";
        p.markupPercent = markupPercent;
        p.sellingPrice = costPrice.multiply(BigDecimal.ONE.add(markupPercent.divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP)))
                .setScale(2, RoundingMode.HALF_UP);
        p.currency = currency;
        p.createdAt = Instant.now();
        return p;
    }

    /**
     * Creates a product with fixed pricing.
     *
     * @param storeId the owning store ID
     * @param accountId the owning account ID
     * @param name the product name
     * @param sku the stock keeping unit
     * @param category the product category
     * @param costPrice the cost price
     * @param sellingPrice the fixed selling price
     * @param currency the currency code
     * @return a new product with fixed selling price
     */
    public static Product withFixedPrice(UUID storeId, UUID accountId, String name, String sku,
                                         String category, BigDecimal costPrice, BigDecimal sellingPrice, String currency) {
        Product p = new Product();
        p.id = UUID.randomUUID();
        p.storeId = storeId;
        p.accountId = accountId;
        p.name = name;
        p.sku = sku;
        p.category = category;
        p.costPrice = costPrice;
        p.pricingMode = "fixed";
        p.markupPercent = null;
        p.sellingPrice = sellingPrice;
        p.currency = currency;
        p.createdAt = Instant.now();
        return p;
    }

    public UUID getId() { return id; }
    public UUID getStoreId() { return storeId; }
    public UUID getAccountId() { return accountId; }
    public String getName() { return name; }
    public String getSku() { return sku; }
    public String getCategory() { return category; }
    public BigDecimal getCostPrice() { return costPrice; }
    public String getPricingMode() { return pricingMode; }
    public BigDecimal getMarkupPercent() { return markupPercent; }
    public BigDecimal getSellingPrice() { return sellingPrice; }
    public String getCurrency() { return currency; }
    public Instant getCreatedAt() { return createdAt; }
    public Boolean getRefundable() { return refundable; }
    public Integer getRefundWindowDays() { return refundWindowDays; }
    public Boolean getExchangeable() { return exchangeable; }
    public Integer getExchangeWindowDays() { return exchangeWindowDays; }
    public BigDecimal getRestockingFeePct() { return restockingFeePct; }
    public BigDecimal getRestockingFeeFlat() { return restockingFeeFlat; }
    public String getRefundProrationTiersJson() { return refundProrationTiersJson; }

    public void updatePolicy(Boolean refundable, Integer refundWindowDays, Boolean exchangeable,
                             Integer exchangeWindowDays, BigDecimal restockingFeePct,
                             BigDecimal restockingFeeFlat, String refundProrationTiersJson) {
        this.refundable = refundable;
        this.refundWindowDays = refundWindowDays;
        this.exchangeable = exchangeable;
        this.exchangeWindowDays = exchangeWindowDays;
        this.restockingFeePct = restockingFeePct;
        this.restockingFeeFlat = restockingFeeFlat;
        this.refundProrationTiersJson = refundProrationTiersJson;
    }

    public void updateDetails(String name, String sku, String category, BigDecimal costPrice,
                              String pricingMode, BigDecimal markupPercent, BigDecimal sellingPrice) {
        this.name = name;
        this.sku = sku;
        this.category = category;
        this.costPrice = costPrice;
        this.pricingMode = pricingMode;
        this.markupPercent = markupPercent;
        this.sellingPrice = sellingPrice;
    }
}
