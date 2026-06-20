package com.smartpos.tenant.integration;

import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class IdentityOwnerClient {

    private static final Logger log = LoggerFactory.getLogger(IdentityOwnerClient.class);

    private final RestTemplate restTemplate;
    private final String identityBaseUrl;

    public IdentityOwnerClient(RestTemplate restTemplate,
                               @Value("${integration.identity-service.url:http://identity-access-service:8101}") String identityBaseUrl) {
        this.restTemplate = restTemplate;
        this.identityBaseUrl = identityBaseUrl;
    }

    public void createOwner(UUID accountId, String email, String password, String displayName) {
        Map<String, Object> body = Map.of(
                "email", email,
                "password", password,
                "displayName", displayName != null ? displayName : email);
        restTemplate.postForObject(
                identityBaseUrl + "/api/v1/internal/accounts/" + accountId + "/owner",
                body, Map.class);
    }
}
