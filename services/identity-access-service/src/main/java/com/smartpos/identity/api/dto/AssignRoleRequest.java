package com.smartpos.identity.api.dto;

import java.util.UUID;

public record AssignRoleRequest(UUID roleId, UUID storeId) {
}
