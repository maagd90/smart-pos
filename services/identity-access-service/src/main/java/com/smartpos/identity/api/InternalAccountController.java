package com.smartpos.identity.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.identity.service.RoleProvisioningService;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/internal/accounts")
public class InternalAccountController {

    private final RoleProvisioningService roleProvisioningService;

    public InternalAccountController(RoleProvisioningService roleProvisioningService) {
        this.roleProvisioningService = roleProvisioningService;
    }

    @PostMapping("/{accountId}/provision-roles")
    public ResponseEntity<ApiEnvelope<String>> provisionRoles(@PathVariable UUID accountId) {
        roleProvisioningService.provisionRolesForAccount(accountId);
        return ResponseEntity.ok(ApiEnvelope.ok("Roles provisioned"));
    }
}
