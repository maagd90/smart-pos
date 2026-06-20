package com.smartpos.refunds.service;

import com.smartpos.refunds.api.dto.CreateExchangeRequest;
import com.smartpos.refunds.domain.Exchange;
import com.smartpos.refunds.domain.ExchangeRepository;
import com.smartpos.refunds.domain.Refund;
import com.smartpos.refunds.domain.RefundRepository;
import com.smartpos.refunds.domain.RefundedQuantity;
import com.smartpos.refunds.domain.RefundedQuantityRepository;
import com.smartpos.refunds.integration.CatalogClient;
import com.smartpos.refunds.integration.SalesClient;
import com.smartpos.refunds.integration.TenantClient;
import com.smartpos.refunds.outbox.OutboxEvent;
import com.smartpos.refunds.outbox.OutboxRepository;
import java.math.BigDecimal;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;

public class ExchangeSagaService {

    private static final Logger log = LoggerFactory.getLogger(ExchangeSagaService.class);
    private static final int VOID_RETRY_ATTEMPTS = 3;

    private final ExchangeRepository exchangeRepository;
    private final RefundRepository refundRepository;
    private final RefundedQuantityRepository refundedQuantityRepository;
    private final OutboxRepository outboxRepository;
    private final SalesClient salesClient;
    private final CatalogClient catalogClient;
    private final TenantClient tenantClient;
    private final RefundEligibilityService eligibilityService;
    private final RefundPricingService pricingService;

    public ExchangeSagaService(ExchangeRepository exchangeRepository,
                               RefundRepository refundRepository,
                               RefundedQuantityRepository refundedQuantityRepository,
                               OutboxRepository outboxRepository,
                               SalesClient salesClient,
                               CatalogClient catalogClient,
                               TenantClient tenantClient,
                               RefundEligibilityService eligibilityService,
                               RefundPricingService pricingService) {
        this.exchangeRepository = exchangeRepository;
        this.refundRepository = refundRepository;
        this.refundedQuantityRepository = refundedQuantityRepository;
        this.outboxRepository = outboxRepository;
        this.salesClient = salesClient;
        this.catalogClient = catalogClient;
        this.tenantClient = tenantClient;
        this.eligibilityService = eligibilityService;
        this.pricingService = pricingService;
    }

