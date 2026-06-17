package com.smartpos.identity.api.dto;

/**
 * Request body for the dev-login endpoint.
 *
 * @param email the email address of the development user
 */
public record DevLoginRequest(String email) {}
