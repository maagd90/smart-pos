package com.smartpos.tenant.api.dto;

import com.smartpos.tenant.domain.StoreSettings;
import java.math.BigDecimal;
import java.util.UUID;

public record StoreSettingsResponse(
        UUID storeId,
        String openingTime,
        String closingTime,
        String timezone,
        BigDecimal monthlyRent,
        BigDecimal defaultMarkupPct) {

    public static StoreSettingsResponse from(StoreSettings settings) {
        return new StoreSettingsResponse(
                settings.getStoreId(),
                settings.getOpeningTime(),
                settings.getClosingTime(),
                settings.getTimezone(),
                settings.getMonthlyRent(),
                settings.getDefaultMarkupPct());
    }
}
