package com.smartpos.inventory.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpos.inventory.domain.InventoryMovement;
import com.smartpos.inventory.domain.InventoryMovementRepository;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer that processes sale.created and refund.created events
 * from the transactional outbox of sales and refunds services.
 *
 * <p>Applies inventory movements: negative for sales, positive (returns) for refunds.</p>
 */
@Component
public class InventoryEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(InventoryEventConsumer.class);

    private final InventoryMovementRepository movementRepository;
    private final ObjectMapper objectMapper;
    private final boolean allowNegativeStock;

    public InventoryEventConsumer(InventoryMovementRepository movementRepository,
                                  ObjectMapper objectMapper,
                                  @Value("${inventory.allow-negative-stock:false}") boolean allowNegativeStock) {
        this.movementRepository = movementRepository;
        this.objectMapper = objectMapper;
        this.allowNegativeStock = allowNegativeStock;
    }

    @KafkaListener(topics = "sale.created", groupId = "inventory-service")
    public void handleSaleCreated(String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            UUID storeId = UUID.fromString(root.get("storeId").asText());
            UUID accountId = UUID.fromString(root.get("accountId").asText());
            UUID saleId = UUID.fromString(root.get("saleId").asText());

            JsonNode items = root.get("items");
            for (JsonNode item : items) {
                UUID productId = UUID.fromString(item.get("productId").asText());
                int quantity = item.get("quantity").asInt();

                if (!allowNegativeStock) {
                    int currentStock = movementRepository.calculateStock(storeId, productId);
                    if (currentStock - quantity < 0) {
                        throw new IllegalStateException(
                                "Sale " + saleId + " would cause negative stock for product " + productId
                                        + ". Current: " + currentStock + ", sale qty: " + quantity);
                    }
                }

                InventoryMovement movement = new InventoryMovement(
                        storeId, accountId, productId, "sale", -quantity, "sale", saleId);
                movementRepository.save(movement);
            }
        } catch (Exception e) {
            log.error("Error processing sale.created event: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to process sale.created event", e);
        }
    }

    @KafkaListener(topics = "refund.created", groupId = "inventory-service")
    public void handleRefundCreated(String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            UUID storeId = UUID.fromString(root.get("storeId").asText());
            UUID accountId = UUID.fromString(root.get("accountId").asText());
            UUID refundId = UUID.fromString(root.get("refundId").asText());

            JsonNode items = root.get("items");
            for (JsonNode item : items) {
                UUID productId = UUID.fromString(item.get("productId").asText());
                int quantity = item.get("quantity").asInt();

                InventoryMovement movement = new InventoryMovement(
                        storeId, accountId, productId, "return", quantity, "refund", refundId);
                movementRepository.save(movement);
            }
        } catch (Exception e) {
            log.error("Error processing refund.created event: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to process refund.created event", e);
        }
    }
}
