package com.smartpos.identity.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.context.TenantContext;
import com.smartpos.identity.service.AccessibleStoresService;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/accounts")
public class AccountAccessibleStoresController {

    private final AccessibleStoresService accessibleStoresService;

    public AccountAccessibleStoresController(AccessibleStoresService accessibleStoresService) {
        this.accessibleStoresService = accessibleStoresService;
    }

    @GetMapping("/{accountId}/accessible-stores")
    public ResponseEntity<ApiEnvelope<AccessibleStoresResponse>> getAccessibleStores(
            @PathVariable UUID accountId) {
        TenantContext context = RequestContextHolder.get();
        if (context.userId() == null) {
            return ResponseEntity.status(401)
                    .body(ApiEnvelope.fail(ApiError.of("UNAUTHORIZED", "Authentication required")));
        }
        if (!context.platformAdmin() && (context.accountId() == null || !context.accountId().equals(accountId))) {
            return ResponseEntity.status(403)
                    .body(ApiEnvelope.fail(ApiError.of("FORBIDDEN", "Access denied to account")));
        }

        AccessibleStoresService.AccessibleStoresResult result =
                accessibleStoresService.resolve(context.userId());
        return ResponseEntity.ok(ApiEnvelope.ok(
                new AccessibleStoresResponse(result.accountWideAccess(), result.storeIds())));
    }

    public record AccessibleStoresResponse(boolean accountWideAccess, java.util.Set<UUID> storeIds) {
    }
}
