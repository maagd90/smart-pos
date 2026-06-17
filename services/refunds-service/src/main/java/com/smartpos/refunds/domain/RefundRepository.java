package com.smartpos.refunds.domain;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for refund persistence.
 */
public interface RefundRepository extends JpaRepository<Refund, UUID> {

    @EntityGraph(attributePaths = "items")
    Optional<Refund> findByIdAndStoreId(UUID id, UUID storeId);

    @EntityGraph(attributePaths = "items")
    List<Refund> findByStoreId(UUID storeId);

    @EntityGraph(attributePaths = "items")
    List<Refund> findByStoreIdAndCreatedAtBetween(UUID storeId, Instant from, Instant to);
}
