package com.smartpos.sales.integration;

import java.math.BigDecimal;
import java.util.List;
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

    public BigDecimal getCostPrice(UUID storeId, UUID productId) {
        ProductSaleInfo info = getSaleInfo(storeId, productId);
        return info != null ? info.costPrice() : null;
    }

    public ProductSaleInfo getSaleInfo(UUID storeId, UUID productId) {
        String url = catalogBaseUrl + "/api/v1/stores/" + storeId + "/products/" + productId + "/sale-info";
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.get("data") instanceof Map<?, ?> data) {
                return ProductSaleInfo.from(data);
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }

    public record ProductSaleInfo(
            BigDecimal costPrice,
            boolean refundable,
            int refundWindowDays,
            boolean exchangeable,
            int exchangeWindowDays,
            BigDecimal restockingFeePct,
            BigDecimal restockingFeeFlat,
            String refundProrationTiersJson) {

        @SuppressWarnings("unchecked")
        static ProductSaleInfo from(Map<?, ?> data) {
            Object costPrice = data.get("costPrice");
            Object refundable = data.get("refundable");
            Object refundWindowDays = data.get("refundWindowDays");
            Object exchangeable = data.get("exchangeable");
            Object exchangeWindowDays = data.get("exchangeWindowDays");
            Object restockingFeePct = data.get("restockingFeePct");
            Object restockingFeeFlat = data.get("restockingFeeFlat");
            Object tiers = data.get("refundProrationTiers");
            String tiersJson = "[]";
            if (tiers instanceof List<?> tierList && !tierList.isEmpty()) {
                StringBuilder sb = new StringBuilder("[");
                for (int i = 0; i < tierList.size(); i++) {
                    if (tierList.get(i) instanceof Map<?, ?> tier) {
                        if (i > 0) sb.append(",");
                        sb.append("{\"withinDays\":").append(tier.get("withinDays"))
                                .append(",\"refundPct\":").append(tier.get("refundPct")).append("}");
                    }
                }
                sb.append("]");
                tiersJson = sb.toString();
            }
            return new ProductSaleInfo(
                    costPrice != null ? new BigDecimal(costPrice.toString()) : BigDecimal.ZERO,
                    refundable == null || Boolean.parseBoolean(refundable.toString()),
                    refundWindowDays != null ? Integer.parseInt(refundWindowDays.toString()) : 14,
                    exchangeable == null || Boolean.parseBoolean(exchangeable.toString()),
                    exchangeWindowDays != null ? Integer.parseInt(exchangeWindowDays.toString()) : 14,
                    restockingFeePct != null ? new BigDecimal(restockingFeePct.toString()) : BigDecimal.ZERO,
                    restockingFeeFlat != null ? new BigDecimal(restockingFeeFlat.toString()) : BigDecimal.ZERO,
                    tiersJson);
        }
    }
}
