package com.smartpos.catalog.domain;

import java.math.BigDecimal;

/**
 * A proration tier: refund percentage when returned within a number of days.
 */
public record ProrationTier(int withinDays, BigDecimal refundPct) {
}
