package com.smartpos.refunds.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.context.TenantContext;
import com.smartpos.refunds.api.dto.CreateRefundRequest;
import com.smartpos.refunds.api.dto.RefundResponse;
import com.smartpos.refunds.domain.Refund;
import com.smartpos.refunds.domain.RefundRepository;
import com.smartpos.refunds.integration.InventoryClient;
import java.net.URI;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for managing refund transactions.
 *
 * <p>Creates refunds against original sales and triggers inventory
 * return movements for resellable items.</p>
 */
@RestController
@RequestMapping("/api/v1/stores/{storeId}/refunds")
public class RefundsController {

    private static final UUID DEFAULT_ACCOUNT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private final RefundRepository refundRepository;
    private final InventoryClient inventoryClient;

    public RefundsController(RefundRepository refundRepository, InventoryClient inventoryClient) {
        this.refundRepository = refundRepository;
        this.inventoryClient = inventoryClient;
    }

    /**
     * Creates a refund and returns resellable items to inventory.
     */
    @PostMapping
    public ResponseEntity<ApiEnvelope<RefundResponse>> createRefund(
            @PathVariable UUID storeId, @RequestBody CreateRefundRequest request) {
        if (request == null || request.saleId() == null || request.items() == null || request.items().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "saleId and items are required")));
        }

        UUID accountId = resolveAccountId();
        String currency = request.currency() != null ? request.currency() : "AED";

        Refund refund = new Refund(storeId, accountId, request.saleId(), currency);
        for (CreateRefundRequest.RefundItemRequest item : request.items()) {
            refund.addItem(item.productId(), item.productName(), item.quantity(), item.unitPrice(), item.resellable());
        }
        refund = refundRepository.save(refund);

        for (CreateRefundRequest.RefundItemRequest item : request.items()) {
            if (item.resellable()) {
                inventoryClient.recordReturnMovement(storeId, item.productId(), item.quantity(), refund.getId());
            }
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

    private UUID resolveAccountId() {
        TenantContext context = RequestContextHolder.get();
        return context.accountId() != null ? context.accountId() : DEFAULT_ACCOUNT_ID;
    }
}
