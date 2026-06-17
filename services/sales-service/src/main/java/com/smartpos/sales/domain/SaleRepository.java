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
    Optional<Sale> findByIdAndStoreId(UUID id, UUID storeId);

    /**
     * Finds all sales for a store.
     */
    @EntityGraph(attributePaths = "items")
    List<Sale> findByStoreId(UUID storeId);

    /**
     * Finds sales for a store within a time range (for date-scoped reporting).
     */
    @EntityGraph(attributePaths = "items")
    List<Sale> findByStoreIdAndCreatedAtBetween(UUID storeId, Instant from, Instant to);
}
