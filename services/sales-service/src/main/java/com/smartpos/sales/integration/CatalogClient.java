package com.smartpos.sales.integration;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * REST client for fetching product information from the catalog service.
 *
 * <p>Used to obtain the server-side cost price at sale time — the client
 * is never trusted to supply cost data.</p>
 */
@Component
public class CatalogClient {

    private final RestTemplate restTemplate;
    private final String catalogBaseUrl;

    public CatalogClient(@Value("${integration.catalog-service.url:http://catalog-pricing-service:8104}") String catalogBaseUrl) {
        this.restTemplate = new RestTemplate();
        this.catalogBaseUrl = catalogBaseUrl;
    }

    /**
     * Fetches the current cost price for a product from the catalog service.
     *
     * @param storeId the store ID
     * @param productId the product ID
     * @return the cost price, or null if the product is not found
     */
    public BigDecimal getCostPrice(UUID storeId, UUID productId) {
        String url = catalogBaseUrl + "/api/v1/stores/" + storeId + "/products/" + productId;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.get("data") instanceof Map<?, ?> data) {
                Object costPrice = data.get("costPrice");
                if (costPrice != null) {
                    return new BigDecimal(costPrice.toString());
                }
            }
        } catch (Exception e) {
            // Product not found or service unavailable
            return null;
        }
        return null;
    }
}
