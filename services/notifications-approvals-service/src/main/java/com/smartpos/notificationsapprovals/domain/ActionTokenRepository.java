package com.smartpos.notificationsapprovals.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActionTokenRepository extends JpaRepository<ActionToken, byte[]> {

    List<ActionToken> findByNotificationId(UUID notificationId);

    Optional<ActionToken> findByTokenHash(byte[] tokenHash);
}
