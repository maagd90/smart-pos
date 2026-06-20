package com.smartpos.notificationsapprovals.service;

import com.smartpos.notificationsapprovals.config.NotificationsProperties;
import com.smartpos.notificationsapprovals.domain.DecidedVia;
import com.smartpos.notificationsapprovals.domain.Decision;
import com.smartpos.notificationsapprovals.domain.Notification;
import com.smartpos.notificationsapprovals.domain.NotificationDecisionAudit;
import com.smartpos.notificationsapprovals.domain.NotificationDecisionAuditRepository;
import com.smartpos.notificationsapprovals.domain.NotificationRepository;
import com.smartpos.notificationsapprovals.domain.NotificationStatus;
import com.smartpos.notificationsapprovals.integration.IdentityClient.ApprovalRecipient;
import com.smartpos.notificationsapprovals.integration.OwningServiceClient;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DecisionExecutor {

    public record DecisionResult(boolean success, String message, boolean alreadyDecided) {
        public static DecisionResult ok(String message) {
            return new DecisionResult(true, message, false);
        }

        public static DecisionResult already(String message) {
            return new DecisionResult(true, message, true);
        }

        public static DecisionResult failed(String message) {
            return new DecisionResult(false, message, false);
        }
    }

    private final NotificationRepository notificationRepository;
    private final NotificationDecisionAuditRepository auditRepository;
    private final OwningServiceClient owningServiceClient;
    private final RecipientResolver recipientResolver;

    public DecisionExecutor(NotificationRepository notificationRepository,
                            NotificationDecisionAuditRepository auditRepository,
                            OwningServiceClient owningServiceClient,
                            RecipientResolver recipientResolver) {
        this.notificationRepository = notificationRepository;
        this.auditRepository = auditRepository;
        this.owningServiceClient = owningServiceClient;
        this.recipientResolver = recipientResolver;
    }

    @Transactional
    public DecisionResult execute(Notification notification, Decision decision, DecidedVia via) {
        if (notification.getStatus() == NotificationStatus.DECIDED) {
            return DecisionResult.already("This was already " + notification.getDecision().name().toLowerCase() + ".");
        }
        if (notification.getStatus() == NotificationStatus.EXPIRED
                || !notification.isPending()) {
            return DecisionResult.failed("This notification has expired.");
        }

        Set<String> permissions = resolvePermissions(notification);
        try {
            owningServiceClient.executeDecision(notification, notification.getRecipientUserId(), permissions, decision);
        } catch (Exception e) {
            return DecisionResult.failed("Could not apply decision. Please try again.");
        }

        notification.markDecided(decision, via);
        notificationRepository.save(notification);
        auditRepository.save(new NotificationDecisionAudit(
                notification.getId(), notification.getRecipientUserId(), notification.getRefType(),
                notification.getRefId(), decision, via));
        return DecisionResult.ok(decision == Decision.ACCEPT ? "Approved successfully." : "Rejected successfully.");
    }

    private Set<String> resolvePermissions(Notification notification) {
        List<ApprovalRecipient> recipients = recipientResolver.resolve(
                notification.getAccountId(), notification.getStoreId());
        return recipients.stream()
                .filter(r -> r.userId().equals(notification.getRecipientUserId()))
                .findFirst()
                .map(ApprovalRecipient::permissions)
                .orElse(Set.of());
    }
}
