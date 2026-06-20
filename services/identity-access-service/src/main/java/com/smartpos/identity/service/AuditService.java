package com.smartpos.identity.service;

import com.smartpos.identity.domain.AuditLog;
import com.smartpos.identity.domain.AuditLogRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void record(UUID accountId, UUID userId, String action, String resourceType, UUID resourceId, String details, String ipAddress) {
        auditLogRepository.save(new AuditLog(accountId, userId, action, resourceType, resourceId, details, ipAddress));
    }
}
