package com.smartpos.tenant.api.dto;

/**
 * Request to create a new store under an account.
 *
 * @param name the store name
 * @param timezone the store timezone (e.g., "Asia/Dubai")
 */
public record CreateStoreRequest(String name, String timezone) {}
