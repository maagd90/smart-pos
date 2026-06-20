package com.smartpos.catalog.api.dto;

import com.smartpos.catalog.domain.ResolvedRefundPolicy;
import java.math.BigDecimal;
import java.util.List;

public record ProductSaleInfoResponse(
        BigDecimal costPrice,
        boolean refundable,
        int refundWindowDays,
        boolean exchangeable,
        int exchangeWindowDays,
        BigDecimal restockingFeePct,
        BigDecimal restockingFeeFlat,
        List<ProrationTierResponse> refundProrationTiers) {

    public static ProductSaleInfoResponse from(ResolvedRefundPolicy policy) {
        List<ProrationTierResponse> tiers = policy.refundProrationTiers().stream()
                .map(t -> new ProrationTierResponse(t.withinDays(), t.refundPct()))
                .toList();
        return new ProductSaleInfoResponse(
                policy.costPrice(),
                policy.refundable(),
                policy.refundWindowDays(),
                policy.exchangeable(),
                policy.exchangeWindowDays(),
                policy.restockingFeePct(),
                policy.restockingFeeFlat(),
                tiers);
    }

    public record ProrationTierResponse(int withinDays, BigDecimal refundPct) {
    }
}
