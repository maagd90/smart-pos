package com.smartpos.identity.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.context.TenantContext;
import com.smartpos.identity.api.dto.MeResponse;
import com.smartpos.identity.domain.PermissionRepository;
import com.smartpos.identity.domain.User;
import com.smartpos.identity.domain.UserRepository;
import com.smartpos.identity.service.AccessibleStoresService;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class MeController {

    private final UserRepository userRepository;
    private final PermissionRepository permissionRepository;
    private final AccessibleStoresService accessibleStoresService;

    public MeController(UserRepository userRepository,
                        PermissionRepository permissionRepository,
                        AccessibleStoresService accessibleStoresService) {
        this.userRepository = userRepository;
        this.permissionRepository = permissionRepository;
        this.accessibleStoresService = accessibleStoresService;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiEnvelope<MeResponse>> me() {
        TenantContext context = RequestContextHolder.get();
        if (context.userId() == null) {
            return ResponseEntity.status(401)
                    .body(ApiEnvelope.fail(ApiError.of("UNAUTHORIZED", "Authentication required")));
        }

        User user = userRepository.findById(context.userId()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401)
                    .body(ApiEnvelope.fail(ApiError.of("USER_NOT_FOUND", "User not found")));
        }

        Set<String> permissions = permissionRepository.findPermissionKeysByUserId(user.getId());
        AccessibleStoresService.AccessibleStoresResult stores = accessibleStoresService.resolve(user.getId());

        MeResponse response = new MeResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getAccountId(),
                permissions,
                stores.storeIds(),
                stores.accountWideAccess(),
                user.isPlatformAdmin());

        return ResponseEntity.ok(ApiEnvelope.ok(response));
    }
}
