package com.smartpos.tenant.integration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

/**
 * Calls the identity service to bootstrap RBAC roles for a new account.
 */
@Component
public class IdentityRoleProvisioningClient {

    private static final Logger log = LoggerFactory.getLogger(IdentityRoleProvisioningClient.class);

    private final RestTemplate restTemplate;
    private final String identityBaseUrl;

    /**
     * Creates the identity provisioning client.
     *
     * @param restTemplate HTTP client with tenant header propagation
     * @param identityBaseUrl identity service base URL
     */
    public IdentityRoleProvisioningClient(RestTemplate restTemplate,
                                          @Value("${integration.identity-service.url:http://identity-access-service:8101}") String identityBaseUrl) {
        this.restTemplate = restTemplate;
        this.identityBaseUrl = identityBaseUrl;
    }

    /**
     * Requests role template copy for a newly created account.
     *
     * @param accountId account to provision
     * @throws IllegalStateException when provisioning fails
     */
    public void provisionRolesForAccount(UUID accountId) {
        try {
            restTemplate.postForObject(
                    identityBaseUrl + "/api/v1/internal/accounts/" + accountId + "/provision-roles",
                    null,
                    Void.class);
        } catch (Exception e) {
            log.error("Failed to provision roles for account {}: {}", accountId, e.getMessage(), e);
            throw new IllegalStateException("Failed to provision roles for account " + accountId, e);
        }
    }
}
