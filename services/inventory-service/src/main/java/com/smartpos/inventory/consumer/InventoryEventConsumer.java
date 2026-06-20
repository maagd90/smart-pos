package com.smartpos.inventory.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpos.inventory.domain.InventoryMovement;
import com.smartpos.inventory.domain.InventoryMovementRepository;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer that idempotently applies sale.created and refund.created inventory movements.
 *
 * <p>At-least-once delivery is deduplicated via a unique constraint and existence checks.
 * Oversell protection is enforced at sale-creation time in sales-service, not here.</p>
 */
@Component
public class InventoryEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(InventoryEventConsumer.class);

    private final InventoryMovementRepository movementRepository;
    private final ObjectMapper objectMapper;

    /**
     * Creates the inventory event consumer.
     *
     * @param movementRepository movement persistence
     * @param objectMapper JSON parser for event payloads
     */
    public InventoryEventConsumer(InventoryMovementRepository movementRepository,
                                  ObjectMapper objectMapper) {
        this.movementRepository = movementRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Applies stock deductions for a committed sale event.
     *
     * @param payload sale.created JSON payload from the outbox
     */
    @KafkaListener(topics = "sale.created", groupId = "inventory-service")
    public void handleSaleCreated(String payload) {
        JsonNode root = parsePayload(payload, "sale.created");
        UUID storeId = uuid(root, "storeId");
        UUID accountId = uuid(root, "accountId");
        UUID saleId = uuid(root, "saleId");

        for (JsonNode item : root.get("items")) {
            UUID productId = uuid(item, "productId");
            int quantity = item.get("quantity").asInt();
            applyMovementIdempotently(
                    storeId, accountId, productId, "sale", -quantity, "sale", saleId);
        }
    }

    /**
     * Applies stock returns for resellable refund lines.
     *
     * @param payload refund.created JSON payload from the outbox
     */
    @KafkaListener(topics = "refund.created", groupId = "inventory-service")
    public void handleRefundCreated(String payload) {
        JsonNode root = parsePayload(payload, "refund.created");
        UUID storeId = uuid(root, "storeId");
        UUID accountId = uuid(root, "accountId");
        UUID refundId = uuid(root, "refundId");

        for (JsonNode item : root.get("items")) {
            UUID productId = uuid(item, "productId");
            int quantity = item.get("quantity").asInt();
            applyMovementIdempotently(
                    storeId, accountId, productId, "return", quantity, "refund", refundId);
        }
    }

    @KafkaListener(topics = "sale.voided", groupId = "inventory-service")
    public void handleSaleVoided(String payload) {
        JsonNode root = parsePayload(payload, "sale.voided");
        UUID storeId = uuid(root, "storeId");
        UUID accountId = uuid(root, "accountId");
        UUID saleId = uuid(root, "saleId");

        for (JsonNode item : root.get("items")) {
            UUID productId = uuid(item, "productId");
            int quantity = item.get("quantity").asInt();
            applyMovementIdempotently(
                    storeId, accountId, productId, "void", quantity, "sale_void", saleId);
        }
    }

    /**
     * Saves a movement once per event line; duplicates are acknowledged without rethrow.
     */
    private void applyMovementIdempotently(UUID storeId, UUID accountId, UUID productId,
                                           String movementType, int quantity,
                                           String referenceType, UUID referenceId) {
        if (movementRepository.existsByStoreIdAndReferenceTypeAndReferenceIdAndProductId(
                storeId, referenceType, referenceId, productId)) {
            log.debug("Skipping duplicate movement store={} refType={} refId={} product={}",
                    storeId, referenceType, referenceId, productId);
            return;
        }

        try {
            InventoryMovement movement = new InventoryMovement(
                    storeId, accountId, productId, movementType, quantity, referenceType, referenceId);
            movementRepository.save(movement);
        } catch (DataIntegrityViolationException e) {
            log.debug("Duplicate movement detected on save store={} refType={} refId={} product={}",
                    storeId, referenceType, referenceId, productId);
        }
    }

    private JsonNode parsePayload(String payload, String eventType) {
        try {
            return objectMapper.readTree(payload);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid " + eventType + " payload", e);
        }
    }

    private UUID uuid(JsonNode node, String field) {
        return UUID.fromString(node.get(field).asText());
    }
}
