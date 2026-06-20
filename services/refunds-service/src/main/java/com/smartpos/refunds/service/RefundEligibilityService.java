package com.smartpos.refunds.service;

import com.smartpos.refunds.domain.RefundedQuantity;
import com.smartpos.refunds.domain.RefundedQuantityRepository;
import com.smartpos.refunds.integration.SalesClient;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

public class RefundEligibilityService {

    private final RefundedQuantityRepository refundedQuantityRepository;
    private final RefundPricingService pricingService;

    public RefundEligibilityService(RefundedQuantityRepository refundedQuantityRepository,
                                    RefundPricingService pricingService) {
        this.refundedQuantityRepository = refundedQuantityRepository;
        this.pricingService = pricingService;
    }

    public Optional<EligibilityFailure> checkRefundEligibility(
            SalesClient.SaleDetails sale,
            SalesClient.SaleLineDetails saleLine,
            int requestedQty,
            ZoneId storeTimezone) {
        if ("VOIDED".equals(sale.status())) {
            return Optional.of(new EligibilityFailure("SALE_VOIDED", "Sale has been voided"));
        }
        if (!saleLine.refundable()) {
            return Optional.of(new EligibilityFailure("NOT_REFUNDABLE", "Product is not refundable"));
        }
        long elapsedDays = pricingService.elapsedDaysSinceSale(sale.createdAt(), storeTimezone);
        if (elapsedDays > saleLine.refundWindowDays()) {
            return Optional.of(new EligibilityFailure("REFUND_WINDOW_EXPIRED", "Refund window has expired"));
        }
        int alreadyRefunded = refundedQuantityRepository
                .findByStoreIdAndSaleIdAndProductId(sale.storeId(), sale.id(), saleLine.productId())
                .map(RefundedQuantity::getQuantityRefunded)
                .orElse(0);
        if (alreadyRefunded + requestedQty > saleLine.quantity()) {
            return Optional.of(new EligibilityFailure("QUANTITY_EXCEEDED", "Refund quantity exceeds sold quantity"));
        }
        return Optional.empty();
    }

    public Optional<EligibilityFailure> checkExchangeEligibility(
            SalesClient.SaleDetails sale,
            SalesClient.SaleLineDetails saleLine,
            int requestedQty,
            ZoneId storeTimezone) {
        if ("VOIDED".equals(sale.status())) {
            return Optional.of(new EligibilityFailure("SALE_VOIDED", "Sale has been voided"));
        }
        if (!saleLine.exchangeable()) {
            return Optional.of(new EligibilityFailure("NOT_EXCHANGEABLE", "Product is not exchangeable"));
        }
        long elapsedDays = pricingService.elapsedDaysSinceSale(sale.createdAt(), storeTimezone);
        if (elapsedDays > saleLine.exchangeWindowDays()) {
            return Optional.of(new EligibilityFailure("EXCHANGE_WINDOW_EXPIRED", "Exchange window has expired"));
        }
        int alreadyRefunded = refundedQuantityRepository
                .findByStoreIdAndSaleIdAndProductId(sale.storeId(), sale.id(), saleLine.productId())
                .map(RefundedQuantity::getQuantityRefunded)
                .orElse(0);
        if (alreadyRefunded + requestedQty > saleLine.quantity()) {
            return Optional.of(new EligibilityFailure("QUANTITY_EXCEEDED", "Exchange quantity exceeds sold quantity"));
        }
        return Optional.empty();
    }

    public SalesClient.SaleLineDetails findSaleLine(SalesClient.SaleDetails sale, UUID productId) {
        return sale.items().stream()
                .filter(i -> i.productId().equals(productId))
                .findFirst()
                .orElse(null);
    }

    public record EligibilityFailure(String code, String message) {
    }
}
