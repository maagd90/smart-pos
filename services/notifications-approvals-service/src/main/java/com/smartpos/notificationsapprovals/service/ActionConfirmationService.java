package com.smartpos.notificationsapprovals.service;

import com.smartpos.notificationsapprovals.domain.ActionToken;
import com.smartpos.notificationsapprovals.domain.DecidedVia;
import com.smartpos.notificationsapprovals.domain.Notification;
import com.smartpos.notificationsapprovals.domain.NotificationRepository;
import com.smartpos.notificationsapprovals.domain.NotificationStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActionConfirmationService {

    private final ActionTokenService actionTokenService;
    private final NotificationRepository notificationRepository;
    private final DecisionExecutor decisionExecutor;

    public ActionConfirmationService(ActionTokenService actionTokenService,
                                     NotificationRepository notificationRepository,
                                     DecisionExecutor decisionExecutor) {
        this.actionTokenService = actionTokenService;
        this.notificationRepository = notificationRepository;
        this.decisionExecutor = decisionExecutor;
    }

    @Transactional
    public DecisionExecutor.DecisionResult confirm(String rawToken) {
        ActionToken token = actionTokenService.lookupValid(rawToken);
        if (token == null) {
            return DecisionExecutor.DecisionResult.failed("This link is invalid, already used, or has expired.");
        }
        Notification notification = notificationRepository.findById(token.getNotificationId()).orElse(null);
        if (notification == null) {
            return DecisionExecutor.DecisionResult.failed("Notification not found.");
        }
        if (notification.getStatus() == NotificationStatus.DECIDED) {
            return DecisionExecutor.DecisionResult.already(
                    "This was already " + notification.getDecision().name().toLowerCase() + ".");
        }
        DecisionExecutor.DecisionResult result = decisionExecutor.execute(
                notification, token.getAction(), DecidedVia.EMAIL);
        if (result.success() && !result.alreadyDecided()) {
            actionTokenService.markUsed(token);
        }
        return result;
    }
}
