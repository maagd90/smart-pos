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

/**
 * REST controller for managing refund transactions.
 *
 * <p>Creates refunds against original sales and writes outbox events
 * for inventory return movements (resellable items only).</p>
 */
@RestController
@RequestMapping("/api/v1/stores/{storeId}/refunds")
@RequireStoreAccess
public class RefundsController {

    private final RefundRepository refundRepository;
    private final OutboxRepository outboxRepository;

    public RefundsController(RefundRepository refundRepository, OutboxRepository outboxRepository) {
        this.refundRepository = refundRepository;
        this.outboxRepository = outboxRepository;
    }

    /**
     * Creates a refund. Writes an outbox event for resellable item return movements.
     */
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
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "currency is required")));
        }

        Refund refund = new Refund(storeId, accountId, request.saleId(), currency);
        for (CreateRefundRequest.RefundItemRequest item : request.items()) {
            refund.addItem(item.productId(), item.productName(), item.quantity(), item.unitPrice(), item.resellable());
        }
        refund = refundRepository.save(refund);

        // Write outbox event for inventory return movements (resellable items only)
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

    /**
     * Gets a refund by ID.
     */
    @GetMapping("/{refundId}")
    public ResponseEntity<ApiEnvelope<RefundResponse>> getRefund(
            @PathVariable UUID storeId, @PathVariable UUID refundId) {
        return refundRepository.findByIdAndStoreId(refundId, storeId)
                .map(refund -> ResponseEntity.ok(ApiEnvelope.ok(RefundResponse.from(refund))))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Lists refunds for a store, optionally filtered by date range.
     */
    @GetMapping
    public ResponseEntity<ApiEnvelope<List<RefundResponse>>> listRefunds(
            @PathVariable UUID storeId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        List<Refund> refunds;
        if (from != null && to != null) {
            Instant fromInstant = Instant.parse(from);
            Instant toInstant = Instant.parse(to);
            refunds = refundRepository.findByStoreIdAndCreatedAtBetween(storeId, fromInstant, toInstant);
        } else {
            refunds = refundRepository.findByStoreId(storeId);
        }
        List<RefundResponse> responses = refunds.stream().map(RefundResponse::from).toList();
        return ResponseEntity.ok(ApiEnvelope.ok(responses));
    }
}
