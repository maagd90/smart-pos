package com.smartpos.catalog.domain;

import java.math.BigDecimal;
import java.util.List;

/**
 * Fully resolved refund policy for a product at a point in time.
 */
public record ResolvedRefundPolicy(
        BigDecimal costPrice,
        boolean refundable,
        int refundWindowDays,
        boolean exchangeable,
        int exchangeWindowDays,
        BigDecimal restockingFeePct,
        BigDecimal restockingFeeFlat,
        List<ProrationTier> refundProrationTiers) {
}
