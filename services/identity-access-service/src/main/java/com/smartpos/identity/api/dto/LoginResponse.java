package com.smartpos.identity.api.dto;

import java.util.Set;
import java.util.UUID;

/**
 * Login response with access token, refresh token, and user context.
 */
public record LoginResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        Set<String> permissions,
        Set<UUID> accessibleStores,
        boolean accountWideAccess
) {}
