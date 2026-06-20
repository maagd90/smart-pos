package com.smartpos.refunds.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.context.TenantContext;
import com.smartpos.contracts.security.RequirePermission;
import com.smartpos.contracts.security.RequireStoreAccess;
import com.smartpos.refunds.api.dto.CreateRefundRequest;
import com.smartpos.refunds.api.dto.RefundResponse;
import com.smartpos.refunds.domain.Refund;
import com.smartpos.refunds.domain.RefundRepository;
import com.smartpos.refunds.domain.RefundedQuantity;
import com.smartpos.refunds.domain.RefundedQuantityRepository;
import com.smartpos.refunds.integration.SalesClient;
import com.smartpos.refunds.integration.TenantClient;
import com.smartpos.refunds.outbox.OutboxEvent;
import com.smartpos.refunds.outbox.OutboxRepository;
import com.smartpos.refunds.service.RefundEligibilityService;
import com.smartpos.refunds.service.RefundPricingResult;
import com.smartpos.refunds.service.RefundPricingService;
import java.net.URI;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/stores/{storeId}/refunds")
@RequireStoreAccess
public class RefundsController {

    private final RefundRepository refundRepository;
    private final OutboxRepository outboxRepository;
    private final RefundedQuantityRepository refundedQuantityRepository;
    private final TenantClient tenantClient;
    private final SalesClient salesClient;
    private final RefundEligibilityService eligibilityService;
    private final RefundPricingService pricingService;

    public RefundsController(RefundRepository refundRepository,
                             OutboxRepository outboxRepository,
                             RefundedQuantityRepository refundedQuantityRepository,
                             TenantClient tenantClient,
                             SalesClient salesClient,
                             RefundEligibilityService eligibilityService,
                             RefundPricingService pricingService) {
        this.refundRepository = refundRepository;
        this.outboxRepository = outboxRepository;
        this.refundedQuantityRepository = refundedQuantityRepository;
        this.tenantClient = tenantClient;
        this.salesClient = salesClient;
        this.eligibilityService = eligibilityService;
        this.pricingService = pricingService;
    }

