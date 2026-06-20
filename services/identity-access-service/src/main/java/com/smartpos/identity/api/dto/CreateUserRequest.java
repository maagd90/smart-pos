package com.smartpos.identity.api.dto;

import java.util.UUID;

public record CreateUserRequest(String email, String password, String displayName) {
}
