package com.smartpos.notificationsapprovals.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "notifications")
public class NotificationsProperties {

    private String publicBaseUrl = "http://localhost:8080";
    private int ttlDays = 7;
    private String identityUrl = "http://identity-access-service:8101";
    private String aiDealsUrl = "http://ai-deals-service:8109";
    private String inventoryUrl = "http://inventory-service:8105";
    private String mailFrom = "noreply@smartpos.local";

    public String getPublicBaseUrl() { return publicBaseUrl; }
    public void setPublicBaseUrl(String publicBaseUrl) { this.publicBaseUrl = publicBaseUrl; }
    public int getTtlDays() { return ttlDays; }
    public void setTtlDays(int ttlDays) { this.ttlDays = ttlDays; }
    public String getIdentityUrl() { return identityUrl; }
    public void setIdentityUrl(String identityUrl) { this.identityUrl = identityUrl; }
    public String getAiDealsUrl() { return aiDealsUrl; }
    public void setAiDealsUrl(String aiDealsUrl) { this.aiDealsUrl = aiDealsUrl; }
    public String getInventoryUrl() { return inventoryUrl; }
    public void setInventoryUrl(String inventoryUrl) { this.inventoryUrl = inventoryUrl; }
    public String getMailFrom() { return mailFrom; }
    public void setMailFrom(String mailFrom) { this.mailFrom = mailFrom; }
}
