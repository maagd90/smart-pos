package com.smartpos.identity.api.dto;

import java.util.Set;
import java.util.UUID;

public record ApprovalRecipientResponse(UUID userId, String email, Set<String> permissions) {
}
