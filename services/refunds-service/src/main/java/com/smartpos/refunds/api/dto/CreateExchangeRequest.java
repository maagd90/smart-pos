package com.smartpos.refunds.api.dto;

import java.util.List;
import java.util.UUID;

public record CreateExchangeRequest(
        UUID originalSaleId,
        List<ExchangeItemRequest> returnedItems,
        List<ExchangeItemRequest> replacementItems) {

    public record ExchangeItemRequest(UUID productId, int quantity, Boolean resellable) {
    }
}
