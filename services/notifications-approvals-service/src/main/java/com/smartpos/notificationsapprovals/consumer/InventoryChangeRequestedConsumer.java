package com.smartpos.notificationsapprovals.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpos.notificationsapprovals.domain.NotificationKind;
import com.smartpos.notificationsapprovals.domain.RefType;
import com.smartpos.notificationsapprovals.service.NotificationService;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class InventoryChangeRequestedConsumer {

    private static final Logger log = LoggerFactory.getLogger(InventoryChangeRequestedConsumer.class);

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public InventoryChangeRequestedConsumer(NotificationService notificationService, ObjectMapper objectMapper) {
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "inventory.change.requested", groupId = "notifications-approvals-service")
    public void consume(String payload) {
        try {
            JsonNode node = objectMapper.readTree(payload);
            UUID changeId = UUID.fromString(node.get("changeId").asText());
            UUID storeId = UUID.fromString(node.get("storeId").asText());
            UUID accountId = UUID.fromString(node.get("accountId").asText());
            String summary = node.path("summary").asText("Inventory change review required");
            notificationService.createFromEvent(
                    NotificationKind.INVENTORY_CHANGE_APPROVAL, RefType.inventory_change,
                    changeId, accountId, storeId, summary);
        } catch (Exception e) {
            log.warn("Failed to process inventory.change.requested: {}", e.getMessage());
        }
    }
}
