package com.smartpos.sales.outbox;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for managing outbox events.
 */
public interface OutboxRepository extends JpaRepository<OutboxEvent, UUID> {

    /**
     * Finds unpublished events ordered by creation time.
     */
    List<OutboxEvent> findByPublishedFalseOrderByCreatedAtAsc();
}
