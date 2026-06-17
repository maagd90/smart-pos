package com.smartpos.sales.integration;

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
 * REST client for communicating with the inventory service.
 *
 * <p>In Milestone 1, uses synchronous REST calls. Future milestones
 * will use async event-driven communication via Kafka.</p>
 */
@Component
public class InventoryClient {

    private final RestTemplate restTemplate;
    private final String inventoryBaseUrl;

    /**
     * Creates the inventory client.
     *
     * @param inventoryBaseUrl the base URL of the inventory service
     */
    public InventoryClient(@Value("${integration.inventory-service.url:http://inventory-service:8105}") String inventoryBaseUrl) {
        this.restTemplate = new RestTemplate();
        this.inventoryBaseUrl = inventoryBaseUrl;
    }

    /**
     * Creates an inventory movement for a sale (negative quantity).
     *
     * @param storeId the store ID
     * @param productId the product ID
     * @param quantity the quantity (will be negated for sales)
     * @param saleId the sale ID as reference
     */
    public void recordSaleMovement(UUID storeId, UUID productId, int quantity, UUID saleId) {
        String url = inventoryBaseUrl + "/api/v1/stores/" + storeId + "/inventory/movements";
        Map<String, Object> body = Map.of(
                "productId", productId.toString(),
                "movementType", "sale",
                "quantity", -quantity,
                "referenceType", "sale",
                "referenceId", saleId.toString()
        );
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        try {
            restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);
        } catch (Exception e) {
            System.err.println("Warning: Failed to record inventory movement: " + e.getMessage());
        }
    }
}
