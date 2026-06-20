package com.smartpos.tenant.api.dto;

import com.smartpos.tenant.domain.Store;
import java.time.Instant;
import java.util.UUID;

public record StoreResponse(
        UUID id,
        UUID accountId,
        String name,
        String timezone,
        String currency,
        String status,
        Instant createdAt) {

    public static StoreResponse from(Store store, String currency) {
        return new StoreResponse(
                store.getId(),
                store.getAccountId(),
                store.getName(),
                store.getTimezone(),
                currency,
                store.getStatus(),
                store.getCreatedAt());
    }
}
