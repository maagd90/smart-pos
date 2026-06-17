package com.smartpos.contracts.events;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Standard domain event record published to the message broker.
 *
 * <p>All services publish events in this format to ensure consistent
 * serialization and routing across the platform.</p>
 *
 * @param eventId       unique identifier for this event instance
 * @param eventType     the event type key (e.g. "sale.completed", "inventory.adjusted")
 * @param accountId     the tenant account that owns this event
 * @param storeId       the store where the event occurred (null for account-level events)
 * @param aggregateType the type of aggregate that produced the event (e.g. "Sale", "Product")
 * @param aggregateId   the identifier of the aggregate instance
 * @param occurredAt    when the event occurred
 * @param payload       event-specific data as a flexible map
 */
public record DomainEvent(
        UUID eventId,
        String eventType,
        UUID accountId,
        UUID storeId,
        String aggregateType,
        UUID aggregateId,
        Instant occurredAt,
        Map<String, Object> payload
) {}
