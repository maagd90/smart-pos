package com.smartpos.refunds.api.dto;

import java.util.List;
import java.util.UUID;

public record CreateRefundRequest(UUID saleId, List<RefundItemRequest> items, String currency) {

    public record RefundItemRequest(UUID productId, int quantity, boolean resellable) {
    }
}
