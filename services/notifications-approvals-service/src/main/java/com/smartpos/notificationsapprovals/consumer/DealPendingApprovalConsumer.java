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
public class DealPendingApprovalConsumer {

    private static final Logger log = LoggerFactory.getLogger(DealPendingApprovalConsumer.class);

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public DealPendingApprovalConsumer(NotificationService notificationService, ObjectMapper objectMapper) {
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "deal.pending_approval", groupId = "notifications-approvals-service")
    public void consume(String payload) {
        try {
            JsonNode node = objectMapper.readTree(payload);
            UUID dealId = UUID.fromString(node.get("dealId").asText());
            UUID storeId = UUID.fromString(node.get("storeId").asText());
            UUID accountId = UUID.fromString(node.get("accountId").asText());
            String summary = node.path("offerSummary").asText("Deal review required");
            notificationService.createFromEvent(
                    NotificationKind.DEAL_APPROVAL, RefType.deal, dealId, accountId, storeId, summary);
        } catch (Exception e) {
            log.warn("Failed to process deal.pending_approval: {}", e.getMessage());
        }
    }
}
