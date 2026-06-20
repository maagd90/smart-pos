package com.smartpos.notificationsapprovals.domain;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationDecisionAuditRepository extends JpaRepository<NotificationDecisionAudit, UUID> {
}
