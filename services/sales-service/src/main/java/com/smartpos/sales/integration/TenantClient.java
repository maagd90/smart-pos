package com.smartpos.sales.integration;

import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * Client for resolving tenant account configuration such as currency.
 */
@Component
public class TenantClient {

    private final RestTemplate restTemplate;
    private final String tenantBaseUrl;

    public TenantClient(RestTemplate restTemplate,
                        @Value("${integration.tenant-service.url:http://tenant-admin-service:8102}") String tenantBaseUrl) {
        this.restTemplate = restTemplate;
        this.tenantBaseUrl = tenantBaseUrl;
    }

    /**
     * Resolves the account currency, or null if unavailable.
     */
    public String getAccountCurrency(UUID accountId) {
        String url = tenantBaseUrl + "/api/v1/accounts/" + accountId;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.get("data") instanceof Map<?, ?> data) {
                Object currency = data.get("currency");
                if (currency != null && !currency.toString().isBlank()) {
                    return currency.toString();
                }
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }
}
