package com.smartpos.reporting.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.context.TenantContext;
import com.smartpos.contracts.security.RequirePermission;
import com.smartpos.contracts.security.RequireStoreAccess;
import com.smartpos.reporting.api.dto.DailyReportResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for generating financial reports.
 *
 * <p>Reports are date-scoped to the store's timezone and include COGS-based
 * gross profit calculation.</p>
 */
@RestController
@RequestMapping("/api/v1/stores/{storeId}/reports")
@RequireStoreAccess
public class ReportController {

    private final String salesServiceUrl;
    private final String refundsServiceUrl;
    private final String tenantServiceUrl;
    private final RestTemplate restTemplate;

    public ReportController(
            @Value("${integration.sales-service.url:http://sales-service:8106}") String salesServiceUrl,
            @Value("${integration.refunds-service.url:http://refunds-service:8107}") String refundsServiceUrl,
            @Value("${integration.tenant-service.url:http://tenant-admin-service:8102}") String tenantServiceUrl) {
        this.salesServiceUrl = salesServiceUrl;
        this.refundsServiceUrl = refundsServiceUrl;
        this.tenantServiceUrl = tenantServiceUrl;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Generates a daily financial report for the specified store.
     *
     * <p>Scopes sales and refunds to the report date in the store's timezone,
     * using the half-open range [date 00:00, date+1 00:00).</p>
     */
    @GetMapping("/daily")
    @RequirePermission("reports.view")
    public ResponseEntity<ApiEnvelope<DailyReportResponse>> getDailyReport(
            @PathVariable UUID storeId,
            @RequestParam(required = false) String date) {

        TenantContext context = RequestContextHolder.get();
        if (context.accountId() == null) {
            return ResponseEntity.status(401)
                    .body(ApiEnvelope.fail(ApiError.of("UNAUTHORIZED", "accountId is required")));
        }

        // Resolve store timezone
        ZoneId storeTimezone = resolveStoreTimezone(storeId, context.accountId());
        LocalDate reportDate = date != null ? LocalDate.parse(date) : LocalDate.now(storeTimezone);

        // Compute date boundaries in UTC for querying
        ZonedDateTime startOfDay = reportDate.atStartOfDay(storeTimezone);
        ZonedDateTime endOfDay = reportDate.plusDays(1).atStartOfDay(storeTimezone);
        Instant from = startOfDay.toInstant();
        Instant to = endOfDay.toInstant();

        BigDecimal revenue = BigDecimal.ZERO;
        BigDecimal cogs = BigDecimal.ZERO;
        BigDecimal refundsTotal = BigDecimal.ZERO;
        String currency = "AED"; // Will be overridden from actual data if available

        // Fetch sales within date range
        try {
            String salesUrl = salesServiceUrl + "/api/v1/stores/" + storeId + "/sales?from="
                    + from.toString() + "&to=" + to.toString();
            @SuppressWarnings("unchecked")
            Map<String, Object> salesResponse = restTemplate.getForObject(salesUrl, Map.class);
            if (salesResponse != null && salesResponse.get("data") instanceof List<?> salesList) {
                for (Object sale : salesList) {
                    if (sale instanceof Map<?, ?> saleMap) {
                        Object total = saleMap.get("total");
                        if (total != null) {
                            revenue = revenue.add(new BigDecimal(total.toString()));
                        }
                        Object saleCurrency = saleMap.get("currency");
                        if (saleCurrency != null) {
                            currency = saleCurrency.toString();
                        }
                        // Sum COGS from line items
                        if (saleMap.get("items") instanceof List<?> items) {
                            for (Object itemObj : items) {
                                if (itemObj instanceof Map<?, ?> itemMap) {
                                    Object lineCost = itemMap.get("lineCost");
                                    if (lineCost != null) {
                                        cogs = cogs.add(new BigDecimal(lineCost.toString()));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Warning: Could not reach sales service: " + e.getMessage());
        }

        // Fetch refunds within date range
        try {
            String refundsUrl = refundsServiceUrl + "/api/v1/stores/" + storeId + "/refunds?from="
                    + from.toString() + "&to=" + to.toString();
            @SuppressWarnings("unchecked")
            Map<String, Object> refundsResponse = restTemplate.getForObject(refundsUrl, Map.class);
            if (refundsResponse != null && refundsResponse.get("data") instanceof List<?> refundsList) {
                for (Object refund : refundsList) {
                    if (refund instanceof Map<?, ?> refundMap) {
                        Object total = refundMap.get("total");
                        if (total != null) {
                            refundsTotal = refundsTotal.add(new BigDecimal(total.toString()));
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Warning: Could not reach refunds service: " + e.getMessage());
        }

        // grossProfit = revenue − COGS − refunds
        BigDecimal grossProfit = revenue.subtract(cogs).subtract(refundsTotal);

        DailyReportResponse report = new DailyReportResponse(
                storeId, reportDate, revenue, cogs, refundsTotal, grossProfit, currency);

        return ResponseEntity.ok(ApiEnvelope.ok(report));
    }

    /**
     * Resolves the store timezone from the tenant service.
     * Falls back to Asia/Dubai if unavailable.
     */
    private ZoneId resolveStoreTimezone(UUID storeId, UUID accountId) {
        try {
            String url = tenantServiceUrl + "/api/v1/accounts/" + accountId + "/stores";
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.get("data") instanceof List<?> stores) {
                for (Object store : stores) {
                    if (store instanceof Map<?, ?> storeMap) {
                        if (storeId.toString().equals(storeMap.get("id"))) {
                            Object tz = storeMap.get("timezone");
                            if (tz != null) {
                                return ZoneId.of(tz.toString());
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Warning: Could not resolve store timezone: " + e.getMessage());
        }
        return ZoneId.of("Asia/Dubai");
    }
}
