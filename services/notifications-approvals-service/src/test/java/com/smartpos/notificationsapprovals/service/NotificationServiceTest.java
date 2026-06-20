package com.smartpos.notificationsapprovals.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartpos.notificationsapprovals.config.NotificationsProperties;
import com.smartpos.notificationsapprovals.domain.Notification;
import com.smartpos.notificationsapprovals.domain.NotificationKind;
import com.smartpos.notificationsapprovals.domain.NotificationRepository;
import com.smartpos.notificationsapprovals.domain.RefType;
import com.smartpos.notificationsapprovals.integration.IdentityClient.ApprovalRecipient;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private RecipientResolver recipientResolver;
    @Mock
    private ActionTokenService actionTokenService;
    @Mock
    private ExpoPushDeliveryService pushDeliveryService;
    @Mock
    private EmailDeliveryService emailDeliveryService;

    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        NotificationsProperties properties = new NotificationsProperties();
        notificationService = new NotificationService(
                notificationRepository,
                properties,
                recipientResolver,
                actionTokenService,
                pushDeliveryService,
                emailDeliveryService);
    }

    @Test
    void createFromEventSkipsExistingNotificationWithoutDelivering() {
        UUID accountId = UUID.randomUUID();
        UUID storeId = UUID.randomUUID();
        UUID refId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        when(recipientResolver.resolve(accountId, storeId))
                .thenReturn(List.of(new ApprovalRecipient(userId, "manager@example.com", java.util.Set.of())));
        when(notificationRepository.findByKindAndRefTypeAndRefIdAndRecipientUserId(
                NotificationKind.DEAL_APPROVAL, RefType.deal, refId, userId))
                .thenReturn(Optional.of(new Notification(
                        accountId, storeId, userId, NotificationKind.DEAL_APPROVAL,
                        RefType.deal, refId, "Title", "Body",
                        java.time.Instant.now().plusSeconds(3600))));

        notificationService.createFromEvent(
                NotificationKind.DEAL_APPROVAL, RefType.deal, refId, accountId, storeId, "Deal summary");

        verify(notificationRepository, never()).save(any());
        verify(pushDeliveryService, never()).send(any());
        verify(emailDeliveryService, never()).send(any(), any(), any(), any());
    }

    @Test
    void createFromEventDeliversOnceForNewNotification() {
        UUID accountId = UUID.randomUUID();
        UUID storeId = UUID.randomUUID();
        UUID refId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        when(recipientResolver.resolve(accountId, storeId))
                .thenReturn(List.of(new ApprovalRecipient(userId, "manager@example.com", java.util.Set.of())));
        when(notificationRepository.findByKindAndRefTypeAndRefIdAndRecipientUserId(
                eq(NotificationKind.INVENTORY_CHANGE_APPROVAL), eq(RefType.inventory_change), eq(refId), eq(userId)))
                .thenReturn(Optional.empty());
        when(notificationRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(actionTokenService.createToken(any(), any())).thenReturn("token");

        notificationService.createFromEvent(
                NotificationKind.INVENTORY_CHANGE_APPROVAL, RefType.inventory_change, refId,
                accountId, storeId, "Inventory summary");

        verify(notificationRepository, times(1)).save(any());
        verify(pushDeliveryService, times(1)).send(any());
        verify(emailDeliveryService, times(1)).send(any(), eq("manager@example.com"), any(), any());
    }

    @Test
    void createFromEventSkipsDeliveryWhenUniqueConstraintViolated() {
        UUID accountId = UUID.randomUUID();
        UUID storeId = UUID.randomUUID();
        UUID refId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        when(recipientResolver.resolve(accountId, storeId))
                .thenReturn(List.of(new ApprovalRecipient(userId, "manager@example.com", java.util.Set.of())));
        when(notificationRepository.findByKindAndRefTypeAndRefIdAndRecipientUserId(
                eq(NotificationKind.DEAL_APPROVAL), eq(RefType.deal), eq(refId), eq(userId)))
                .thenReturn(Optional.empty());
        when(notificationRepository.save(any())).thenThrow(new DataIntegrityViolationException("duplicate"));

        notificationService.createFromEvent(
                NotificationKind.DEAL_APPROVAL, RefType.deal, refId, accountId, storeId, "Deal summary");

        verify(pushDeliveryService, never()).send(any());
        verify(emailDeliveryService, never()).send(any(), any(), any(), any());
    }
}
