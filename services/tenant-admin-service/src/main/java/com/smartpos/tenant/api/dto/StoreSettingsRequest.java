package com.smartpos.tenant.api.dto;

import java.math.BigDecimal;

public record StoreSettingsRequest(
        String openingTime,
        String closingTime,
        String timezone,
        BigDecimal monthlyRent,
        BigDecimal defaultMarkupPct) {
}
