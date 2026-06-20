package com.smartpos.inventory.api.dto;

import com.smartpos.inventory.domain.InventoryMovement;
import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO representing an inventory movement.
 *
 * @param id the movement ID
 * @param storeId the store ID
 * @param productId the product ID
 * @param movementType the movement type
 * @param quantity the signed quantity
 * @param referenceType the reference type
 * @param referenceId the reference ID
 * @param createdAt when the movement was recorded
 */
public record MovementResponse(UUID id, UUID storeId, UUID productId, String movementType,
                               int quantity, String referenceType, UUID referenceId, Instant createdAt) {

    /**
     * Creates a response from a domain entity.
     *
     * @param movement the movement entity
     * @return the response DTO
     */
    public static MovementResponse from(InventoryMovement movement) {
        return new MovementResponse(
                movement.getId(),
                movement.getStoreId(),
                movement.getProductId(),
                movement.getMovementType(),
                movement.getQuantity(),
                movement.getReferenceType(),
                movement.getReferenceId(),
                movement.getCreatedAt());
    }
}
