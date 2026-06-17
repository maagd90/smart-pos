package com.smartpos.refunds.integration;

import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * REST client for creating inventory return movements.
 */
@Component
public class InventoryClient {

    private final RestTemplate restTemplate;
    private final String inventoryBaseUrl;

    public InventoryClient(@Value("${integration.inventory-service.url:http://inventory-service:8105}") String inventoryBaseUrl) {
        this.restTemplate = new RestTemplate();
        this.inventoryBaseUrl = inventoryBaseUrl;
    }

    /**
     * Records a return movement in inventory.
     */
    public void recordReturnMovement(UUID storeId, UUID productId, int quantity, UUID refundId) {
        String url = inventoryBaseUrl + "/api/v1/stores/" + storeId + "/inventory/movements";
        Map<String, Object> body = Map.of(
                "productId", productId.toString(),
                "movementType", "return",
                "quantity", quantity,
                "referenceType", "refund",
                "referenceId", refundId.toString()
        );
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        try {
            restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);
        } catch (Exception e) {
            System.err.println("Warning: Failed to record inventory return: " + e.getMessage());
        }
    }
}
