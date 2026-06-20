package com.smartpos.sales.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.context.TenantContext;
import com.smartpos.sales.api.dto.CreateSaleRequest;
import com.smartpos.sales.domain.Sale;
import com.smartpos.sales.domain.SaleRepository;
import com.smartpos.sales.integration.CatalogClient;
import com.smartpos.sales.integration.InventoryStockClient;
import com.smartpos.sales.integration.TenantClient;
import com.smartpos.sales.outbox.OutboxEvent;
import com.smartpos.sales.outbox.OutboxRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class SalesControllerOutboxTest {

    @Mock private SaleRepository saleRepository;
    @Mock private CatalogClient catalogClient;
    @Mock private InventoryStockClient inventoryStockClient;
    @Mock private TenantClient tenantClient;
    @Mock private OutboxRepository outboxRepository;

    private SalesController salesController;

    private final UUID storeId = UUID.randomUUID();
    private final UUID accountId = UUID.randomUUID();
    private final UUID productId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        salesController = new SalesController(saleRepository, catalogClient, inventoryStockClient, tenantClient, outboxRepository, false);
        RequestContextHolder.set(new TenantContext(
                UUID.randomUUID(), accountId, null, true, Set.of("sale.create"), "corr", true, Set.of()));
    }

    @AfterEach
    void tearDown() {
        RequestContextHolder.clear();
    }

    @Test
    void persistsOutboxEventWhenInventoryReadUnavailableDuringStockCheck() {
        when(tenantClient.getAccountCurrency(accountId)).thenReturn("AED");
        when(inventoryStockClient.getCurrentStock(storeId, productId))
                .thenThrow(new InventoryStockClient.InventoryUnavailableException("down", new RuntimeException("down")));

        CreateSaleRequest request = new CreateSaleRequest(
                List.of(new CreateSaleRequest.SaleItemRequest(productId, "Product", 1, new BigDecimal("1575"))),
                null);

        ResponseEntity<ApiEnvelope<com.smartpos.sales.api.dto.SaleResponse>> response =
                salesController.createSale(storeId, request);

        assertEquals(503, response.getStatusCode().value());
        verify(saleRepository, never()).save(any());
        verify(outboxRepository, never()).save(any());
    }

    @Test
    void persistsSaleAndOutboxEventWhenStockIsAvailable() {
        when(tenantClient.getAccountCurrency(accountId)).thenReturn("AED");
        when(inventoryStockClient.getCurrentStock(storeId, productId)).thenReturn(10);
        when(catalogClient.getCostPrice(storeId, productId)).thenReturn(new BigDecimal("1500"));
        when(saleRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        CreateSaleRequest request = new CreateSaleRequest(
                List.of(new CreateSaleRequest.SaleItemRequest(productId, "Product", 1, new BigDecimal("1575"))),
                null);

        ResponseEntity<ApiEnvelope<com.smartpos.sales.api.dto.SaleResponse>> response =
                salesController.createSale(storeId, request);

        assertTrue(response.getStatusCode().is2xxSuccessful());
        ArgumentCaptor<OutboxEvent> captor = ArgumentCaptor.forClass(OutboxEvent.class);
        verify(outboxRepository).save(captor.capture());
        assertEquals("sale.created", captor.getValue().getEventType());
    }
}
