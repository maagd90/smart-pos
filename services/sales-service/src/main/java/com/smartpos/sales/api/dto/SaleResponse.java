package com.smartpos.sales.api.dto;

import com.smartpos.sales.domain.Sale;
import com.smartpos.sales.domain.SaleItem;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for a sale.
 */
public record SaleResponse(UUID id, UUID storeId, BigDecimal total, String currency, String status,
                           List<SaleItemResponse> items, Instant createdAt) {

    /**
     * Creates response from domain entity.
     */
    public static SaleResponse from(Sale sale) {
        List<SaleItemResponse> itemResponses = sale.getItems().stream()
                .map(SaleItemResponse::from)
                .toList();
        return new SaleResponse(sale.getId(), sale.getStoreId(), sale.getTotal(),
                sale.getCurrency(), sale.getStatus(), itemResponses, sale.getCreatedAt());
    }

    /**
     * Sale item response.
     */
    public record SaleItemResponse(UUID productId, String productName, int quantity,
                                   BigDecimal unitPrice, BigDecimal lineTotal,
                                   BigDecimal costPrice, BigDecimal lineCost) {
        /**
         * Creates from domain entity.
         */
        public static SaleItemResponse from(SaleItem item) {
            return new SaleItemResponse(item.getProductId(), item.getProductName(),
                    item.getQuantity(), item.getUnitPrice(), item.getLineTotal(),
                    item.getCostPrice(), item.getLineCost());
        }
    }
}
