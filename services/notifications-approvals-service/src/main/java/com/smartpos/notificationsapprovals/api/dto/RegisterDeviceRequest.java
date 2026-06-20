package com.smartpos.notificationsapprovals.api.dto;

import jakarta.validation.constraints.NotBlank;

public record RegisterDeviceRequest(
        @NotBlank String expoPushToken,
        @NotBlank String platform) {
}
