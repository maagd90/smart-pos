package com.smartpos.notificationsapprovals.api.dto;

import com.smartpos.notificationsapprovals.domain.DecidedVia;
import com.smartpos.notificationsapprovals.domain.Decision;
import com.smartpos.notificationsapprovals.domain.Notification;
import com.smartpos.notificationsapprovals.domain.NotificationKind;
import com.smartpos.notificationsapprovals.domain.NotificationStatus;
import com.smartpos.notificationsapprovals.domain.RefType;
import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        UUID accountId,
        UUID storeId,
        NotificationKind kind,
        RefType refType,
        UUID refId,
        String title,
        String body,
        NotificationStatus status,
        Decision decision,
        DecidedVia decidedVia,
        Instant createdAt,
        Instant expiresAt) {

    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
                n.getId(), n.getAccountId(), n.getStoreId(), n.getKind(), n.getRefType(), n.getRefId(),
                n.getTitle(), n.getBody(), n.getStatus(), n.getDecision(), n.getDecidedVia(),
                n.getCreatedAt(), n.getExpiresAt());
    }
}
