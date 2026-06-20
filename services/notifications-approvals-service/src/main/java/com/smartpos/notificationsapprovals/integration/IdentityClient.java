package com.smartpos.notificationsapprovals.integration;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.notificationsapprovals.config.NotificationsProperties;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class IdentityClient {

    private final RestTemplate restTemplate;
    private final NotificationsProperties properties;
    private final ObjectMapper objectMapper;

    public IdentityClient(RestTemplate restTemplate, NotificationsProperties properties, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public List<ApprovalRecipient> fetchApprovalRecipients(UUID accountId, UUID storeId) {
        String url = UriComponentsBuilder
                .fromHttpUrl(properties.getIdentityUrl())
                .path("/api/v1/internal/stores/{storeId}/approval-recipients")
                .queryParam("accountId", accountId)
                .build(storeId)
                .toString();
        try {
            String body = restTemplate.getForObject(url, String.class);
            ApiEnvelope<List<ApprovalRecipient>> envelope = objectMapper.readValue(body, new TypeReference<>() {});
            if (envelope == null || envelope.data() == null) {
                return List.of();
            }
            return envelope.data();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to fetch approval recipients", e);
        }
    }

    public record ApprovalRecipient(UUID userId, String email, java.util.Set<String> permissions) {
    }
}
