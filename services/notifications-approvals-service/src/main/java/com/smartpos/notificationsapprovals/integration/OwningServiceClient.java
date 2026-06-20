package com.smartpos.notificationsapprovals.integration;

import com.smartpos.notificationsapprovals.config.NotificationsProperties;
import com.smartpos.notificationsapprovals.domain.Decision;
import com.smartpos.notificationsapprovals.domain.Notification;
import com.smartpos.notificationsapprovals.domain.RefType;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class OwningServiceClient {

    private final RestTemplate restTemplate;
    private final NotificationsProperties properties;

    public OwningServiceClient(RestTemplate restTemplate, NotificationsProperties properties) {
        this.restTemplate = restTemplate;
        this.properties = properties;
    }

    public void executeDecision(Notification notification, UUID recipientUserId, Set<String> permissions,
                                Decision decision) {
        HttpHeaders headers = buildManagerHeaders(recipientUserId, notification.getAccountId(),
                notification.getStoreId(), permissions);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        if (notification.getRefType() == RefType.deal) {
            String path = decision == Decision.ACCEPT ? "accept" : "reject";
            String url = properties.getAiDealsUrl() + "/api/v1/deals/" + notification.getRefId() + "/" + path;
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new IllegalStateException("Deal decision failed: " + response.getStatusCode());
            }
            return;
        }

        String path = decision == Decision.ACCEPT ? "approve" : "reject";
        String url = properties.getInventoryUrl() + "/api/v1/stores/" + notification.getStoreId()
                + "/change-requests/" + notification.getRefId() + "/" + path;
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new IllegalStateException("Inventory decision failed: " + response.getStatusCode());
        }
    }

    private HttpHeaders buildManagerHeaders(UUID userId, UUID accountId, UUID storeId, Set<String> permissions) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", userId.toString());
        headers.set("X-Account-Id", accountId.toString());
        headers.set("X-Store-Id", storeId.toString());
        headers.set("X-Platform-Admin", "false");
        headers.set("X-Account-Wide-Access", "true");
        if (permissions != null && !permissions.isEmpty()) {
            headers.set("X-Permissions", String.join(",", permissions));
        }
        headers.set("X-Accessible-Stores", storeId.toString());
        return headers;
    }
}
