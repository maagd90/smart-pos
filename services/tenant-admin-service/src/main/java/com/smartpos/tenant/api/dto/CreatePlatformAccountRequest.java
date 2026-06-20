package com.smartpos.tenant.api.dto;

public record CreatePlatformAccountRequest(
        String name,
        String currency,
        String locale,
        String ownerEmail,
        String ownerPassword,
        String ownerDisplayName) {
}
