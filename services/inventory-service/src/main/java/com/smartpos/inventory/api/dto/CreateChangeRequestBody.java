package com.smartpos.inventory.api.dto;

import java.util.UUID;

public record CreateChangeRequestBody(UUID productId, int quantity, String summary) {
}
