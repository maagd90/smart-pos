package com.smartpos.catalog.api.dto;

import com.smartpos.catalog.domain.ProrationTier;
import com.smartpos.catalog.domain.StoreRefundPolicy;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record RefundPolicyResponse(
        UUID storeId,
        boolean defaultRefundable,
        int defaultRefundWindowDays,
        boolean defaultExchangeable,
        int defaultExchangeWindowDays,
        BigDecimal restockingFeePct,
        BigDecimal restockingFeeFlat,
        List<ProrationTierRequest> refundProrationTiers) {

    public static RefundPolicyResponse from(StoreRefundPolicy policy, List<ProrationTier> tiers) {
        List<ProrationTierRequest> tierRequests = tiers.stream()
                .map(t -> new ProrationTierRequest(t.withinDays(), t.refundPct()))
                .toList();
        return new RefundPolicyResponse(
                policy.getStoreId(),
                policy.isDefaultRefundable(),
                policy.getDefaultRefundWindowDays(),
                policy.isDefaultExchangeable(),
                policy.getDefaultExchangeWindowDays(),
                policy.getRestockingFeePct(),
                policy.getRestockingFeeFlat(),
                tierRequests);
    }
}
