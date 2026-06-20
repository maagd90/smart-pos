package com.smartpos.identity.service;

import com.smartpos.identity.domain.AuditLog;
import com.smartpos.identity.domain.AuditLogRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;

/**
 * Writes immutable audit log entries for authentication and authorization events.
 */
@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Creates the audit service.
     *
     * @param auditLogRepository persistence for audit records
     */
    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Persists an audit log entry.
     *
     * @param accountId tenant account identifier
     * @param userId acting user identifier
     * @param action action key
     * @param resourceType resource type label
     * @param resourceId resource identifier
     * @param details optional detail payload
     * @param ipAddress client IP when known
     */
    public void record(UUID accountId, UUID userId, String action, String resourceType,
                       UUID resourceId, String details, String ipAddress) {
        auditLogRepository.save(new AuditLog(accountId, userId, action, resourceType, resourceId,
                toJsonDetails(details), ipAddress));
    }

    private String toJsonDetails(String details) {
        if (details == null) {
            return null;
        }
        String escaped = details.replace("\\", "\\\\").replace("\"", "\\\"");
        return "{\"message\":\"" + escaped + "\"}";
    }
}
