package com.smartpos.sales.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.context.TenantContext;
import com.smartpos.sales.api.dto.CreateSaleRequest;
import com.smartpos.sales.api.dto.SaleResponse;
import com.smartpos.sales.domain.Sale;
import com.smartpos.sales.domain.SaleRepository;
import com.smartpos.sales.integration.CatalogClient;
import com.smartpos.sales.integration.InventoryClient;
import com.smartpos.sales.outbox.OutboxEvent;
import com.smartpos.sales.outbox.OutboxRepository;
import java.math.BigDecimal;
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
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for managing sales transactions.
 *
 * <p>Creates sale records, fetches cost prices from the catalog service,
 * and writes outbox events for inventory deduction.</p>
 */
@RestController
@RequestMapping("/api/v1/stores/{storeId}/sales")
public class SalesController {

    private final SaleRepository saleRepository;
    private final CatalogClient catalogClient;
    private final OutboxRepository outboxRepository;

    public SalesController(SaleRepository saleRepository, CatalogClient catalogClient,
                           OutboxRepository outboxRepository) {
        this.saleRepository = saleRepository;
        this.catalogClient = catalogClient;
        this.outboxRepository = outboxRepository;
    }

    /**
     * Creates a new sale. Fetches cost prices server-side from the catalog service.
     * Writes an outbox event for eventual inventory deduction.
     */
    @PostMapping
    @Transactional
    public ResponseEntity<ApiEnvelope<SaleResponse>> createSale(
            @PathVariable UUID storeId, @RequestBody CreateSaleRequest request) {
        if (request == null || request.items() == null || request.items().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "items are required")));
        }

        TenantContext context = RequestContextHolder.get();
        if (context.accountId() == null) {
            return ResponseEntity.status(401)
                    .body(ApiEnvelope.fail(ApiError.of("UNAUTHORIZED", "accountId is required in tenant context")));
        }
        UUID accountId = context.accountId();

        // Resolve currency from request or context (no hardcoded fallback)
        String currency = request.currency();
        if (currency == null || currency.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "currency is required")));
        }

        Sale sale = new Sale(storeId, accountId, currency);
        for (CreateSaleRequest.SaleItemRequest item : request.items()) {
            // Fetch cost_price from catalog service (server-side, never trust client)
            BigDecimal costPrice = catalogClient.getCostPrice(storeId, item.productId());
            if (costPrice == null) {
                return ResponseEntity.badRequest()
                        .body(ApiEnvelope.fail(ApiError.of("PRODUCT_NOT_FOUND",
                                "Product not found in catalog: " + item.productId())));
            }
            sale.addItem(item.productId(), item.productName(), item.quantity(), item.unitPrice(), costPrice);
        }
        sale = saleRepository.save(sale);

        // Write outbox event for inventory deduction (transactional outbox pattern)
        List<Map<String, Object>> lineItems = sale.getItems().stream()
                .map(i -> Map.<String, Object>of(
                        "productId", i.getProductId().toString(),
                        "quantity", i.getQuantity()))
                .collect(Collectors.toList());
        Map<String, Object> payload = Map.of(
                "saleId", sale.getId().toString(),
                "storeId", storeId.toString(),
                "accountId", accountId.toString(),
                "items", lineItems);
        OutboxEvent event = new OutboxEvent("Sale", sale.getId(), "sale.created", payload);
        outboxRepository.save(event);

        SaleResponse response = SaleResponse.from(sale);
        return ResponseEntity
                .created(URI.create("/api/v1/stores/" + storeId + "/sales/" + sale.getId()))
                .body(ApiEnvelope.ok(response));
    }

    /**
     * Gets a specific sale by ID.
     */
    @GetMapping("/{saleId}")
    public ResponseEntity<ApiEnvelope<SaleResponse>> getSale(
            @PathVariable UUID storeId, @PathVariable UUID saleId) {
        return saleRepository.findByIdAndStoreId(saleId, storeId)
                .map(sale -> ResponseEntity.ok(ApiEnvelope.ok(SaleResponse.from(sale))))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Lists sales for a store, optionally filtered by date range.
     */
    @GetMapping
    public ResponseEntity<ApiEnvelope<List<SaleResponse>>> listSales(
            @PathVariable UUID storeId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String from,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String to) {
        List<Sale> sales;
        if (from != null && to != null) {
            Instant fromInstant = Instant.parse(from);
            Instant toInstant = Instant.parse(to);
            sales = saleRepository.findByStoreIdAndCreatedAtBetween(storeId, fromInstant, toInstant);
        } else {
            sales = saleRepository.findByStoreId(storeId);
        }
        List<SaleResponse> responses = sales.stream().map(SaleResponse::from).toList();
        return ResponseEntity.ok(ApiEnvelope.ok(responses));
    }
}
