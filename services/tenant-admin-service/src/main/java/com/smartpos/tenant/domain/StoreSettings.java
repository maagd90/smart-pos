package com.smartpos.tenant.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "store_settings")
public class StoreSettings {

    @Id
    @Column(name = "store_id")
    private UUID storeId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "opening_time", nullable = false)
    private String openingTime = "09:00";

    @Column(name = "closing_time", nullable = false)
    private String closingTime = "22:00";

    @Column(nullable = false)
    private String timezone = "Asia/Dubai";

    @Column(name = "monthly_rent", nullable = false)
    private BigDecimal monthlyRent = BigDecimal.ZERO;

    @Column(name = "default_markup_pct", nullable = false)
    private BigDecimal defaultMarkupPct = BigDecimal.ZERO;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected StoreSettings() {
    }

    public static StoreSettings createDefault(UUID storeId, UUID accountId, String timezone) {
        StoreSettings s = new StoreSettings();
        s.storeId = storeId;
        s.accountId = accountId;
        s.timezone = timezone != null ? timezone : "Asia/Dubai";
        s.updatedAt = Instant.now();
        return s;
    }

    public UUID getStoreId() { return storeId; }
    public UUID getAccountId() { return accountId; }
    public String getOpeningTime() { return openingTime; }
    public String getClosingTime() { return closingTime; }
    public String getTimezone() { return timezone; }
    public BigDecimal getMonthlyRent() { return monthlyRent; }
    public BigDecimal getDefaultMarkupPct() { return defaultMarkupPct; }

    public void update(String openingTime, String closingTime, String timezone,
                       BigDecimal monthlyRent, BigDecimal defaultMarkupPct) {
        if (openingTime != null) this.openingTime = openingTime;
        if (closingTime != null) this.closingTime = closingTime;
        if (timezone != null) this.timezone = timezone;
        if (monthlyRent != null) this.monthlyRent = monthlyRent;
        if (defaultMarkupPct != null) this.defaultMarkupPct = defaultMarkupPct;
        this.updatedAt = Instant.now();
    }
}
