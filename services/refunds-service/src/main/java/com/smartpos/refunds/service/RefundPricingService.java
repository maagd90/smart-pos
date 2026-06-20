package com.smartpos.refunds.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpos.refunds.integration.SalesClient;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

public class RefundPricingService {

    private final ObjectMapper objectMapper;

    public RefundPricingService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public RefundPricingResult computeRefundPricing(
            SalesClient.SaleLineDetails saleLine,
            int refundQuantity,
            Instant saleCreatedAt,
            ZoneId storeTimezone) {
        BigDecimal baseAmount = saleLine.unitPrice().multiply(BigDecimal.valueOf(refundQuantity));
        long elapsedDays = elapsedDaysSinceSale(saleCreatedAt, storeTimezone);
        BigDecimal prorationPct = resolveProration(saleLine.refundProrationTiersJson(), elapsedDays);
        BigDecimal proratedAmount = baseAmount.multiply(prorationPct)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal pctFee = proratedAmount.multiply(saleLine.restockingFeePct())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal flatFee = saleLine.restockingFeeFlat().multiply(BigDecimal.valueOf(refundQuantity));
        BigDecimal restockingFee = pctFee.add(flatFee);
        BigDecimal refundAmount = proratedAmount.subtract(restockingFee).max(BigDecimal.ZERO);
        return new RefundPricingResult(baseAmount, prorationPct, proratedAmount, restockingFee, refundAmount);
    }

    public BigDecimal computeExchangeCredit(SalesClient.SaleLineDetails saleLine, int quantity) {
        return saleLine.unitPrice().multiply(BigDecimal.valueOf(quantity));
    }

    long elapsedDaysSinceSale(Instant saleCreatedAt, ZoneId storeTimezone) {
        LocalDate saleDate = saleCreatedAt.atZone(storeTimezone).toLocalDate();
        LocalDate today = LocalDate.now(storeTimezone);
        return ChronoUnit.DAYS.between(saleDate, today);
    }

    BigDecimal resolveProration(String tiersJson, long elapsedDays) {
        List<Map<String, Object>> tiers = parseTiers(tiersJson);
        if (tiers.isEmpty()) {
            return BigDecimal.valueOf(100);
        }
        return tiers.stream()
                .sorted(Comparator.comparingInt(t -> Integer.parseInt(t.get("withinDays").toString())))
                .filter(t -> elapsedDays <= Integer.parseInt(t.get("withinDays").toString()))
                .findFirst()
                .map(t -> new BigDecimal(t.get("refundPct").toString()))
                .orElse(BigDecimal.ZERO);
    }

    private List<Map<String, Object>> parseTiers(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
