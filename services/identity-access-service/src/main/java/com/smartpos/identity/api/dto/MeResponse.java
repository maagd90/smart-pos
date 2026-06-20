package com.smartpos.identity.api.dto;

import java.util.Set;
import java.util.UUID;

public record MeResponse(
        UUID userId,
        String email,
        String displayName,
        UUID accountId,
        Set<String> permissions,
        Set<UUID> accessibleStores,
        boolean accountWideAccess,
        boolean platformAdmin) {
}
