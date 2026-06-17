package com.smartpos.contracts.context;

import java.util.Collections;
import java.util.Set;
import java.util.UUID;

/**
 * Immutable tenant and user context for the current request.
 *
 * <p>Populated from gateway-forwarded headers by the request context filter
 * in each service. Provides all information needed for tenant-scoped data access
 * and permission enforcement.</p>
 */
public record TenantContext(
        UUID userId,
        UUID accountId,
        UUID storeId,
        boolean platformAdmin,
        Set<String> permissions,
        String correlationId
) {

    /**
     * Checks whether this context holds the specified permission.
     *
     * @param permission the permission key to check
     * @return true if the permission is present
     */
    public boolean hasPermission(String permission) {
        return permissions != null && permissions.contains(permission);
    }

    /**
     * Checks whether this context has access to the specified store.
     *
     * <p>Platform admins have access to all stores. Other users must have
     * their storeId match the requested store.</p>
     *
     * @param requestedStoreId the store to verify access for
     * @return true if access is allowed
     */
    public boolean hasStoreAccess(UUID requestedStoreId) {
        if (platformAdmin) return true;
        return storeId != null && storeId.equals(requestedStoreId);
    }

    /**
     * Creates an empty/anonymous context for unauthenticated requests.
     *
     * @return a context with no user, account, or permissions
     */
    public static TenantContext anonymous() {
        return new TenantContext(null, null, null, false, Collections.emptySet(), null);
    }
}
