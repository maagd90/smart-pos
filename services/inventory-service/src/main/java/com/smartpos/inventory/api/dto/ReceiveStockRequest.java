package com.smartpos.inventory.api.dto;

import java.util.UUID;

/**
 * Request to receive stock into inventory.
 *
 * @param productId the product to receive stock for
 * @param quantity the quantity to receive (must be positive)
 */
public record ReceiveStockRequest(UUID productId, int quantity) {}
