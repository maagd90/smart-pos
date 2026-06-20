package com.smartpos.reporting.api;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class DailyReportMathTest {

    @Test
    void grossProfitEqualsRevenueMinusCogsMinusRefunds() {
        BigDecimal revenue = new BigDecimal("1575");
        BigDecimal cogs = new BigDecimal("1500");
        BigDecimal refunds = new BigDecimal("1575");
        BigDecimal grossProfit = revenue.subtract(cogs).subtract(refunds);
        assertEquals(new BigDecimal("-1500"), grossProfit);
    }

    @Test
    void singleSaleGrossProfitMatchesAcceptanceExample() {
        BigDecimal revenue = new BigDecimal("1575");
        BigDecimal cogs = new BigDecimal("1500");
        BigDecimal refunds = BigDecimal.ZERO;
        BigDecimal grossProfit = revenue.subtract(cogs).subtract(refunds);
        assertEquals(new BigDecimal("75"), grossProfit);
    }
}
