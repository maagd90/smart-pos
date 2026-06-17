package com.smartpos.inventory.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.context.TenantContext;
import com.smartpos.inventory.api.dto.CreateMovementRequest;
import com.smartpos.inventory.api.dto.MovementResponse;
import com.smartpos.inventory.api.dto.ReceiveStockRequest;
import com.smartpos.inventory.api.dto.StockResponse;
import com.smartpos.inventory.domain.InventoryMovement;
import com.smartpos.inventory.domain.InventoryMovementRepository;
import java.util.List;
import java.util.UUID;
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
public class InventoryController {

    private static final UUID FALLBACK_ACCOUNT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private final InventoryMovementRepository movementRepository;

    /**
     * Creates the inventory controller.
     *
     * @param movementRepository repository for movement persistence
     */
    public InventoryController(InventoryMovementRepository movementRepository) {
        this.movementRepository = movementRepository;
    }

    /**
     * Receives stock into inventory (creates a positive movement).
     *
     * @param storeId the store receiving stock
     * @param request the receive request with product and quantity
     * @return the created movement
     */
    @PostMapping("/receive")
    public ResponseEntity<ApiEnvelope<MovementResponse>> receiveStock(
            @PathVariable UUID storeId, @RequestBody ReceiveStockRequest request) {
        if (request.quantity() <= 0) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_QUANTITY", "Quantity must be positive")));
        }

        UUID accountId = resolveAccountId();
        InventoryMovement movement = new InventoryMovement(
                storeId, accountId, request.productId(),
                "receive", request.quantity(), null, null);
        movement = movementRepository.save(movement);
        return ResponseEntity.ok(ApiEnvelope.ok(MovementResponse.from(movement)));
    }

    /**
     * Creates an inventory movement (used by other services like sales and refunds).
     *
     * @param storeId the store
     * @param request the movement details
     * @return the created movement
     */
    @PostMapping("/movements")
    public ResponseEntity<ApiEnvelope<MovementResponse>> createMovement(
            @PathVariable UUID storeId, @RequestBody CreateMovementRequest request) {
        UUID accountId = resolveAccountId();
        InventoryMovement movement = new InventoryMovement(
                storeId, accountId, request.productId(),
                request.movementType(), request.quantity(),
                request.referenceType(), request.referenceId());
        movement = movementRepository.save(movement);
        return ResponseEntity.ok(ApiEnvelope.ok(MovementResponse.from(movement)));
    }

    /**
     * Gets current stock level for a specific product.
     *
     * @param storeId the store ID
     * @param productId the product ID
     * @return current stock quantity
     */
    @GetMapping("/stock/{productId}")
    public ResponseEntity<ApiEnvelope<StockResponse>> getStock(
            @PathVariable UUID storeId, @PathVariable UUID productId) {
        int stock = movementRepository.calculateStock(storeId, productId);
        return ResponseEntity.ok(ApiEnvelope.ok(new StockResponse(storeId, productId, stock)));
    }

    /**
     * Lists all inventory movements for the store.
     *
     * @param storeId the store ID
     * @return list of movements ordered by most recent first
     */
    @GetMapping("/movements")
    public ResponseEntity<ApiEnvelope<List<MovementResponse>>> listMovements(@PathVariable UUID storeId) {
        List<MovementResponse> movements = movementRepository.findByStoreIdOrderByCreatedAtDesc(storeId)
                .stream()
                .map(MovementResponse::from)
                .toList();
        return ResponseEntity.ok(ApiEnvelope.ok(movements));
    }

    /**
     * Resolves the current account ID from the request context.
     *
     * @return the account UUID
     */
    private UUID resolveAccountId() {
        TenantContext context = RequestContextHolder.get();
        return context.accountId() != null ? context.accountId() : FALLBACK_ACCOUNT_ID;
    }
}
