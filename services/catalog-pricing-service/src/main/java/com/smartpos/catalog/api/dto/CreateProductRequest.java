package com.smartpos.catalog.api.dto;

import java.math.BigDecimal;

/**
 * Request to create a new product in a store catalog.
 *
 * @param name the product name
 * @param sku the stock keeping unit code
 * @param category the product category
 * @param costPrice the cost/purchase price
 * @param pricingMode either "markup" or "fixed"
 * @param markupPercent the markup percentage (required if pricingMode is "markup")
 * @param sellingPrice the fixed selling price (required if pricingMode is "fixed")
 * @param currency the currency code
 */
public record CreateProductRequest(
        String name,
        String sku,
        String category,
        BigDecimal costPrice,
        String pricingMode,
        BigDecimal markupPercent,
        BigDecimal sellingPrice,
        String currency
) {}
