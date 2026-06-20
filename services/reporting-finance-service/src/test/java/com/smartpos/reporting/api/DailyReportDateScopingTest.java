package com.smartpos.reporting.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import org.junit.jupiter.api.Test;

class DailyReportDateScopingTest {

    @Test
    void yesterdaySaleIsOutsideTodayWindowInStoreTimezone() {
        ZoneId timezone = ZoneId.of("Asia/Dubai");
        LocalDate today = LocalDate.of(2026, 6, 20);
        ZonedDateTime startOfToday = today.atStartOfDay(timezone);
        ZonedDateTime startOfTomorrow = today.plusDays(1).atStartOfDay(timezone);

        Instant yesterdaySale = today.minusDays(1).atTime(23, 30).atZone(timezone).toInstant();
        Instant todaySale = today.atTime(10, 0).atZone(timezone).toInstant();

        assertTrue(yesterdaySale.isBefore(startOfToday.toInstant()));
        assertTrue(todaySale.isBefore(startOfTomorrow.toInstant()) && !todaySale.isBefore(startOfToday.toInstant()));
        assertEquals(today, todaySale.atZone(timezone).toLocalDate());
    }
}
