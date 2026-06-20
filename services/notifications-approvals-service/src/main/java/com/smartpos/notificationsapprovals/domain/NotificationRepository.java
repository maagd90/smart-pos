package com.smartpos.notificationsapprovals.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Optional<Notification> findByKindAndRefTypeAndRefIdAndRecipientUserId(
            NotificationKind kind, RefType refType, UUID refId, UUID recipientUserId);

    List<Notification> findByRecipientUserIdAndStatusOrderByCreatedAtDesc(
            UUID recipientUserId, NotificationStatus status);
}
