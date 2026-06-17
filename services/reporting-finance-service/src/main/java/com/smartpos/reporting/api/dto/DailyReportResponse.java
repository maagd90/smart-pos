package com.smartpos.reporting.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Response DTO for a daily financial report with full COGS-based gross profit.
 *
 * @param storeId the store ID
 * @param date the report date
 * @param revenue total sales revenue for the day
 * @param cogs cost of goods sold (sum of cost_price × quantity for all sales)
 * @param refunds total refunds for the day
 * @param grossProfit revenue - cogs - refunds
 * @param currency the currency
 */
public record DailyReportResponse(
        UUID storeId,
        LocalDate date,
        BigDecimal revenue,
        BigDecimal cogs,
        BigDecimal refunds,
        BigDecimal grossProfit,
        String currency
) {}
