package com.smartpos.refunds.integration;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class SalesClient {

    private final RestTemplate restTemplate;
    private final String salesBaseUrl;

    public SalesClient(RestTemplate restTemplate,
                       @Value("${integration.sales-service.url:http://sales-service:8106}") String salesBaseUrl) {
        this.restTemplate = restTemplate;
        this.salesBaseUrl = salesBaseUrl;
    }

    public SaleDetails getSale(UUID storeId, UUID saleId) {
        String url = salesBaseUrl + "/api/v1/stores/" + storeId + "/sales/" + saleId;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.get("data") instanceof Map<?, ?> data) {
                return SaleDetails.from(data);
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }

    public UUID createSale(UUID storeId, List<SaleLineRequest> items, String currency) {
        String url = salesBaseUrl + "/api/v1/stores/" + storeId + "/sales";
        List<Map<String, Object>> itemPayloads = items.stream()
                .map(i -> Map.<String, Object>of(
                        "productId", i.productId().toString(),
                        "productName", i.productName(),
                        "quantity", i.quantity(),
                        "unitPrice", i.unitPrice()))
                .toList();
        Map<String, Object> body = Map.of("items", itemPayloads, "currency", currency);
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, body, Map.class);
            if (response != null && response.get("data") instanceof Map<?, ?> data) {
                Object id = data.get("id");
                if (id != null) {
                    return UUID.fromString(id.toString());
                }
            }
        } catch (Exception e) {
            throw new SalesClientException("Failed to create replacement sale: " + e.getMessage(), e);
        }
        throw new SalesClientException("Failed to create replacement sale: empty response");
    }

    public void voidSale(UUID storeId, UUID saleId) {
        String url = salesBaseUrl + "/api/v1/stores/" + storeId + "/sales/" + saleId + "/void";
        try {
            restTemplate.postForObject(url, Map.of(), Map.class);
        } catch (Exception e) {
            throw new SalesClientException("Failed to void sale " + saleId + ": " + e.getMessage(), e);
        }
    }

    public record SaleLineRequest(UUID productId, String productName, int quantity, BigDecimal unitPrice) {
    }

    public record SaleDetails(
            UUID id,
            UUID storeId,
            String status,
            String currency,
            Instant createdAt,
            List<SaleLineDetails> items) {

        @SuppressWarnings("unchecked")
        static SaleDetails from(Map<?, ?> data) {
            UUID id = UUID.fromString(data.get("id").toString());
            UUID storeId = UUID.fromString(data.get("storeId").toString());
            String status = data.get("status").toString();
            String currency = data.get("currency").toString();
            Instant createdAt = Instant.parse(data.get("createdAt").toString());
            List<SaleLineDetails> items = ((List<?>) data.get("items")).stream()
                    .filter(i -> i instanceof Map)
                    .map(i -> SaleLineDetails.from((Map<?, ?>) i))
                    .toList();
            return new SaleDetails(id, storeId, status, currency, createdAt, items);
        }
    }

    public record SaleLineDetails(
            UUID productId,
            String productName,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal,
            boolean refundable,
            int refundWindowDays,
            boolean exchangeable,
            int exchangeWindowDays,
            BigDecimal restockingFeePct,
            BigDecimal restockingFeeFlat,
            String refundProrationTiersJson) {

        static SaleLineDetails from(Map<?, ?> data) {
            return new SaleLineDetails(
                    UUID.fromString(data.get("productId").toString()),
                    data.get("productName").toString(),
                    Integer.parseInt(data.get("quantity").toString()),
                    new BigDecimal(data.get("unitPrice").toString()),
                    new BigDecimal(data.get("lineTotal").toString()),
                    data.get("refundable") == null || Boolean.parseBoolean(data.get("refundable").toString()),
                    data.get("refundWindowDays") != null ? Integer.parseInt(data.get("refundWindowDays").toString()) : 14,
                    data.get("exchangeable") == null || Boolean.parseBoolean(data.get("exchangeable").toString()),
                    data.get("exchangeWindowDays") != null ? Integer.parseInt(data.get("exchangeWindowDays").toString()) : 14,
                    data.get("restockingFeePct") != null ? new BigDecimal(data.get("restockingFeePct").toString()) : BigDecimal.ZERO,
                    data.get("restockingFeeFlat") != null ? new BigDecimal(data.get("restockingFeeFlat").toString()) : BigDecimal.ZERO,
                    data.get("refundProrationTiersJson") != null ? data.get("refundProrationTiersJson").toString()
                            : (data.get("refundProrationTiers") != null ? data.get("refundProrationTiers").toString() : "[]"));
        }
    }

    public static class SalesClientException extends RuntimeException {
        public SalesClientException(String message, Throwable cause) {
            super(message, cause);
        }

        public SalesClientException(String message) {
            super(message);
        }
    }
}
