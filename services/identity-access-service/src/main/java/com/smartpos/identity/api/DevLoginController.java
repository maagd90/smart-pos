package com.smartpos.identity.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.identity.api.dto.DevLoginRequest;
import com.smartpos.identity.api.dto.DevLoginResponse;
import com.smartpos.identity.domain.PermissionRepository;
import com.smartpos.identity.domain.User;
import com.smartpos.identity.domain.UserRepository;
import com.smartpos.identity.domain.UserRole;
import com.smartpos.identity.domain.UserRoleRepository;
import com.smartpos.identity.security.AuthTokenService;
import com.smartpos.identity.service.AuditService;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Profile({"local", "dev"})
@RestController
@RequestMapping("/api/v1/auth")
public class DevLoginController {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PermissionRepository permissionRepository;
    private final AuthTokenService tokenService;
    private final AuditService auditService;

    public DevLoginController(UserRepository userRepository,
                              UserRoleRepository userRoleRepository,
                              PermissionRepository permissionRepository,
                              AuthTokenService tokenService,
                              AuditService auditService) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.permissionRepository = permissionRepository;
        this.tokenService = tokenService;
        this.auditService = auditService;
    }

    @PostMapping("/dev-login")
    public ResponseEntity<ApiEnvelope<?>> devLogin(@RequestBody DevLoginRequest request) {
        if (request == null || request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "Email is required")));
        }

        return userRepository.findByEmail(request.email())
                .<ResponseEntity<ApiEnvelope<?>>>map(user -> issueDevToken(user))
                .orElseGet(() -> ResponseEntity.status(404)
                        .body(ApiEnvelope.fail(ApiError.of("USER_NOT_FOUND",
                                "No dev user found with email: " + request.email()))));
    }

    private ResponseEntity<ApiEnvelope<?>> issueDevToken(User user) {
        Set<String> permissions = permissionRepository.findPermissionKeysByUserId(user.getId());
        List<UserRole> roles = userRoleRepository.findByUserId(user.getId());
        boolean hasAccountWideRole = roles.stream().anyMatch(r -> r.getStoreId() == null);
        Set<UUID> accessibleStores = roles.stream()
                .filter(r -> r.getStoreId() != null)
                .map(UserRole::getStoreId)
                .collect(Collectors.toSet());

        String permissionStr = String.join(",", permissions);
        String accessToken = tokenService.generateAccessToken(user, permissionStr, hasAccountWideRole, accessibleStores);

        auditService.record(user.getAccountId(), user.getId(), "auth.dev_login", "user", user.getId(),
                "Dev login for " + user.getEmail(), null);

        DevLoginResponse response = new DevLoginResponse(
                accessToken, "Bearer", tokenService.getExpirationSeconds());
        return ResponseEntity.ok(ApiEnvelope.ok(response));
    }
}
