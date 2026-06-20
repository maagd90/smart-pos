package com.smartpos.catalog.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ProductPricingTest {

    @Test
    void markupOnCostCalculatesSellingPrice() {
        Product product = Product.withMarkup(
                UUID.randomUUID(),
                UUID.randomUUID(),
                "Test Product",
                "SKU-1",
                "General",
                new BigDecimal("1500"),
                new BigDecimal("5"),
                "AED");

        assertEquals(new BigDecimal("1575.00"), product.getSellingPrice());
        assertEquals("markup", product.getPricingMode());
    }

    @Test
    void fixedModeUsesProvidedSellingPrice() {
        Product product = Product.withFixedPrice(
                UUID.randomUUID(),
                UUID.randomUUID(),
                "Fixed Product",
                "SKU-2",
                "General",
                new BigDecimal("1500"),
                new BigDecimal("1600"),
                "AED");

        assertEquals(new BigDecimal("1600"), product.getSellingPrice());
        assertEquals("fixed", product.getPricingMode());
    }
}
