package com.smartpos.tenant.api.dto;

/**
 * Request to create a new tenant account.
 *
 * @param name the account name
 * @param currency the default currency code (e.g., "AED")
 * @param locale the default locale (e.g., "en-AE")
 */
public record CreateAccountRequest(String name, String currency, String locale) {}
