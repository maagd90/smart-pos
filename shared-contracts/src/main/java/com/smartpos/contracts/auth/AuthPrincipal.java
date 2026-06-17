package com.smartpos.contracts.auth;

import java.util.Set;
import java.util.UUID;

public record AuthPrincipal(UUID userId, UUID accountId, UUID storeId, boolean platformAdmin, Set<String> permissions) {}
