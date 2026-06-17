package com.smartpos.tenant.api.dto;

import com.smartpos.tenant.domain.Store;
import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO representing a store.
 *
 * @param id the store ID
 * @param accountId the owning account's ID
 * @param name the store name
 * @param timezone the store timezone
 * @param status the store status
 * @param createdAt when the store was created
 */
public record StoreResponse(UUID id, UUID accountId, String name, String timezone, String status, Instant createdAt) {

    /**
     * Creates a response from a domain entity.
     *
     * @param store the store entity
     * @return the response DTO
     */
    public static StoreResponse from(Store store) {
        return new StoreResponse(
                store.getId(),
                store.getAccountId(),
                store.getName(),
                store.getTimezone(),
                store.getStatus(),
                store.getCreatedAt());
    }
}
