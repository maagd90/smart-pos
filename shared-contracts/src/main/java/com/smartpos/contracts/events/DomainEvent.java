package com.smartpos.contracts.events;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record DomainEvent(UUID eventId, String eventType, UUID accountId, UUID storeId, String aggregateType, UUID aggregateId, Instant occurredAt, Map<String, Object> payload) {}
