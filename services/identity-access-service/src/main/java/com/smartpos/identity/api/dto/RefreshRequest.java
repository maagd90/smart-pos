package com.smartpos.identity.api.dto;

/**
 * Request to refresh an access token.
 */
public record RefreshRequest(String refreshToken) {}
