package com.smartpos.catalog.api.dto;

import java.math.BigDecimal;
import java.util.List;

public record UpdateProductRequest(
        String name,
        String sku,
        String category,
        BigDecimal costPrice,
        String pricingMode,
        BigDecimal markupPercent,
        BigDecimal sellingPrice,
        String currency,
        Boolean refundable,
        Integer refundWindowDays,
        Boolean exchangeable,
        Integer exchangeWindowDays,
        BigDecimal restockingFeePct,
        BigDecimal restockingFeeFlat,
        List<ProrationTierRequest> refundProrationTiers) {
}
