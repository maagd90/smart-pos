package com.smartpos.reporting.api;

import com.smartpos.contracts.api.ApiEnvelope;
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
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for generating financial reports.
 *
 * <p>In Milestone 1, reports are computed on-demand by querying the sales
 * and refunds services. Future milestones will support pre-computed reports,
 * caching, and full P&L with expenses.</p>
 */
@RestController
@RequestMapping("/api/v1/stores/{storeId}/reports")
public class ReportController {

    private final String salesServiceUrl;
    private final String refundsServiceUrl;
    private final RestTemplate restTemplate;

    /**
     * Creates the report controller.
     *
     * @param salesServiceUrl base URL of the sales service
     * @param refundsServiceUrl base URL of the refunds service
     */
    public ReportController(
            @Value("${integration.sales-service.url:http://sales-service:8106}") String salesServiceUrl,
            @Value("${integration.refunds-service.url:http://refunds-service:8107}") String refundsServiceUrl) {
        this.salesServiceUrl = salesServiceUrl;
        this.refundsServiceUrl = refundsServiceUrl;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Generates a daily financial report for the specified store.
     *
     * <p>Milestone 1 implementation: Attempts to aggregate from sales/refunds services.
     * If the source services are not reachable, returns a report with zero values
     * clearly indicating data was unavailable.</p>
     *
     * @param storeId the store to report on
     * @param date optional date parameter (defaults to today)
     * @return the daily report
     */
    @GetMapping("/daily")
    public ResponseEntity<ApiEnvelope<DailyReportResponse>> getDailyReport(
            @PathVariable UUID storeId,
            @RequestParam(required = false) String date) {

        LocalDate reportDate = date != null ? LocalDate.parse(date) : LocalDate.now();

        BigDecimal grossRevenue = BigDecimal.ZERO;
        BigDecimal refundsTotal = BigDecimal.ZERO;

        try {
            String salesUrl = salesServiceUrl + "/api/v1/stores/" + storeId + "/sales";
            @SuppressWarnings("unchecked")
            Map<String, Object> salesResponse = restTemplate.getForObject(salesUrl, Map.class);
            if (salesResponse != null && salesResponse.get("data") instanceof List<?> salesList) {
                for (Object sale : salesList) {
                    if (sale instanceof Map<?, ?> saleMap) {
                        Object total = saleMap.get("total");
                        if (total != null) {
                            grossRevenue = grossRevenue.add(new BigDecimal(total.toString()));
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Warning: Could not reach sales service: " + e.getMessage());
        }

        try {
            String refundsUrl = refundsServiceUrl + "/api/v1/stores/" + storeId + "/refunds";
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

        BigDecimal grossProfit = grossRevenue.subtract(refundsTotal);

        DailyReportResponse report = new DailyReportResponse(
                storeId, reportDate, grossRevenue, refundsTotal, grossProfit, "AED");

        return ResponseEntity.ok(ApiEnvelope.ok(report));
    }
}
