package com.smartpos.refunds.domain;

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
}
