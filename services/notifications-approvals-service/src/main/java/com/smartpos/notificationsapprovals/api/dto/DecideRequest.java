package com.smartpos.notificationsapprovals.api.dto;

import com.smartpos.notificationsapprovals.domain.DecidedVia;
import com.smartpos.notificationsapprovals.domain.Decision;
import jakarta.validation.constraints.NotNull;

public record DecideRequest(@NotNull Decision decision, DecidedVia via) {
}