    @Transactional
    public ExchangeResult executeExchange(UUID storeId, UUID accountId, CreateExchangeRequest request) {
        SalesClient.SaleDetails sale = salesClient.getSale(storeId, request.originalSaleId());
        if (sale == null) {
            return ExchangeResult.notFound();
        }

        ZoneId storeTimezone = resolveStoreTimezone(accountId, storeId);

        for (CreateExchangeRequest.ExchangeItemRequest item : request.returnedItems()) {
            SalesClient.SaleLineDetails saleLine = eligibilityService.findSaleLine(sale, item.productId());
            if (saleLine == null) {
                return ExchangeResult.badRequest("PRODUCT_NOT_ON_SALE", "Product not on sale: " + item.productId());
            }
            var failure = eligibilityService.checkExchangeEligibility(sale, saleLine, item.quantity(), storeTimezone);
            if (failure.isPresent()) {
                return ExchangeResult.badRequest(failure.get().code(), failure.get().message());
            }
        }

        String currency = sale.currency();
        List<SalesClient.SaleLineRequest> replacementLines = new ArrayList<>();
        BigDecimal replacementTotal = BigDecimal.ZERO;
        for (CreateExchangeRequest.ExchangeItemRequest item : request.replacementItems()) {
            BigDecimal sellingPrice = catalogClient.getSellingPrice(storeId, item.productId());
            String productName = catalogClient.getProductName(storeId, item.productId());
            if (sellingPrice == null || productName == null) {
                return ExchangeResult.badRequest("PRODUCT_NOT_FOUND", "Replacement product not found: " + item.productId());
            }
            replacementLines.add(new SalesClient.SaleLineRequest(item.productId(), productName, item.quantity(), sellingPrice));
            replacementTotal = replacementTotal.add(sellingPrice.multiply(BigDecimal.valueOf(item.quantity())));
        }

        BigDecimal returnCredit = BigDecimal.ZERO;
        for (CreateExchangeRequest.ExchangeItemRequest item : request.returnedItems()) {
            SalesClient.SaleLineDetails saleLine = eligibilityService.findSaleLine(sale, item.productId());
            returnCredit = returnCredit.add(pricingService.computeExchangeCredit(saleLine, item.quantity()));
        }

        Exchange exchange = exchangeRepository.save(new Exchange(storeId, accountId, request.originalSaleId()));

        UUID replacementSaleId;
        try {
            replacementSaleId = salesClient.createSale(storeId, replacementLines, currency);
            exchange.setReplacementSaleId(replacementSaleId);
            exchangeRepository.save(exchange);
        } catch (SalesClient.SalesClientException e) {
            exchange.markFailed(e.getMessage());
            exchangeRepository.save(exchange);
            return ExchangeResult.failed(exchange, e.getMessage());
        }

        try {
            Refund returnRefund = new Refund(storeId, accountId, request.originalSaleId(), currency);
            for (CreateExchangeRequest.ExchangeItemRequest item : request.returnedItems()) {
                SalesClient.SaleLineDetails saleLine = eligibilityService.findSaleLine(sale, item.productId());
                BigDecimal credit = pricingService.computeExchangeCredit(saleLine, item.quantity());
                boolean resellable = item.resellable() == null || item.resellable();
                returnRefund.addItem(saleLine.productId(), saleLine.productName(), item.quantity(),
                        saleLine.unitPrice(), resellable,
                        credit, BigDecimal.valueOf(100), credit, BigDecimal.ZERO, credit);
            }
            returnRefund = refundRepository.save(returnRefund);

            for (CreateExchangeRequest.ExchangeItemRequest item : request.returnedItems()) {
                RefundedQuantity rq = refundedQuantityRepository
                        .findByStoreIdAndSaleIdAndProductId(storeId, request.originalSaleId(), item.productId())
                        .orElseGet(() -> new RefundedQuantity(storeId, request.originalSaleId(), item.productId(), 0));
                rq.addQuantity(item.quantity());
                refundedQuantityRepository.save(rq);
            }

            List<Map<String, Object>> resellableItems = request.returnedItems().stream()
                    .filter(i -> i.resellable() == null || i.resellable())
                    .map(i -> Map.<String, Object>of(
                            "productId", i.productId().toString(),
                            "quantity", i.quantity()))
                    .toList();

            if (!resellableItems.isEmpty()) {
                Map<String, Object> payload = Map.of(
                        "refundId", returnRefund.getId().toString(),
                        "storeId", storeId.toString(),
                        "accountId", accountId.toString(),
                        "exchangeId", exchange.getId().toString(),
                        "items", resellableItems);
                outboxRepository.save(new OutboxEvent("Refund", returnRefund.getId(), "refund.created", payload));
            }

            exchange.markCompleted(replacementSaleId);
            exchangeRepository.save(exchange);
            return ExchangeResult.success(exchange, returnCredit, replacementTotal);
        } catch (Exception e) {
            log.error("Exchange post-replacement step failed for exchange {}: {}", exchange.getId(), e.getMessage(), e);
            compensateVoid(storeId, replacementSaleId);
            exchange.markCompensated("Post-replacement step failed: " + e.getMessage());
            exchangeRepository.save(exchange);
            return ExchangeResult.compensated(exchange, e.getMessage());
        }
    }

    private void compensateVoid(UUID storeId, UUID replacementSaleId) {
        for (int attempt = 1; attempt <= VOID_RETRY_ATTEMPTS; attempt++) {
            try {
                salesClient.voidSale(storeId, replacementSaleId);
                return;
            } catch (Exception e) {
                log.warn("Void compensation attempt {} failed for sale {}: {}", attempt, replacementSaleId, e.getMessage());
            }
        }
        log.error("Failed to void replacement sale {} after {} attempts", replacementSaleId, VOID_RETRY_ATTEMPTS);
    }

    private ZoneId resolveStoreTimezone(UUID accountId, UUID storeId) {
        String tz = tenantClient.getStoreTimezone(accountId, storeId);
        return tz != null ? ZoneId.of(tz) : ZoneId.of("Asia/Dubai");
    }

    public record ExchangeResult(int httpStatus, Exchange exchange, String errorCode, String errorMessage,
                                 BigDecimal returnCredit, BigDecimal replacementTotal) {

        static ExchangeResult notFound() {
            return new ExchangeResult(404, null, null, null, null, null);
        }

        static ExchangeResult badRequest(String code, String message) {
            return new ExchangeResult(400, null, code, message, null, null);
        }

        static ExchangeResult failed(Exchange exchange, String message) {
            return new ExchangeResult(422, exchange, "REPLACEMENT_FAILED", message, null, null);
        }

        static ExchangeResult success(Exchange exchange, BigDecimal returnCredit, BigDecimal replacementTotal) {
            return new ExchangeResult(201, exchange, null, null, returnCredit, replacementTotal);
        }

        static ExchangeResult compensated(Exchange exchange, String message) {
            return new ExchangeResult(500, exchange, "COMPENSATED", message, null, null);
        }
    }
}
