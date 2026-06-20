package com.smartpos.inventory.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.context.TenantContext;
import com.smartpos.contracts.security.RequirePermission;
import com.smartpos.contracts.security.RequireStoreAccess;
import com.smartpos.inventory.api.dto.CreateMovementRequest;
import com.smartpos.inventory.api.dto.MovementResponse;
import com.smartpos.inventory.api.dto.ReceiveStockRequest;
import com.smartpos.inventory.api.dto.StockResponse;
import com.smartpos.inventory.domain.InventoryMovement;
import com.smartpos.inventory.domain.InventoryMovementRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for managing inventory movements and stock queries.
 *
 * <p>Implements an append-only stock ledger pattern where current stock
 * is computed from the sum of all signed movements.</p>
 */
@RestController
@RequestMapping("/api/v1/stores/{storeId}/inventory")
@RequireStoreAccess
public class InventoryController {

    private final InventoryMovementRepository movementRepository;
    private final boolean allowNegativeStock;

    public InventoryController(InventoryMovementRepository movementRepository,
                               @Value("${inventory.allow-negative-stock:false}") boolean allowNegativeStock) {
        this.movementRepository = movementRepository;
        this.allowNegativeStock = allowNegativeStock;
    }

    /**
     * Receives stock into inventory (creates a positive movement).
     */
    @PostMapping("/receive")
    @RequirePermission("inventory.receive")
    public ResponseEntity<ApiEnvelope<MovementResponse>> receiveStock(
            @PathVariable UUID storeId, @RequestBody ReceiveStockRequest request) {
        if (request.quantity() <= 0) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_QUANTITY", "Quantity must be positive")));
        }

        UUID accountId = requireAccountId();
        if (accountId == null) {
            return ResponseEntity.status(401)
                    .body(ApiEnvelope.fail(ApiError.of("UNAUTHORIZED", "accountId is required in tenant context")));
        }

        InventoryMovement movement = new InventoryMovement(
                storeId, accountId, request.productId(),
                "receive", request.quantity(), null, null);
        movement = movementRepository.save(movement);
        return ResponseEntity.ok(ApiEnvelope.ok(MovementResponse.from(movement)));
    }

    /**
     * Creates an inventory movement (used by other services like sales and refunds).
     * Enforces oversell protection: if allow-negative-stock is false, sale movements
     * that would drive stock below zero are rejected.
     */
    @PostMapping("/movements")
    @RequirePermission("inventory.adjust")
    public ResponseEntity<ApiEnvelope<MovementResponse>> createMovement(
            @PathVariable UUID storeId, @RequestBody CreateMovementRequest request) {
        UUID accountId = requireAccountId();
        if (accountId == null) {
            return ResponseEntity.status(401)
                    .body(ApiEnvelope.fail(ApiError.of("UNAUTHORIZED", "accountId is required in tenant context")));
        }

        // Oversell protection (A5): block sale movements that would drive stock below zero
        if (!allowNegativeStock && request.quantity() < 0) {
            int currentStock = movementRepository.calculateStock(storeId, request.productId());
            if (currentStock + request.quantity() < 0) {
                return ResponseEntity.status(409)
                        .body(ApiEnvelope.fail(ApiError.of("INSUFFICIENT_STOCK",
                                "Insufficient stock. Current: " + currentStock + ", requested: " + Math.abs(request.quantity()))));
            }
        }

        InventoryMovement movement = new InventoryMovement(
                storeId, accountId, request.productId(),
                request.movementType(), request.quantity(),
                request.referenceType(), request.referenceId());
        movement = movementRepository.save(movement);
        return ResponseEntity.ok(ApiEnvelope.ok(MovementResponse.from(movement)));
    }

    /**
     * Gets current stock level for a specific product.
     */
    @GetMapping("/stock/{productId}")
    @RequirePermission("inventory.view")
    public ResponseEntity<ApiEnvelope<StockResponse>> getStock(
            @PathVariable UUID storeId, @PathVariable UUID productId) {
        int stock = movementRepository.calculateStock(storeId, productId);
        return ResponseEntity.ok(ApiEnvelope.ok(new StockResponse(storeId, productId, stock)));
    }

    /**
     * Lists all inventory movements for the store.
     */
    @GetMapping("/movements")
    @RequirePermission("inventory.view")
    public ResponseEntity<ApiEnvelope<List<MovementResponse>>> listMovements(@PathVariable UUID storeId) {
        UUID accountId = requireAccountId();
        if (accountId == null) {
            return ResponseEntity.status(401)
                    .body(ApiEnvelope.fail(ApiError.of("UNAUTHORIZED", "accountId is required in tenant context")));
        }
        List<MovementResponse> movements = movementRepository.findByStoreIdAndAccountIdOrderByCreatedAtDesc(storeId, accountId)
                .stream()
                .map(MovementResponse::from)
                .toList();
        return ResponseEntity.ok(ApiEnvelope.ok(movements));
    }

    private UUID requireAccountId() {
        TenantContext context = RequestContextHolder.get();
        return context.accountId();
    }
}
