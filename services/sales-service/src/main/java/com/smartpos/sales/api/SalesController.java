package com.smartpos.sales.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.context.TenantContext;
import com.smartpos.sales.api.dto.CreateSaleRequest;
import com.smartpos.sales.api.dto.SaleResponse;
import com.smartpos.sales.domain.Sale;
import com.smartpos.sales.domain.SaleRepository;
import com.smartpos.sales.integration.InventoryClient;
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
 * REST controller for managing sales transactions.
 *
 * <p>Creates sale records and triggers inventory deductions for sold items.</p>
 */
@RestController
@RequestMapping("/api/v1/stores/{storeId}/sales")
public class SalesController {

    private static final UUID DEFAULT_ACCOUNT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private final SaleRepository saleRepository;
    private final InventoryClient inventoryClient;

    /**
     * Creates the sales controller.
     *
     * @param saleRepository repository for sale persistence
     * @param inventoryClient client for inventory communication
     */
    public SalesController(SaleRepository saleRepository, InventoryClient inventoryClient) {
        this.saleRepository = saleRepository;
        this.inventoryClient = inventoryClient;
    }

    /**
     * Creates a new sale and deducts inventory.
     *
     * @param storeId the store where the sale occurs
     * @param request the sale details
     * @return the completed sale
     */
    @PostMapping
    public ResponseEntity<ApiEnvelope<SaleResponse>> createSale(
            @PathVariable UUID storeId, @RequestBody CreateSaleRequest request) {
        if (request == null || request.items() == null || request.items().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "items are required")));
        }

        UUID accountId = resolveAccountId();
        String currency = request.currency() != null ? request.currency() : "AED";

        Sale sale = new Sale(storeId, accountId, currency);
        for (CreateSaleRequest.SaleItemRequest item : request.items()) {
            sale.addItem(item.productId(), item.productName(), item.quantity(), item.unitPrice());
        }
        sale = saleRepository.save(sale);

        for (CreateSaleRequest.SaleItemRequest item : request.items()) {
            inventoryClient.recordSaleMovement(storeId, item.productId(), item.quantity(), sale.getId());
        }

        SaleResponse response = SaleResponse.from(sale);
        return ResponseEntity
                .created(URI.create("/api/v1/stores/" + storeId + "/sales/" + sale.getId()))
                .body(ApiEnvelope.ok(response));
    }

    /**
     * Gets a specific sale by ID.
     *
     * @param storeId the store ID
     * @param saleId the sale ID
     * @return the sale if found
     */
    @GetMapping("/{saleId}")
    public ResponseEntity<ApiEnvelope<SaleResponse>> getSale(
            @PathVariable UUID storeId, @PathVariable UUID saleId) {
        return saleRepository.findByIdAndStoreId(saleId, storeId)
                .map(sale -> ResponseEntity.ok(ApiEnvelope.ok(SaleResponse.from(sale))))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private UUID resolveAccountId() {
        TenantContext context = RequestContextHolder.get();
        return context.accountId() != null ? context.accountId() : DEFAULT_ACCOUNT_ID;
    }
}
