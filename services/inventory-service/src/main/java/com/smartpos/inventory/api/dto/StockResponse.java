package com.smartpos.inventory.api.dto;

import java.util.UUID;

/**
 * Response showing current stock level for a product.
 *
 * @param storeId the store ID
 * @param productId the product ID
 * @param currentStock the current stock quantity
 */
public record StockResponse(UUID storeId, UUID productId, int currentStock) {}
