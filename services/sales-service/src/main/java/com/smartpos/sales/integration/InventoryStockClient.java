package com.smartpos.sales.integration;

import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * Read-only client for checking current stock levels before sale creation.
 */
@Component
public class InventoryStockClient {

    private final RestTemplate restTemplate;
    private final String inventoryBaseUrl;

    public InventoryStockClient(RestTemplate restTemplate,
                                @Value("${integration.inventory-service.url:http://inventory-service:8105}") String inventoryBaseUrl) {
        this.restTemplate = restTemplate;
        this.inventoryBaseUrl = inventoryBaseUrl;
    }

    /**
     * Returns current stock for a product, or null if unavailable.
     */
    public Integer getCurrentStock(UUID storeId, UUID productId) {
        String url = inventoryBaseUrl + "/api/v1/stores/" + storeId + "/inventory/stock/" + productId;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.get("data") instanceof Map<?, ?> data) {
                Object currentStock = data.get("currentStock");
                if (currentStock != null) {
                    return Integer.parseInt(currentStock.toString());
                }
            }
        } catch (Exception e) {
            throw new InventoryUnavailableException("Unable to verify stock for product " + productId, e);
        }
        return null;
    }

    public static class InventoryUnavailableException extends RuntimeException {
        public InventoryUnavailableException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
