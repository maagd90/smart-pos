package com.smartpos.identity.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.identity.domain.Role;
import com.smartpos.identity.domain.RoleRepository;
import com.smartpos.identity.service.RoleProvisioningService;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/internal/accounts")
public class InternalUserController {

    private static final UUID ACCOUNT_ADMIN_ROLE_TEMPLATE = UUID.fromString("10000000-0000-0000-0000-000000000002");

    private final com.smartpos.identity.service.UserManagementService userManagementService;
    private final RoleRepository roleRepository;
    private final RoleProvisioningService roleProvisioningService;

    public InternalUserController(com.smartpos.identity.service.UserManagementService userManagementService,
                                  RoleRepository roleRepository,
                                  RoleProvisioningService roleProvisioningService) {
        this.userManagementService = userManagementService;
        this.roleRepository = roleRepository;
        this.roleProvisioningService = roleProvisioningService;
    }

    @PostMapping("/{accountId}/owner")
    public ResponseEntity<ApiEnvelope<UserCreatedResponse>> createOwner(
            @PathVariable UUID accountId, @RequestBody CreateOwnerRequest request) {
        roleProvisioningService.provisionRolesForAccount(accountId);
        UUID adminRoleId = roleRepository.findByAccountId(accountId).stream()
                .filter(r -> "account_admin".equals(r.getName()))
                .map(Role::getId)
                .findFirst()
                .orElse(ACCOUNT_ADMIN_ROLE_TEMPLATE);

        var user = userManagementService.createUser(accountId, request.email(), request.displayName(), request.password());
        userManagementService.assignRole(accountId, user.getId(), adminRoleId, null);
        return ResponseEntity.ok(ApiEnvelope.ok(new UserCreatedResponse(user.getId(), user.getEmail())));
    }

    public record CreateOwnerRequest(String email, String password, String displayName) {
    }

    public record UserCreatedResponse(UUID id, String email) {
    }
}
