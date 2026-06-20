package com.smartpos.refunds.api.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Request to create a refund.
 *
 * @param saleId the original sale ID
 * @param items items being refunded
 * @param currency the currency
 */
public record CreateRefundRequest(UUID saleId, List<RefundItemRequest> items, String currency) {
    /**
     * A single refund item.
     */
    public record RefundItemRequest(UUID productId, String productName, int quantity, BigDecimal unitPrice, boolean resellable) {
    }
}
