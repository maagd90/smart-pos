package com.smartpos.reporting.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.context.TenantContext;
import com.smartpos.contracts.security.RequirePermission;
import com.smartpos.contracts.security.RequireStoreAccess;
import com.smartpos.reporting.api.dto.DailyReportResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/v1/stores/{storeId}/reports")
@RequireStoreAccess
public class ReportController {

    private static final Logger log = LoggerFactory.getLogger(ReportController.class);

    private final String salesServiceUrl;
    private final String refundsServiceUrl;
    private final String tenantServiceUrl;
    private final RestTemplate restTemplate;

    public ReportController(
            RestTemplate restTemplate,
            @Value("${integration.sales-service.url:http://sales-service:8106}") String salesServiceUrl,
            @Value("${integration.refunds-service.url:http://refunds-service:8107}") String refundsServiceUrl,
            @Value("${integration.tenant-service.url:http://tenant-admin-service:8102}") String tenantServiceUrl) {
        this.salesServiceUrl = salesServiceUrl;
        this.refundsServiceUrl = refundsServiceUrl;
        this.tenantServiceUrl = tenantServiceUrl;
        this.restTemplate = restTemplate;
    }

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

        StoreConfig storeConfig = resolveStoreConfig(storeId, context.accountId());
        ZoneId storeTimezone = storeConfig.timezone();
        LocalDate reportDate = date != null ? LocalDate.parse(date) : LocalDate.now(storeTimezone);

        ZonedDateTime startOfDay = reportDate.atStartOfDay(storeTimezone);
        ZonedDateTime endOfDay = reportDate.plusDays(1).atStartOfDay(storeTimezone);
        Instant from = startOfDay.toInstant();
        Instant to = endOfDay.toInstant();

        BigDecimal revenue = BigDecimal.ZERO;
        BigDecimal cogs = BigDecimal.ZERO;
        BigDecimal refundsTotal = BigDecimal.ZERO;
        String currency = storeConfig.currency();

        try {
            String salesUrl = salesServiceUrl + "/api/v1/stores/" + storeId + "/sales?from="
                    + from + "&to=" + to;
            @SuppressWarnings("unchecked")
            Map<String, Object> salesResponse = restTemplate.getForObject(salesUrl, Map.class);
            if (salesResponse != null && salesResponse.get("data") instanceof List<?> salesList) {
                for (Object sale : salesList) {
                    if (sale instanceof Map<?, ?> saleMap) {
                        Object total = saleMap.get("total");
                        if (total != null) {
                            revenue = revenue.add(new BigDecimal(total.toString()));
                        }
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
        } catch (RestClientException e) {
            log.error("Could not reach sales service for daily report: {}", e.getMessage(), e);
            return ResponseEntity.status(502)
                    .body(ApiEnvelope.fail(ApiError.of("SALES_SERVICE_UNAVAILABLE",
                            "Unable to fetch sales data for report")));
        }

        try {
            String refundsUrl = refundsServiceUrl + "/api/v1/stores/" + storeId + "/refunds?from="
                    + from + "&to=" + to;
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
        } catch (RestClientException e) {
            log.error("Could not reach refunds service for daily report: {}", e.getMessage(), e);
            return ResponseEntity.status(502)
                    .body(ApiEnvelope.fail(ApiError.of("REFUNDS_SERVICE_UNAVAILABLE",
                            "Unable to fetch refunds data for report")));
        }

        BigDecimal grossProfit = revenue.subtract(cogs).subtract(refundsTotal);
        DailyReportResponse report = new DailyReportResponse(
                storeId, reportDate, revenue, cogs, refundsTotal, grossProfit, currency);
        return ResponseEntity.ok(ApiEnvelope.ok(report));
    }

    private StoreConfig resolveStoreConfig(UUID storeId, UUID accountId) {
        ZoneId timezone = ZoneId.of("Asia/Dubai");
        String currency = "AED";
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> accountResponse = restTemplate.getForObject(
                    tenantServiceUrl + "/api/v1/accounts/" + accountId, Map.class);
            if (accountResponse != null && accountResponse.get("data") instanceof Map<?, ?> accountMap) {
                Object accountCurrency = accountMap.get("currency");
                if (accountCurrency != null && !accountCurrency.toString().isBlank()) {
                    currency = accountCurrency.toString();
                }
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> storesResponse = restTemplate.getForObject(
                    tenantServiceUrl + "/api/v1/accounts/" + accountId + "/stores", Map.class);
            if (storesResponse != null && storesResponse.get("data") instanceof List<?> stores) {
                for (Object store : stores) {
                    if (store instanceof Map<?, ?> storeMap && storeId.toString().equals(String.valueOf(storeMap.get("id")))) {
                        Object tz = storeMap.get("timezone");
                        if (tz != null && !tz.toString().isBlank()) {
                            timezone = ZoneId.of(tz.toString());
                        }
                        break;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not fully resolve store config for store {} account {}: {}", storeId, accountId, e.getMessage());
        }
        return new StoreConfig(timezone, currency);
    }

    private record StoreConfig(ZoneId timezone, String currency) {}
}
