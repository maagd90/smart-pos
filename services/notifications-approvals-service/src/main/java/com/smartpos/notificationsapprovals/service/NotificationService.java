package com.smartpos.notificationsapprovals.service;

import com.smartpos.notificationsapprovals.config.NotificationsProperties;
import com.smartpos.notificationsapprovals.domain.Decision;
import com.smartpos.notificationsapprovals.domain.DeviceRegistration;
import com.smartpos.notificationsapprovals.domain.DeviceRegistrationRepository;
import com.smartpos.notificationsapprovals.domain.Notification;
import com.smartpos.notificationsapprovals.domain.NotificationKind;
import com.smartpos.notificationsapprovals.domain.NotificationRepository;
import com.smartpos.notificationsapprovals.domain.NotificationStatus;
import com.smartpos.notificationsapprovals.domain.RefType;
import com.smartpos.notificationsapprovals.integration.IdentityClient.ApprovalRecipient;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final NotificationsProperties properties;
    private final RecipientResolver recipientResolver;
    private final ActionTokenService actionTokenService;
    private final ExpoPushDeliveryService pushDeliveryService;
    private final EmailDeliveryService emailDeliveryService;

    public NotificationService(NotificationRepository notificationRepository,
                               NotificationsProperties properties,
                               RecipientResolver recipientResolver,
                               ActionTokenService actionTokenService,
                               ExpoPushDeliveryService pushDeliveryService,
                               EmailDeliveryService emailDeliveryService) {
        this.notificationRepository = notificationRepository;
        this.properties = properties;
        this.recipientResolver = recipientResolver;
        this.actionTokenService = actionTokenService;
        this.pushDeliveryService = pushDeliveryService;
        this.emailDeliveryService = emailDeliveryService;
    }

    @Transactional
    public void createFromEvent(NotificationKind kind, RefType refType, UUID refId,
                                UUID accountId, UUID storeId, String summary) {
        Instant expiresAt = Instant.now().plus(properties.getTtlDays(), ChronoUnit.DAYS);
        String title = NotificationContentBuilder.buildTitle(kind, summary);
        String body = NotificationContentBuilder.buildBody(kind, summary);

        List<ApprovalRecipient> recipients = recipientResolver.resolve(accountId, storeId);
        for (ApprovalRecipient recipient : recipients) {
            if (notificationRepository.findByKindAndRefTypeAndRefIdAndRecipientUserId(
                    kind, refType, refId, recipient.userId()).isPresent()) {
                continue;
            }
            Notification notification = new Notification(
                    accountId, storeId, recipient.userId(), kind, refType, refId, title, body, expiresAt);
            try {
                notificationRepository.save(notification);
            } catch (DataIntegrityViolationException e) {
                log.debug("Skipping duplicate notification for {} {} {} recipient {}",
                        kind, refType, refId, recipient.userId());
                continue;
            }
            deliver(notification, recipient.email());
        }
    }

    private void deliver(Notification notification, String email) {
        try {
            String acceptToken = actionTokenService.createToken(notification, Decision.ACCEPT);
            String rejectToken = actionTokenService.createToken(notification, Decision.REJECT);
            pushDeliveryService.send(notification);
            emailDeliveryService.send(notification, email, acceptToken, rejectToken);
        } catch (Exception e) {
            log.warn("Delivery failed for notification {}: {}", notification.getId(), e.getMessage());
        }
    }

    public List<Notification> listInbox(UUID userId, NotificationStatus status) {
        return notificationRepository.findByRecipientUserIdAndStatusOrderByCreatedAtDesc(userId, status);
    }

    public Notification getForRecipient(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (!notification.getRecipientUserId().equals(userId)) {
            throw new SecurityException("Access denied");
        }
        return notification;
    }
}
