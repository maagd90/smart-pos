package com.smartpos.inventory.consumer;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpos.inventory.domain.InventoryMovement;
import com.smartpos.inventory.domain.InventoryMovementRepository;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

@ExtendWith(MockitoExtension.class)
class InventoryEventConsumerTest {

    @Mock private InventoryMovementRepository movementRepository;

    private InventoryEventConsumer consumer;

    private final UUID storeId = UUID.randomUUID();
    private final UUID accountId = UUID.randomUUID();
    private final UUID saleId = UUID.randomUUID();
    private final UUID productId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        consumer = new InventoryEventConsumer(movementRepository, new ObjectMapper());
    }

    @Test
    void duplicateSaleEventIsIdempotent() {
        String payload = """
                {"saleId":"%s","storeId":"%s","accountId":"%s","items":[{"productId":"%s","quantity":2}]}
                """.formatted(saleId, storeId, accountId, productId);

        when(movementRepository.existsByStoreIdAndReferenceTypeAndReferenceIdAndProductId(
                storeId, "sale", saleId, productId))
                .thenReturn(false)
                .thenReturn(true);
        when(movementRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        consumer.handleSaleCreated(payload);
        consumer.handleSaleCreated(payload);

        verify(movementRepository, times(1)).save(any(InventoryMovement.class));
    }

    @Test
    void duplicateDetectedOnSaveDoesNotRethrow() {
        String payload = """
                {"saleId":"%s","storeId":"%s","accountId":"%s","items":[{"productId":"%s","quantity":1}]}
                """.formatted(saleId, storeId, accountId, productId);

        when(movementRepository.existsByStoreIdAndReferenceTypeAndReferenceIdAndProductId(
                storeId, "sale", saleId, productId)).thenReturn(false);
        when(movementRepository.save(any())).thenThrow(new DataIntegrityViolationException("duplicate"));

        assertDoesNotThrow(() -> consumer.handleSaleCreated(payload));
    }

    @Test
    void consumerAlwaysAppliesMovementWithoutBusinessThrow() {
        String payload = """
                {"saleId":"%s","storeId":"%s","accountId":"%s","items":[{"productId":"%s","quantity":99}]}
                """.formatted(saleId, storeId, accountId, productId);

        when(movementRepository.existsByStoreIdAndReferenceTypeAndReferenceIdAndProductId(
                storeId, "sale", saleId, productId)).thenReturn(false);
        when(movementRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        assertDoesNotThrow(() -> consumer.handleSaleCreated(payload));
        verify(movementRepository).save(any(InventoryMovement.class));
    }

    @Test
    void duplicateRefundEventIsIdempotent() {
        UUID refundId = UUID.randomUUID();
        String payload = """
                {"refundId":"%s","storeId":"%s","accountId":"%s","items":[{"productId":"%s","quantity":1}]}
                """.formatted(refundId, storeId, accountId, productId);

        when(movementRepository.existsByStoreIdAndReferenceTypeAndReferenceIdAndProductId(
                storeId, "refund", refundId, productId))
                .thenReturn(false)
                .thenReturn(true);
        when(movementRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        consumer.handleRefundCreated(payload);
        consumer.handleRefundCreated(payload);

        verify(movementRepository, times(1)).save(any(InventoryMovement.class));
    }

    @Test
    void skipsSaveWhenDuplicateAlreadyExists() {
        String payload = """
                {"saleId":"%s","storeId":"%s","accountId":"%s","items":[{"productId":"%s","quantity":1}]}
                """.formatted(saleId, storeId, accountId, productId);

        when(movementRepository.existsByStoreIdAndReferenceTypeAndReferenceIdAndProductId(
                storeId, "sale", saleId, productId)).thenReturn(true);

        consumer.handleSaleCreated(payload);

        verify(movementRepository, never()).save(any());
    }

    @Test
    void duplicateSaleVoidEventIsIdempotent() {
        String payload = """
                {"saleId":"%s","storeId":"%s","accountId":"%s","items":[{"productId":"%s","quantity":2}]}
                """.formatted(saleId, storeId, accountId, productId);

        when(movementRepository.existsByStoreIdAndReferenceTypeAndReferenceIdAndProductId(
                storeId, "sale_void", saleId, productId))
                .thenReturn(false)
                .thenReturn(true);
        when(movementRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        consumer.handleSaleVoided(payload);
        consumer.handleSaleVoided(payload);

        verify(movementRepository, times(1)).save(any(InventoryMovement.class));
    }

    @Test
    void saleVoidRestoresStockWithPositiveQuantity() {
        String payload = """
                {"saleId":"%s","storeId":"%s","accountId":"%s","items":[{"productId":"%s","quantity":3}]}
                """.formatted(saleId, storeId, accountId, productId);

        when(movementRepository.existsByStoreIdAndReferenceTypeAndReferenceIdAndProductId(
                storeId, "sale_void", saleId, productId)).thenReturn(false);
        when(movementRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        consumer.handleSaleVoided(payload);

        org.mockito.ArgumentCaptor<InventoryMovement> captor =
                org.mockito.ArgumentCaptor.forClass(InventoryMovement.class);
        verify(movementRepository).save(captor.capture());
        assertEquals("void", captor.getValue().getMovementType());
        assertEquals(3, captor.getValue().getQuantity());
        assertEquals("sale_void", captor.getValue().getReferenceType());
    }
}
