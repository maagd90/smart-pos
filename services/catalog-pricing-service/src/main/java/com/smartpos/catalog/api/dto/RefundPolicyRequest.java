package com.smartpos.catalog.api.dto;

import java.math.BigDecimal;
import java.util.List;

public record RefundPolicyRequest(
        Boolean defaultRefundable,
        Integer defaultRefundWindowDays,
        Boolean defaultExchangeable,
        Integer defaultExchangeWindowDays,
        BigDecimal restockingFeePct,
        BigDecimal restockingFeeFlat,
        List<ProrationTierRequest> refundProrationTiers) {
}
