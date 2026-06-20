package com.smartpos.refunds.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpos.refunds.integration.SalesClient;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class RefundPricingServiceTest {

    private RefundPricingService pricingService;

    private final ZoneId timezone = ZoneId.of("Asia/Dubai");

    @BeforeEach
    void setUp() {
        pricingService = new RefundPricingService(new ObjectMapper());
    }

    @Test
    void fullRefundWhenNoTiersAndNoFees() {
        SalesClient.SaleLineDetails line = line(new BigDecimal("1575"), "[]", BigDecimal.ZERO, BigDecimal.ZERO);
        RefundPricingResult result = pricingService.computeRefundPricing(line, 1, Instant.now(), timezone);
        assertEquals(new BigDecimal("1575.00"), result.refundAmount());
    }

    @Test
    void appliesProrationTier() {
        String tiers = "[{\"withinDays\":7,\"refundPct\":50},{\"withinDays\":14,\"refundPct\":25}]";
        assertEquals(new BigDecimal("50"), pricingService.resolveProration(tiers, 3));
        assertEquals(new BigDecimal("25"), pricingService.resolveProration(tiers, 10));
        assertEquals(BigDecimal.ZERO, pricingService.resolveProration(tiers, 20));
    }

    @Test
    void deductsRestockingFees() {
        SalesClient.SaleLineDetails line = line(new BigDecimal("1000"), "[]",
                new BigDecimal("10"), new BigDecimal("5"));
        RefundPricingResult result = pricingService.computeRefundPricing(line, 2, Instant.now(), timezone);
        assertEquals(0, new BigDecimal("2000.00").compareTo(result.baseAmount()));
        assertEquals(0, new BigDecimal("210.00").compareTo(result.restockingFee()));
        assertEquals(0, new BigDecimal("1790.00").compareTo(result.refundAmount()));
    }

    @Test
    void exchangeCreditUsesFullLinePrice() {
        SalesClient.SaleLineDetails line = line(new BigDecimal("1575"), "[]", BigDecimal.ZERO, BigDecimal.ZERO);
        assertEquals(new BigDecimal("3150"), pricingService.computeExchangeCredit(line, 2));
    }

    private SalesClient.SaleLineDetails line(BigDecimal unitPrice, String tiersJson,
                                            BigDecimal feePct, BigDecimal feeFlat) {
        return new SalesClient.SaleLineDetails(UUID.randomUUID(), "Product", 5, unitPrice,
                unitPrice.multiply(BigDecimal.valueOf(5)), true, 14, true, 14, feePct, feeFlat, tiersJson);
    }
}
