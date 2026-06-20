package com.smartpos.identity.api.dto;

import java.util.UUID;

/**
 * Request to register a new user.
 */
public record RegisterRequest(String email, String password, String displayName, UUID accountId) {}
