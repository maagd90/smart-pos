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
import com.smartpos.refunds.integration.TenantClient;
import com.smartpos.refunds.outbox.OutboxEvent;
import com.smartpos.refunds.outbox.OutboxRepository;
import java.net.URI;
import java.time.Instant;
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
    private final TenantClient tenantClient;

    public RefundsController(RefundRepository refundRepository,
                             OutboxRepository outboxRepository,
                             TenantClient tenantClient) {
        this.refundRepository = refundRepository;
        this.outboxRepository = outboxRepository;
        this.tenantClient = tenantClient;
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

        String currency = request.currency();
        if (currency == null || currency.isBlank()) {
            currency = tenantClient.getAccountCurrency(accountId);
        }
        if (currency == null || currency.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "currency could not be resolved from account config")));
        }

        Refund refund = new Refund(storeId, accountId, request.saleId(), currency);
        for (CreateRefundRequest.RefundItemRequest item : request.items()) {
            refund.addItem(item.productId(), item.productName(), item.quantity(), item.unitPrice(), item.resellable());
        }
        refund = refundRepository.save(refund);

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
            OutboxEvent event = new OutboxEvent("Refund", refund.getId(), "refund.created", payload);
            outboxRepository.save(event);
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

    private UUID requireAccountId() {
        return RequestContextHolder.get().accountId();
    }
}
