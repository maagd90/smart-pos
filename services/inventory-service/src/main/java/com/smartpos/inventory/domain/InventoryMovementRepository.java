package com.smartpos.inventory.domain;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Repository for managing inventory movement persistence and stock calculations.
 */
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, UUID> {

    /**
     * Calculates current stock level for a product in a store.
     *
     * @param storeId the store ID
     * @param productId the product ID
     * @return the current stock quantity (sum of all movements)
     */
    @Query("SELECT COALESCE(SUM(m.quantity), 0) FROM InventoryMovement m WHERE m.storeId = :storeId AND m.productId = :productId")
    int calculateStock(@Param("storeId") UUID storeId, @Param("productId") UUID productId);

    /**
     * Finds all movements for a specific store.
     *
     * @param storeId the store ID
     * @return list of movements ordered by creation time
     */
    List<InventoryMovement> findByStoreIdAndAccountIdOrderByCreatedAtDesc(UUID storeId, UUID accountId);

    /**
     * Returns true when a movement for the same event line was already applied.
     */
    boolean existsByStoreIdAndReferenceTypeAndReferenceIdAndProductId(
            UUID storeId, String referenceType, UUID referenceId, UUID productId);
}
