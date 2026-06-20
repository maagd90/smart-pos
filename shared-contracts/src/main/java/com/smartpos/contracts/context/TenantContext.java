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
        String correlationId,
        boolean accountWideAccess,
        Set<UUID> accessibleStores
) {

    /**
     * Compact constructor for backward compatibility.
     */
    public TenantContext(UUID userId, UUID accountId, UUID storeId, boolean platformAdmin,
                         Set<String> permissions, String correlationId) {
        this(userId, accountId, storeId, platformAdmin, permissions, correlationId, false, Collections.emptySet());
    }

    /**
     * Checks whether this context holds the specified permission.
     */
    public boolean hasPermission(String permission) {
        return permissions != null && permissions.contains(permission);
    }

    /**
     * Checks whether this context has access to the specified store.
     *
     * <p>Platform admins have access to all stores. Users with account-wide access
     * (store_id=NULL role) have access to all stores. Others must have the store
     * in their accessible stores set or match their storeId.</p>
     */
    public boolean hasStoreAccess(UUID requestedStoreId) {
        if (platformAdmin) return true;
        if (accountWideAccess) return true;
        if (accessibleStores != null && accessibleStores.contains(requestedStoreId)) return true;
        return storeId != null && storeId.equals(requestedStoreId);
    }

    /**
     * Creates an empty/anonymous context for unauthenticated requests.
     */
    public static TenantContext anonymous() {
        return new TenantContext(null, null, null, false, Collections.emptySet(), null, false, Collections.emptySet());
    }
}
