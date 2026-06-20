package com.smartpos.sales.domain;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for managing sale persistence.
 */
public interface SaleRepository extends JpaRepository<Sale, UUID> {

    /**
     * Finds a sale by ID and store.
     */
    @EntityGraph(attributePaths = "items")
    Optional<Sale> findByIdAndStoreIdAndAccountId(UUID id, UUID storeId, UUID accountId);

    /**
     * Finds all sales for a store (tenant-scoped).
     */
    @EntityGraph(attributePaths = "items")
    List<Sale> findByStoreIdAndAccountId(UUID storeId, UUID accountId);

    /**
     * Finds sales for a store within a time range (for date-scoped reporting).
     */
    @EntityGraph(attributePaths = "items")
    List<Sale> findByStoreIdAndAccountIdAndCreatedAtBetween(UUID storeId, UUID accountId, Instant from, Instant to);
}
