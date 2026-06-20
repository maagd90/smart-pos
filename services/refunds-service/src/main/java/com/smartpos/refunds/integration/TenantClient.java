package com.smartpos.refunds.integration;

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

    public String getStoreTimezone(UUID accountId, UUID storeId) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> storesResponse = restTemplate.getForObject(
                    tenantBaseUrl + "/api/v1/accounts/" + accountId + "/stores", Map.class);
            if (storesResponse != null && storesResponse.get("data") instanceof java.util.List<?> stores) {
                for (Object store : stores) {
                    if (store instanceof Map<?, ?> storeMap && storeId.toString().equals(String.valueOf(storeMap.get("id")))) {
                        Object tz = storeMap.get("timezone");
                        if (tz != null && !tz.toString().isBlank()) {
                            return tz.toString();
                        }
                    }
                }
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }
}
