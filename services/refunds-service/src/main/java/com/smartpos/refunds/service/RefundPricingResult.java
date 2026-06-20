package com.smartpos.refunds.service;

import java.math.BigDecimal;

public record RefundPricingResult(
        BigDecimal baseAmount,
        BigDecimal prorationPct,
        BigDecimal proratedAmount,
        BigDecimal restockingFee,
        BigDecimal refundAmount) {
}
