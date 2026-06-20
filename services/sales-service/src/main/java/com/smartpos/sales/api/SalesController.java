package com.smartpos.sales.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.context.TenantContext;
import com.smartpos.contracts.security.RequirePermission;
import com.smartpos.contracts.security.RequireStoreAccess;
import com.smartpos.sales.api.dto.CreateSaleRequest;
import com.smartpos.sales.api.dto.SaleResponse;
import com.smartpos.sales.domain.Sale;
import com.smartpos.sales.domain.SaleRepository;
import com.smartpos.sales.integration.CatalogClient;
import com.smartpos.sales.integration.InventoryStockClient;
import com.smartpos.sales.integration.TenantClient;
import com.smartpos.sales.outbox.OutboxEvent;
import com.smartpos.sales.outbox.OutboxRepository;
import java.math.BigDecimal;
import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
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
 * REST controller for managing sales transactions.
 */
@RestController
@RequestMapping("/api/v1/stores/{storeId}/sales")
@RequireStoreAccess
public class SalesController {

    private final SaleRepository saleRepository;
    private final CatalogClient catalogClient;
    private final InventoryStockClient inventoryStockClient;
    private final TenantClient tenantClient;
    private final OutboxRepository outboxRepository;
    private final boolean allowNegativeStock;

    public SalesController(SaleRepository saleRepository,
                           CatalogClient catalogClient,
                           InventoryStockClient inventoryStockClient,
                           TenantClient tenantClient,
                           OutboxRepository outboxRepository,
                           @Value("${inventory.allow-negative-stock:false}") boolean allowNegativeStock) {
        this.saleRepository = saleRepository;
        this.catalogClient = catalogClient;
        this.inventoryStockClient = inventoryStockClient;
        this.tenantClient = tenantClient;
        this.outboxRepository = outboxRepository;
        this.allowNegativeStock = allowNegativeStock;
    }

    @PostMapping
    @Transactional
    @RequirePermission("sale.create")
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

        String currency = request.currency();
        if (currency == null || currency.isBlank()) {
            currency = tenantClient.getAccountCurrency(accountId);
        }
        if (currency == null || currency.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "currency could not be resolved from account config")));
        }

        if (!allowNegativeStock) {
            for (CreateSaleRequest.SaleItemRequest item : request.items()) {
                try {
                    Integer currentStock = inventoryStockClient.getCurrentStock(storeId, item.productId());
                    if (currentStock == null) {
                        return ResponseEntity.status(503)
                                .body(ApiEnvelope.fail(ApiError.of("INVENTORY_UNAVAILABLE",
                                        "Unable to verify stock for product " + item.productId())));
                    }
                    if (currentStock < item.quantity()) {
                        return ResponseEntity.status(409)
                                .body(ApiEnvelope.fail(ApiError.of("INSUFFICIENT_STOCK",
                                        "Insufficient stock for product " + item.productId()
                                                + ". Current: " + currentStock + ", requested: " + item.quantity())));
                    }
                } catch (InventoryStockClient.InventoryUnavailableException e) {
                    return ResponseEntity.status(503)
                            .body(ApiEnvelope.fail(ApiError.of("INVENTORY_UNAVAILABLE",
                                    "Unable to verify stock for product " + item.productId())));
                }
            }
        }

        Sale sale = new Sale(storeId, accountId, currency);
        for (CreateSaleRequest.SaleItemRequest item : request.items()) {
            BigDecimal costPrice = catalogClient.getCostPrice(storeId, item.productId());
            if (costPrice == null) {
                return ResponseEntity.badRequest()
                        .body(ApiEnvelope.fail(ApiError.of("PRODUCT_NOT_FOUND",
                                "Product not found in catalog: " + item.productId())));
            }
            sale.addItem(item.productId(), item.productName(), item.quantity(), item.unitPrice(), costPrice);
        }
        sale = saleRepository.save(sale);

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

    @GetMapping("/{saleId}")
    @RequirePermission("sale.view")
    public ResponseEntity<ApiEnvelope<SaleResponse>> getSale(
            @PathVariable UUID storeId, @PathVariable UUID saleId) {
        UUID accountId = requireAccountId();
        if (accountId == null) {
            return ResponseEntity.status(401)
                    .body(ApiEnvelope.fail(ApiError.of("UNAUTHORIZED", "accountId is required in tenant context")));
        }
        return saleRepository.findByIdAndStoreIdAndAccountId(saleId, storeId, accountId)
                .map(sale -> ResponseEntity.ok(ApiEnvelope.ok(SaleResponse.from(sale))))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    @RequirePermission("sale.view")
    public ResponseEntity<ApiEnvelope<List<SaleResponse>>> listSales(
            @PathVariable UUID storeId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        UUID accountId = requireAccountId();
        if (accountId == null) {
            return ResponseEntity.status(401)
                    .body(ApiEnvelope.fail(ApiError.of("UNAUTHORIZED", "accountId is required in tenant context")));
        }
        List<Sale> sales;
        if (from != null && to != null) {
            Instant fromInstant = Instant.parse(from);
            Instant toInstant = Instant.parse(to);
            sales = saleRepository.findByStoreIdAndAccountIdAndCreatedAtBetween(storeId, accountId, fromInstant, toInstant);
        } else {
            sales = saleRepository.findByStoreIdAndAccountId(storeId, accountId);
        }
        List<SaleResponse> responses = sales.stream().map(SaleResponse::from).toList();
        return ResponseEntity.ok(ApiEnvelope.ok(responses));
    }

    private UUID requireAccountId() {
        return RequestContextHolder.get().accountId();
    }
}
