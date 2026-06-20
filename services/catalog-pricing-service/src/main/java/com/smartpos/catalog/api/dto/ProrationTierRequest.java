package com.smartpos.catalog.api.dto;

import java.math.BigDecimal;

public record ProrationTierRequest(int withinDays, BigDecimal refundPct) {
}
