package com.smartpos.sales.api.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Request to create a new sale.
 *
 * @param items the items being sold
 * @param currency the transaction currency
 */
public record CreateSaleRequest(List<SaleItemRequest> items, String currency) {

    /**
     * A single item in the sale request.
     *
     * @param productId the product ID
     * @param productName the product name
     * @param quantity the quantity to sell
     * @param unitPrice the unit selling price
     */
    public record SaleItemRequest(UUID productId, String productName, int quantity, BigDecimal unitPrice) {
    }
}
