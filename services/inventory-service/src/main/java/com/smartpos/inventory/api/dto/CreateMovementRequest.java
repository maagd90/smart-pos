package com.smartpos.inventory.api.dto;

import java.util.UUID;

/**
 * Request to create an inventory movement (used internally by other services).
 *
 * @param productId the product ID
 * @param movementType the movement type (receive, sale, return, adjust)
 * @param quantity the signed quantity
 * @param referenceType optional reference type
 * @param referenceId optional reference ID
 */
public record CreateMovementRequest(
        UUID productId,
        String movementType,
        int quantity,
        String referenceType,
        UUID referenceId) {}