    @PostMapping
    @Transactional
    @RequirePermission("refund.create")
    public ResponseEntity<ApiEnvelope<RefundResponse>> createRefund(
            @PathVariable UUID storeId, @RequestBody CreateRefundRequest request) {
        if (request == null || request.saleId() == null || request.items() == null || request.items().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "saleId and items are required")));
        }

        TenantContext context = RequestContextHolder.get();
        if (context.accountId() == null) {
            return ResponseEntity.status(401)
                    .body(ApiEnvelope.fail(ApiError.of("UNAUTHORIZED", "accountId is required in tenant context")));
        }
        UUID accountId = context.accountId();

        SalesClient.SaleDetails sale = salesClient.getSale(storeId, request.saleId());
        if (sale == null) {
            return ResponseEntity.notFound().build();
        }

        String currency = request.currency();
        if (currency == null || currency.isBlank()) {
            currency = tenantClient.getAccountCurrency(accountId);
        }
        if (currency == null || currency.isBlank()) {
            currency = sale.currency();
        }

        ZoneId storeTimezone = resolveStoreTimezone(accountId, storeId);

        for (CreateRefundRequest.RefundItemRequest item : request.items()) {
            SalesClient.SaleLineDetails saleLine = eligibilityService.findSaleLine(sale, item.productId());
            if (saleLine == null) {
                return ResponseEntity.badRequest()
                        .body(ApiEnvelope.fail(ApiError.of("PRODUCT_NOT_ON_SALE",
                                "Product not found on sale: " + item.productId())));
            }
            var failure = eligibilityService.checkRefundEligibility(sale, saleLine, item.quantity(), storeTimezone);
            if (failure.isPresent()) {
                return ResponseEntity.badRequest()
                        .body(ApiEnvelope.fail(ApiError.of(failure.get().code(), failure.get().message())));
            }
        }

        Refund refund = new Refund(storeId, accountId, request.saleId(), currency);
        for (CreateRefundRequest.RefundItemRequest item : request.items()) {
            SalesClient.SaleLineDetails saleLine = eligibilityService.findSaleLine(sale, item.productId());
            RefundPricingResult pricing = pricingService.computeRefundPricing(
                    saleLine, item.quantity(), sale.createdAt(), storeTimezone);
            refund.addItem(saleLine.productId(), saleLine.productName(), item.quantity(),
                    saleLine.unitPrice(), item.resellable(),
                    pricing.baseAmount(), pricing.prorationPct(), pricing.proratedAmount(),
                    pricing.restockingFee(), pricing.refundAmount());
        }
        refund = refundRepository.save(refund);

        for (CreateRefundRequest.RefundItemRequest item : request.items()) {
            RefundedQuantity rq = refundedQuantityRepository
                    .findByStoreIdAndSaleIdAndProductId(storeId, request.saleId(), item.productId())
                    .orElseGet(() -> new RefundedQuantity(storeId, request.saleId(), item.productId(), 0));
            rq.addQuantity(item.quantity());
            refundedQuantityRepository.save(rq);
        }

        List<Map<String, Object>> resellableItems = request.items().stream()
                .filter(CreateRefundRequest.RefundItemRequest::resellable)
                .map(i -> Map.<String, Object>of(
                        "productId", i.productId().toString(),
                        "quantity", i.quantity()))
                .collect(Collectors.toList());

        if (!resellableItems.isEmpty()) {
            Map<String, Object> payload = Map.of(
                    "refundId", refund.getId().toString(),
                    "storeId", storeId.toString(),
                    "accountId", accountId.toString(),
                    "items", resellableItems);
            outboxRepository.save(new OutboxEvent("Refund", refund.getId(), "refund.created", payload));
        }

        return ResponseEntity
                .created(URI.create("/api/v1/stores/" + storeId + "/refunds/" + refund.getId()))
                .body(ApiEnvelope.ok(RefundResponse.from(refund)));
    }

    @GetMapping("/{refundId}")
    @RequirePermission("refund.view")
    public ResponseEntity<ApiEnvelope<RefundResponse>> getRefund(
            @PathVariable UUID storeId, @PathVariable UUID refundId) {
        UUID accountId = requireAccountId();
        if (accountId == null) {
            return ResponseEntity.status(401)
                    .body(ApiEnvelope.fail(ApiError.of("UNAUTHORIZED", "accountId is required in tenant context")));
        }
        return refundRepository.findByIdAndStoreIdAndAccountId(refundId, storeId, accountId)
                .map(refund -> ResponseEntity.ok(ApiEnvelope.ok(RefundResponse.from(refund))))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    @RequirePermission("refund.view")
    public ResponseEntity<ApiEnvelope<List<RefundResponse>>> listRefunds(
            @PathVariable UUID storeId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        UUID accountId = requireAccountId();
        if (accountId == null) {
            return ResponseEntity.status(401)
                    .body(ApiEnvelope.fail(ApiError.of("UNAUTHORIZED", "accountId is required in tenant context")));
        }
        List<Refund> refunds;
        if (from != null && to != null) {
            Instant fromInstant = Instant.parse(from);
            Instant toInstant = Instant.parse(to);
            refunds = refundRepository.findByStoreIdAndAccountIdAndCreatedAtBetween(storeId, accountId, fromInstant, toInstant);
        } else {
            refunds = refundRepository.findByStoreIdAndAccountId(storeId, accountId);
        }
        List<RefundResponse> responses = refunds.stream().map(RefundResponse::from).toList();
        return ResponseEntity.ok(ApiEnvelope.ok(responses));
    }

    private ZoneId resolveStoreTimezone(UUID accountId, UUID storeId) {
        String tz = tenantClient.getStoreTimezone(accountId, storeId);
        return tz != null ? ZoneId.of(tz) : ZoneId.of("Asia/Dubai");
    }

    private UUID requireAccountId() {
        return RequestContextHolder.get().accountId();
    }
}
