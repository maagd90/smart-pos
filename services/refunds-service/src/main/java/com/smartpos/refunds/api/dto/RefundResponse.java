package com.smartpos.refunds.api.dto;

import com.smartpos.refunds.domain.Refund;
import com.smartpos.refunds.domain.RefundItem;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for a refund.
 */
public record RefundResponse(UUID id, UUID storeId, UUID saleId, BigDecimal total, String currency,
                             String status, List<RefundItemResponse> items, Instant createdAt) {

    public static RefundResponse from(Refund refund) {
        List<RefundItemResponse> itemResponses = refund.getItems().stream()
                .map(RefundItemResponse::from).toList();
        return new RefundResponse(refund.getId(), refund.getStoreId(), refund.getSaleId(),
                refund.getTotal(), refund.getCurrency(), refund.getStatus(), itemResponses, refund.getCreatedAt());
    }

    public record RefundItemResponse(UUID productId, String productName, int quantity,
                                     BigDecimal unitPrice, BigDecimal lineTotal, boolean resellable) {
        public static RefundItemResponse from(RefundItem item) {
            return new RefundItemResponse(item.getProductId(), item.getProductName(),
                    item.getQuantity(), item.getUnitPrice(), item.getLineTotal(), item.isResellable());
        }
    }
}
