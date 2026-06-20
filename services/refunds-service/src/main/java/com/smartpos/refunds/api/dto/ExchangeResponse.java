package com.smartpos.refunds.api.dto;

import com.smartpos.refunds.domain.Exchange;
import java.time.Instant;
import java.util.UUID;

public record ExchangeResponse(
        UUID id,
        UUID storeId,
        UUID originalSaleId,
        UUID replacementSaleId,
        String status,
        String errorMessage,
        Instant createdAt) {

    public static ExchangeResponse from(Exchange exchange) {
        return new ExchangeResponse(exchange.getId(), exchange.getStoreId(), exchange.getOriginalSaleId(),
                exchange.getReplacementSaleId(), exchange.getStatus(), exchange.getErrorMessage(),
                exchange.getCreatedAt());
    }
}
