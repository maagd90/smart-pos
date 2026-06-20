package com.smartpos.identity.api.dto;

import com.smartpos.identity.domain.Role;
import java.util.UUID;

public record RoleResponse(UUID id, String name, boolean system) {
    public static RoleResponse from(Role role) {
        return new RoleResponse(role.getId(), role.getName(), role.isSystem());
    }
}
