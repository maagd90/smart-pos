package com.smartpos.identity.api.dto;

/**
 * Response body for the dev-login endpoint.
 *
 * @param accessToken the JWT access token
 * @param tokenType the token type (always "Bearer")
 * @param expiresIn the token validity in seconds
 */
public record DevLoginResponse(String accessToken, String tokenType, long expiresIn) {}
