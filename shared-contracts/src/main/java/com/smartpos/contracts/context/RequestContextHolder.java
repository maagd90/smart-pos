package com.smartpos.contracts.context;

/**
 * Thread-local holder for the current request's tenant context.
 *
 * <p>Set by the request context filter at the beginning of each request
 * and cleared after the response is sent. Services access the current
 * tenant context through this holder for authorization and data-scoping.</p>
 */
public final class RequestContextHolder {

    private static final ThreadLocal<TenantContext> CONTEXT = new ThreadLocal<>();

    private RequestContextHolder() {}

    /**
     * Returns the tenant context for the current request.
     *
     * @return the current TenantContext, or anonymous if none is set
     */
    public static TenantContext get() {
        TenantContext ctx = CONTEXT.get();
        return ctx != null ? ctx : TenantContext.anonymous();
    }

    /**
     * Sets the tenant context for the current request.
     *
     * @param context the context to associate with this thread
     */
    public static void set(TenantContext context) {
        CONTEXT.set(context);
    }

    /**
     * Clears the tenant context. Must be called after request processing completes.
     */
    public static void clear() {
        CONTEXT.remove();
    }

    /**
     * Verifies the current user holds the required permission.
     *
     * @param permission the permission key to check
     * @throws SecurityException if the permission is not held
     */
    public static void requirePermission(String permission) {
        TenantContext ctx = get();
        if (ctx.platformAdmin()) return;
        if (!ctx.hasPermission(permission)) {
            throw new SecurityException("Missing required permission: " + permission);
        }
    }

    /**
     * Verifies the current user has access to the specified store.
     *
     * @param storeId the store to verify access for
     * @throws SecurityException if store access is denied
     */
    public static void requireStoreAccess(java.util.UUID storeId) {
        TenantContext ctx = get();
        if (!ctx.hasStoreAccess(storeId)) {
            throw new SecurityException("Access denied to store: " + storeId);
        }
    }
}
