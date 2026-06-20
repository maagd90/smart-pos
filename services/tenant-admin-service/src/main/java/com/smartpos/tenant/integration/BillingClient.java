package com.smartpos.tenant.integration;

import com.smartpos.contracts.subscription.SubscriptionGateDecision;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class BillingClient {

    private final RestTemplate restTemplate;
    private final String billingBaseUrl;

    public BillingClient(RestTemplate restTemplate,
                         @Value("${integration.billing-service.url:http://billing-subscription-service:8103}") String billingBaseUrl) {
        this.restTemplate = restTemplate;
        this.billingBaseUrl = billingBaseUrl;
    }

    @SuppressWarnings("unchecked")
    public SubscriptionGateDecision evaluateStoreCreate(UUID accountId, int currentStoreCount) {
        String path = "/api/v1/accounts/" + accountId + "/stores";
        Map<String, Object> body = Map.of(
                "accountId", accountId.toString(),
                "path", path,
                "method", "POST",
                "currentStoreCount", currentStoreCount);
        Map<String, Object> response = restTemplate.postForObject(
                billingBaseUrl + "/api/v1/billing/gate/evaluate", body, Map.class);
        if (response == null || !(response.get("data") instanceof Map<?, ?> data)) {
            return SubscriptionGateDecision.allow();
        }
        String action = String.valueOf(data.get("action"));
        String reason = data.get("reason") != null ? data.get("reason").toString() : null;
        return switch (action) {
            case "UPGRADE_REQUIRED" -> SubscriptionGateDecision.upgradeRequired(reason);
            case "DENY" -> SubscriptionGateDecision.deny(reason);
            default -> SubscriptionGateDecision.allow();
        };
    }

    public void assignDefaultPlan(UUID accountId) {
        try {
            restTemplate.postForObject(
                    billingBaseUrl + "/internal/accounts/" + accountId + "/default-plan", null, Map.class);
        } catch (Exception ignored) {
            // best effort during platform create
        }
    }
}
