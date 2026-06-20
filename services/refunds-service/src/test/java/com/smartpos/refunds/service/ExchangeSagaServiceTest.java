package com.smartpos.refunds.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpos.refunds.api.dto.CreateExchangeRequest;
import com.smartpos.refunds.domain.ExchangeRepository;
import com.smartpos.refunds.domain.RefundRepository;
import com.smartpos.refunds.domain.RefundedQuantityRepository;
import com.smartpos.refunds.integration.CatalogClient;
import com.smartpos.refunds.integration.SalesClient;
import com.smartpos.refunds.integration.TenantClient;
import com.smartpos.refunds.outbox.OutboxRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ExchangeSagaServiceTest {

    @Mock private ExchangeRepository exchangeRepository;
    @Mock private RefundRepository refundRepository;
    @Mock private RefundedQuantityRepository refundedQuantityRepository;
    @Mock private OutboxRepository outboxRepository;
    @Mock private SalesClient salesClient;
    @Mock private CatalogClient catalogClient;
    @Mock private TenantClient tenantClient;

    private ExchangeSagaService sagaService;

    private final UUID storeId = UUID.randomUUID();
    private final UUID accountId = UUID.randomUUID();
    private final UUID saleId = UUID.randomUUID();
    private final UUID productId = UUID.randomUUID();
    private final UUID replacementProductId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        RefundPricingService pricingService = new RefundPricingService(new ObjectMapper());
        RefundEligibilityService eligibilityService =
                new RefundEligibilityService(refundedQuantityRepository, pricingService);
        sagaService = new ExchangeSagaService(exchangeRepository, refundRepository, refundedQuantityRepository,
                outboxRepository, salesClient, catalogClient, tenantClient, eligibilityService, pricingService);
    }

    @Test
    void happyPathCompletesExchange() {
        SalesClient.SaleLineDetails saleLine = new SalesClient.SaleLineDetails(
                productId, "Original", 2, new BigDecimal("1575"), new BigDecimal("3150"),
                true, 14, true, 14, BigDecimal.ZERO, BigDecimal.ZERO, "[]");
        SalesClient.SaleDetails sale = new SalesClient.SaleDetails(
                saleId, storeId, "ACTIVE", "AED", Instant.now(), List.of(saleLine));

        when(salesClient.getSale(storeId, saleId)).thenReturn(sale);
        when(refundedQuantityRepository.findByStoreIdAndSaleIdAndProductId(storeId, saleId, productId))
                .thenReturn(Optional.empty());
        when(catalogClient.getSellingPrice(storeId, replacementProductId)).thenReturn(new BigDecimal("1200"));
        when(catalogClient.getProductName(storeId, replacementProductId)).thenReturn("Replacement");
        when(exchangeRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        UUID replacementSaleId = UUID.randomUUID();
        when(salesClient.createSale(any(), any(), any())).thenReturn(replacementSaleId);
        when(refundRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(refundedQuantityRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        CreateExchangeRequest request = new CreateExchangeRequest(
                saleId,
                List.of(new CreateExchangeRequest.ExchangeItemRequest(productId, 1, true)),
                List.of(new CreateExchangeRequest.ExchangeItemRequest(replacementProductId, 1, null)));

        ExchangeSagaService.ExchangeResult result = sagaService.executeExchange(storeId, accountId, request);

        assertEquals(201, result.httpStatus());
        assertEquals("COMPLETED", result.exchange().getStatus());
        verify(outboxRepository).save(any());
    }

    @Test
    void replacementFailureMarksExchangeFailed() {
        SalesClient.SaleLineDetails saleLine = new SalesClient.SaleLineDetails(
                productId, "Original", 2, new BigDecimal("1575"), new BigDecimal("3150"),
                true, 14, true, 14, BigDecimal.ZERO, BigDecimal.ZERO, "[]");
        when(salesClient.getSale(storeId, saleId)).thenReturn(new SalesClient.SaleDetails(
                saleId, storeId, "ACTIVE", "AED", Instant.now(), List.of(saleLine)));
        when(refundedQuantityRepository.findByStoreIdAndSaleIdAndProductId(storeId, saleId, productId))
                .thenReturn(Optional.empty());
        when(catalogClient.getSellingPrice(storeId, replacementProductId)).thenReturn(new BigDecimal("1200"));
        when(catalogClient.getProductName(storeId, replacementProductId)).thenReturn("Replacement");
        when(exchangeRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(salesClient.createSale(any(), any(), any()))
                .thenThrow(new SalesClient.SalesClientException("insufficient stock"));

        CreateExchangeRequest request = new CreateExchangeRequest(
                saleId,
                List.of(new CreateExchangeRequest.ExchangeItemRequest(productId, 1, true)),
                List.of(new CreateExchangeRequest.ExchangeItemRequest(replacementProductId, 1, null)));

        ExchangeSagaService.ExchangeResult result = sagaService.executeExchange(storeId, accountId, request);

        assertEquals(422, result.httpStatus());
        assertEquals("FAILED", result.exchange().getStatus());
        verify(refundRepository, never()).save(any());
    }
}
