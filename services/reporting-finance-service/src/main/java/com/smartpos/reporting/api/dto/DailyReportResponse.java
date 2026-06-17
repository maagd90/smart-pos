package com.smartpos.reporting.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Response DTO for a daily financial report.
 *
 * <p>In Milestone 1, this is a simplified aggregation. Full P&L reporting
 * with cost-of-goods-sold and expense tracking is planned for later milestones.</p>
 *
 * @param storeId the store ID
 * @param date the report date
 * @param grossRevenue total sales revenue for the day
 * @param refunds total refunds for the day
 * @param grossProfit grossRevenue minus refunds (simplified for Milestone 1)
 * @param currency the currency
 */
public record DailyReportResponse(
        UUID storeId,
        LocalDate date,
        BigDecimal grossRevenue,
        BigDecimal refunds,
        BigDecimal grossProfit,
        String currency
) {}
