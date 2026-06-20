package com.smartpos.notificationsapprovals.api;

import com.smartpos.notificationsapprovals.domain.ActionToken;
import com.smartpos.notificationsapprovals.domain.DecidedVia;
import com.smartpos.notificationsapprovals.domain.Decision;
import com.smartpos.notificationsapprovals.domain.Notification;
import com.smartpos.notificationsapprovals.domain.NotificationRepository;
import com.smartpos.notificationsapprovals.domain.NotificationStatus;
import com.smartpos.notificationsapprovals.service.ActionConfirmationService;
import com.smartpos.notificationsapprovals.service.ActionTokenService;
import com.smartpos.notificationsapprovals.service.DecisionExecutor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/api/v1/notifications/actions")
public class NotificationActionController {

    private final ActionTokenService actionTokenService;
    private final NotificationRepository notificationRepository;
    private final ActionConfirmationService actionConfirmationService;

    public NotificationActionController(ActionTokenService actionTokenService,
                                        NotificationRepository notificationRepository,
                                        ActionConfirmationService actionConfirmationService) {
        this.actionTokenService = actionTokenService;
        this.notificationRepository = notificationRepository;
        this.actionConfirmationService = actionConfirmationService;
    }

    @GetMapping(value = "/{rawToken}", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String showConfirmation(@PathVariable String rawToken) {
        ActionToken token = actionTokenService.lookupValid(rawToken);
        if (token == null) {
            return terminalPage("This link is invalid or has expired.");
        }
        Notification notification = notificationRepository.findById(token.getNotificationId()).orElse(null);
        if (notification == null) {
            return terminalPage("Notification not found.");
        }
        if (notification.getStatus() == NotificationStatus.DECIDED) {
            return terminalPage("This was already " + notification.getDecision().name().toLowerCase() + ".");
        }
        if (notification.getStatus() == NotificationStatus.EXPIRED || !notification.isPending()) {
            return terminalPage("This link has expired.");
        }
        String actionLabel = token.getAction() == Decision.ACCEPT ? "approve" : "reject";
        return """
                <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Confirm %s</title></head>
                <body style="font-family:sans-serif;max-width:520px;margin:2rem auto;">
                <h1>Confirm %s</h1>
                <p><strong>%s</strong></p>
                <p>%s</p>
                <form method="post" action="/api/v1/notifications/actions/%s/confirm">
                  <button type="submit">Confirm %s</button>
                </form>
                </body></html>
                """.formatted(actionLabel, actionLabel, notification.getTitle(), notification.getBody(),
                rawToken, actionLabel);
    }

    @PostMapping(value = "/{rawToken}/confirm", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String confirm(@PathVariable String rawToken) {
        DecisionExecutor.DecisionResult result = actionConfirmationService.confirm(rawToken);
        return terminalPage(result.message());
    }

    private String terminalPage(String message) {
        return """
                <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Notification</title></head>
                <body style="font-family:sans-serif;max-width:520px;margin:2rem auto;">
                <p>%s</p>
                </body></html>
                """.formatted(message);
    }
}
