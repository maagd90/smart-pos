package com.smartpos.catalog.api.dto;

import com.smartpos.catalog.domain.Product;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO representing a product with pricing details.
 *
 * @param id the product ID
 * @param storeId the store ID
 * @param name the product name
 * @param sku the SKU
 * @param category the category
 * @param costPrice the cost price
 * @param pricingMode the pricing mode
 * @param markupPercent the markup percentage (null for fixed pricing)
 * @param sellingPrice the selling price
 * @param currency the currency code
 * @param createdAt when the product was created
 */
public record ProductResponse(
        UUID id, UUID storeId, String name, String sku, String category,
        BigDecimal costPrice, String pricingMode, BigDecimal markupPercent,
        BigDecimal sellingPrice, String currency, Instant createdAt
) {

    /**
     * Creates a response from a domain entity.
     *
     * @param product the product entity
     * @return the response DTO
     */
    public static ProductResponse from(Product product) {
        return new ProductResponse(
                product.getId(), product.getStoreId(), product.getName(),
                product.getSku(), product.getCategory(), product.getCostPrice(),
                product.getPricingMode(), product.getMarkupPercent(),
                product.getSellingPrice(), product.getCurrency(), product.getCreatedAt());
    }
}
