package com.smartpos.contracts.auth;

import java.util.UUID;

/**
 * Request payload for verifying whether a user holds a specific permission.
 *
 * <p>Used for inter-service permission verification calls to the Identity service.</p>
 *
 * @param userId     the user whose permissions are being checked
 * @param accountId  the tenant account scope
 * @param storeId    the store scope (null for account-wide checks)
 * @param permission the permission key to verify (e.g. "sale.create")
 */
public record PermissionCheckRequest(
        UUID userId,
        UUID accountId,
        UUID storeId,
        String permission
) {}
