package com.smartpos.inventory.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.UUID;
import org.junit.jupiter.api.Test;

class StockLedgerTest {

    @Test
    void netStockReflectsSignedMovements() {
        UUID storeId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();

        InventoryMovement receive = new InventoryMovement(storeId, accountId, productId, "receive", 10, null, null);
        InventoryMovement sale = new InventoryMovement(storeId, accountId, productId, "sale", -2, "sale", UUID.randomUUID());
        InventoryMovement refund = new InventoryMovement(storeId, accountId, productId, "return", 1, "refund", UUID.randomUUID());

        int stock = receive.getQuantity() + sale.getQuantity() + refund.getQuantity();
        assertEquals(9, stock);
    }
}
