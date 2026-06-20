package com.smartpos.refunds.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpos.refunds.domain.RefundedQuantity;
import com.smartpos.refunds.domain.RefundedQuantityRepository;
import com.smartpos.refunds.integration.SalesClient;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RefundEligibilityServiceTest {

    @Mock private RefundedQuantityRepository refundedQuantityRepository;

    private RefundEligibilityService eligibilityService;

    private final UUID storeId = UUID.randomUUID();
    private final ZoneId timezone = ZoneId.of("Asia/Dubai");

    @BeforeEach
    void setUp() {
        eligibilityService = new RefundEligibilityService(
                refundedQuantityRepository, new RefundPricingService(new ObjectMapper()));
    }

    @Test
    void rejectsVoidedSale() {
        var sale = sale("VOIDED", Instant.now());
        var line = line(true, 14, true, 14);
        var failure = eligibilityService.checkRefundEligibility(sale, line, 1, timezone);
        assertTrue(failure.isPresent());
        assertEquals("SALE_VOIDED", failure.get().code());
    }

    @Test
    void rejectsNonRefundableProduct() {
        var sale = sale("ACTIVE", Instant.now());
        var line = line(false, 14, true, 14);
        var failure = eligibilityService.checkRefundEligibility(sale, line, 1, timezone);
        assertTrue(failure.isPresent());
        assertEquals("NOT_REFUNDABLE", failure.get().code());
    }

    @Test
    void rejectsExpiredRefundWindow() {
        var sale = sale("ACTIVE", Instant.now().minusSeconds(86400L * 20));
        var line = line(true, 14, true, 14);
        var failure = eligibilityService.checkRefundEligibility(sale, line, 1, timezone);
        assertTrue(failure.isPresent());
        assertEquals("REFUND_WINDOW_EXPIRED", failure.get().code());
    }

    @Test
    void rejectsQuantityExceeded() {
        UUID productId = UUID.randomUUID();
        var sale = sale("ACTIVE", Instant.now());
        var line = new SalesClient.SaleLineDetails(productId, "P", 3, new BigDecimal("100"),
                new BigDecimal("300"), true, 14, true, 14, BigDecimal.ZERO, BigDecimal.ZERO, "[]");
        when(refundedQuantityRepository.findByStoreIdAndSaleIdAndProductId(storeId, sale.id(), productId))
                .thenReturn(Optional.of(new RefundedQuantity(storeId, sale.id(), productId, 2)));

        var failure = eligibilityService.checkRefundEligibility(sale, line, 2, timezone);
        assertTrue(failure.isPresent());
        assertEquals("QUANTITY_EXCEEDED", failure.get().code());
    }

    @Test
    void rejectsNonExchangeableProduct() {
        var sale = sale("ACTIVE", Instant.now());
        var line = line(true, 14, false, 14);
        var failure = eligibilityService.checkExchangeEligibility(sale, line, 1, timezone);
        assertTrue(failure.isPresent());
        assertEquals("NOT_EXCHANGEABLE", failure.get().code());
    }

    private SalesClient.SaleDetails sale(String status, Instant createdAt) {
        return new SalesClient.SaleDetails(UUID.randomUUID(), storeId, status, "AED", createdAt, List.of());
    }

    private SalesClient.SaleLineDetails line(boolean refundable, int refundDays,
                                             boolean exchangeable, int exchangeDays) {
        return new SalesClient.SaleLineDetails(UUID.randomUUID(), "P", 5, new BigDecimal("100"),
                new BigDecimal("500"), refundable, refundDays, exchangeable, exchangeDays,
                BigDecimal.ZERO, BigDecimal.ZERO, "[]");
    }
}
