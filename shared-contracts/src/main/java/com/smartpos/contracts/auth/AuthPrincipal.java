package com.smartpos.contracts.auth;

import java.util.Set;
import java.util.UUID;

/**
 * Represents the authenticated user principal extracted from a validated JWT.
 *
 * <p>Carried through gateway-forwarded headers and available to every service
 * for authorization and tenant-scoping decisions.</p>
 *
 * @param userId        the unique identifier of the authenticated user
 * @param accountId     the tenant account the user belongs to
 * @param storeId       the store context for the current request (may be null for account-wide ops)
 * @param platformAdmin whether the user has platform-level administrative privileges
 * @param permissions   the set of permission keys granted to this user in the current context
 */
public record AuthPrincipal(
        UUID userId,
        UUID accountId,
        UUID storeId,
        boolean platformAdmin,
        Set<String> permissions
) {}
