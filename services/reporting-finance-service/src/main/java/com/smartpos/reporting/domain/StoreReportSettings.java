package com.smartpos.reporting.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "store_report_settings")
public class StoreReportSettings {

    @Id
    @Column(name = "store_id")
    private UUID storeId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(nullable = false)
    private String channel = "email";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private String recipientsJson = "[]";

    @Column(name = "send_time", nullable = false)
    private String sendTime = "08:00";

    @Column(nullable = false)
    private String timezone = "Asia/Dubai";

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected StoreReportSettings() {
    }

    public static StoreReportSettings createDefault(UUID storeId, UUID accountId) {
        StoreReportSettings s = new StoreReportSettings();
        s.storeId = storeId;
        s.accountId = accountId;
        s.updatedAt = Instant.now();
        return s;
    }

    public UUID getStoreId() { return storeId; }
    public String getChannel() { return channel; }
    public String getRecipientsJson() { return recipientsJson; }
    public String getSendTime() { return sendTime; }
    public String getTimezone() { return timezone; }

    public void update(String channel, String recipientsJson, String sendTime, String timezone) {
        if (channel != null) this.channel = channel;
        if (recipientsJson != null) this.recipientsJson = recipientsJson;
        if (sendTime != null) this.sendTime = sendTime;
        if (timezone != null) this.timezone = timezone;
        this.updatedAt = Instant.now();
    }
}
