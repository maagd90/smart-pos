package com.smartpos.identity.api.dto;

import com.smartpos.identity.domain.User;
import java.util.UUID;

public record UserResponse(UUID id, String email, String displayName, UUID accountId, String status) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getDisplayName(),
                user.getAccountId(), user.getStatus());
    }
}
