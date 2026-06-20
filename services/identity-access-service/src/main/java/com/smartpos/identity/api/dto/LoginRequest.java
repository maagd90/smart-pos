package com.smartpos.identity.api.dto;

/**
 * Request to log in with email and password.
 */
public record LoginRequest(String email, String password) {}
