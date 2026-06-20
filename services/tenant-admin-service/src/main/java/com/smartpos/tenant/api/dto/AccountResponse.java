package com.smartpos.tenant.api.dto;

import com.smartpos.tenant.domain.Account;
import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO representing a tenant account.
 *
 * @param id the account ID
 * @param name the account name
 * @param currency the default currency
 * @param locale the default locale
 * @param status the account status
 * @param createdAt when the account was created
 */
public record AccountResponse(UUID id, String name, String currency, String locale, String status, Instant createdAt) {

    /**
     * Creates a response from a domain entity.
     *
     * @param account the account entity
     * @return the response DTO
     */
    public static AccountResponse from(Account account) {
        return new AccountResponse(
                account.getId(),
                account.getName(),
                account.getCurrency(),
                account.getLocale(),
                account.getStatus(),
                account.getCreatedAt());
    }
}
