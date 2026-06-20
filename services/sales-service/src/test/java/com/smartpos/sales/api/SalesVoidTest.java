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
import com.smartpos.sales.domain.Sale;
import com.smartpos.sales.domain.SaleRepository;
import com.smartpos.sales.integration.CatalogClient;
import com.smartpos.sales.integration.InventoryStockClient;
import com.smartpos.sales.integration.TenantClient;
import com.smartpos.sales.outbox.OutboxEvent;
import com.smartpos.sales.outbox.OutboxRepository;
import java.math.BigDecimal;
import java.util.Optional;
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
class SalesVoidTest {

    @Mock private SaleRepository saleRepository;
    @Mock private CatalogClient catalogClient;
    @Mock private InventoryStockClient inventoryStockClient;
    @Mock private TenantClient tenantClient;
    @Mock private OutboxRepository outboxRepository;

    private SalesController salesController;

    private final UUID storeId = UUID.randomUUID();
    private final UUID accountId = UUID.randomUUID();
    private final UUID saleId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        salesController = new SalesController(saleRepository, catalogClient, inventoryStockClient,
                tenantClient, outboxRepository, false);
        RequestContextHolder.set(new TenantContext(
                UUID.randomUUID(), accountId, null, true, Set.of("sale.void"), "corr", true, Set.of()));
    }

    @AfterEach
    void tearDown() {
        RequestContextHolder.clear();
    }

    @Test
    void voidSaleEmitsSaleVoidedOutbox() {
        Sale sale = new Sale(storeId, accountId, "AED");
        sale.addItem(UUID.randomUUID(), "Item", 2, new BigDecimal("100"), new BigDecimal("50"),
                true, 14, true, 14, BigDecimal.ZERO, BigDecimal.ZERO, "[]");
        when(saleRepository.findByIdAndStoreIdAndAccountId(saleId, storeId, accountId))
                .thenReturn(Optional.of(sale));
        when(saleRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        ResponseEntity<ApiEnvelope<com.smartpos.sales.api.dto.SaleResponse>> response =
                salesController.voidSale(storeId, saleId);

        assertTrue(response.getStatusCode().is2xxSuccessful());
        assertEquals("VOIDED", response.getBody().data().status());
        ArgumentCaptor<OutboxEvent> captor = ArgumentCaptor.forClass(OutboxEvent.class);
        verify(outboxRepository).save(captor.capture());
        assertEquals("sale.voided", captor.getValue().getEventType());
    }

    @Test
    void voidAlreadyVoidedSaleIsIdempotent() {
        Sale sale = new Sale(storeId, accountId, "AED");
        sale.voidSale();
        when(saleRepository.findByIdAndStoreIdAndAccountId(saleId, storeId, accountId))
                .thenReturn(Optional.of(sale));

        salesController.voidSale(storeId, saleId);

        verify(outboxRepository, never()).save(any());
    }

    @Test
    void snapshotsPolicyFieldsOnSaleItem() {
        Sale sale = new Sale(storeId, accountId, "AED");
        sale.addItem(UUID.randomUUID(), "Item", 1, new BigDecimal("100"), new BigDecimal("50"),
                false, 7, true, 21, new BigDecimal("10"), new BigDecimal("5"), "[{\"withinDays\":7,\"refundPct\":50}]");

        assertEquals(false, sale.getItems().get(0).isRefundable());
        assertEquals(7, sale.getItems().get(0).getRefundWindowDays());
        assertEquals(21, sale.getItems().get(0).getExchangeWindowDays());
        assertEquals(new BigDecimal("10"), sale.getItems().get(0).getRestockingFeePct());
    }
}
