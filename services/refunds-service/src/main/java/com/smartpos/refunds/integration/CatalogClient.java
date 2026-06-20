package com.smartpos.refunds.integration;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class CatalogClient {

    private final RestTemplate restTemplate;
    private final String catalogBaseUrl;

    public CatalogClient(RestTemplate restTemplate,
                         @Value("${integration.catalog-service.url:http://catalog-pricing-service:8104}") String catalogBaseUrl) {
        this.restTemplate = restTemplate;
        this.catalogBaseUrl = catalogBaseUrl;
    }

    public BigDecimal getSellingPrice(UUID storeId, UUID productId) {
        String url = catalogBaseUrl + "/api/v1/stores/" + storeId + "/products/" + productId;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.get("data") instanceof Map<?, ?> data) {
                Object sellingPrice = data.get("sellingPrice");
                if (sellingPrice != null) {
                    return new BigDecimal(sellingPrice.toString());
                }
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }

    public String getProductName(UUID storeId, UUID productId) {
        String url = catalogBaseUrl + "/api/v1/stores/" + storeId + "/products/" + productId;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.get("data") instanceof Map<?, ?> data) {
                Object name = data.get("name");
                return name != null ? name.toString() : "Product";
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }
}
