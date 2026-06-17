package com.smartpos.identity.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.context.TenantContext;
import com.smartpos.identity.domain.UserRole;
import com.smartpos.identity.domain.UserRoleRepository;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint for resolving the current user's accessible stores (B3).
 *
 * <p>Accessible stores = stores where user holds a role + all stores in account
 * if user has an account-wide role (store_id = NULL).</p>
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AccessibleStoresController {

    private final UserRoleRepository userRoleRepository;

    public AccessibleStoresController(UserRoleRepository userRoleRepository) {
        this.userRoleRepository = userRoleRepository;
    }

    @GetMapping("/accessible-stores")
    public ResponseEntity<ApiEnvelope<?>> getAccessibleStores() {
        TenantContext context = RequestContextHolder.get();
        if (context.userId() == null) {
            return ResponseEntity.status(401)
                    .body(ApiEnvelope.fail(ApiError.of("UNAUTHORIZED", "Authentication required")));
        }

        List<UserRole> roles = userRoleRepository.findByUserId(context.userId());
        boolean accountWide = roles.stream().anyMatch(r -> r.getStoreId() == null);
        Set<UUID> storeIds = roles.stream()
                .filter(r -> r.getStoreId() != null)
                .map(UserRole::getStoreId)
                .collect(Collectors.toSet());

        record AccessibleStoresResponse(boolean accountWideAccess, Set<UUID> storeIds) {}
        return ResponseEntity.ok(ApiEnvelope.ok(new AccessibleStoresResponse(accountWide, storeIds)));
    }
}
