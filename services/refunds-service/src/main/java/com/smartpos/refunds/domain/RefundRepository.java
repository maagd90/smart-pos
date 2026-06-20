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
    Optional<Refund> findByIdAndStoreIdAndAccountId(UUID id, UUID storeId, UUID accountId);

    @EntityGraph(attributePaths = "items")
    List<Refund> findByStoreIdAndAccountId(UUID storeId, UUID accountId);

    @EntityGraph(attributePaths = "items")
    List<Refund> findByStoreIdAndAccountIdAndCreatedAtBetween(UUID storeId, UUID accountId, Instant from, Instant to);
}
