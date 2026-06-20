package com.smartpos.inventory.api.dto;

import com.smartpos.inventory.domain.InventoryChangeRequest;
import java.util.UUID;

public record ChangeRequestResponse(UUID id, UUID storeId, UUID productId, int quantity, String summary, String status) {
    public static ChangeRequestResponse from(InventoryChangeRequest request) {
        return new ChangeRequestResponse(
                request.getId(), request.getStoreId(), request.getProductId(),
                request.getQuantity(), request.getSummary(), request.getStatus());
    }
}
