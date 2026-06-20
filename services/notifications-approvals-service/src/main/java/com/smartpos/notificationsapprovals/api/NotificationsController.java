package com.smartpos.notificationsapprovals.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.security.RequirePermission;
import com.smartpos.notificationsapprovals.api.dto.DecideRequest;
import com.smartpos.notificationsapprovals.api.dto.NotificationResponse;
import com.smartpos.notificationsapprovals.domain.DecidedVia;
import com.smartpos.notificationsapprovals.domain.Notification;
import com.smartpos.notificationsapprovals.domain.NotificationKind;
import com.smartpos.notificationsapprovals.domain.NotificationStatus;
import com.smartpos.notificationsapprovals.service.DecisionExecutor;
import com.smartpos.notificationsapprovals.service.NotificationService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationsController {

    private final NotificationService notificationService;
    private final DecisionExecutor decisionExecutor;

    public NotificationsController(NotificationService notificationService, DecisionExecutor decisionExecutor) {
        this.notificationService = notificationService;
        this.decisionExecutor = decisionExecutor;
    }

    @GetMapping
    public ResponseEntity<ApiEnvelope<List<NotificationResponse>>> list(
            @RequestParam(defaultValue = "PENDING") NotificationStatus status) {
        UUID userId = requireUserId();
        List<NotificationResponse> items = notificationService.listInbox(userId, status).stream()
                .filter(this::canAccessStore)
                .map(NotificationResponse::from)
                .toList();
        return ResponseEntity.ok(ApiEnvelope.ok(items));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiEnvelope<NotificationResponse>> get(@PathVariable UUID id) {
        UUID userId = requireUserId();
        Notification notification = notificationService.getForRecipient(id, userId);
        if (!canAccessStore(notification)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(ApiEnvelope.ok(NotificationResponse.from(notification)));
    }

    @PostMapping("/{id}/decide")
    public ResponseEntity<ApiEnvelope<DecisionResponse>> decide(
            @PathVariable UUID id, @RequestBody DecideRequest request) {
        UUID userId = requireUserId();
        Notification notification = notificationService.getForRecipient(id, userId);
        if (!canAccessStore(notification)) {
            return ResponseEntity.status(403).build();
        }
        requirePermissionForKind(notification.getKind());
        DecidedVia via = request.via() != null ? request.via() : DecidedVia.MOBILE;
        DecisionExecutor.DecisionResult result = decisionExecutor.execute(
                notification, request.decision(), via);
        if (!result.success()) {
            return ResponseEntity.badRequest().body(ApiEnvelope.fail(
                    com.smartpos.contracts.api.ApiError.of("DECISION_FAILED", result.message())));
        }
        return ResponseEntity.ok(ApiEnvelope.ok(new DecisionResponse(result.message(), result.alreadyDecided())));
    }

    private void requirePermissionForKind(NotificationKind kind) {
        String permission = kind == NotificationKind.DEAL_APPROVAL ? "deal.approve" : "inventory.change.approve";
        if (!RequestContextHolder.get().platformAdmin()
                && !RequestContextHolder.get().hasPermission(permission)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Missing permission: " + permission);
        }
    }

    private boolean canAccessStore(Notification notification) {
        var ctx = RequestContextHolder.get();
        if (ctx.platformAdmin() || ctx.accountWideAccess()) {
            return true;
        }
        return ctx.accessibleStores() != null && ctx.accessibleStores().contains(notification.getStoreId());
    }

    private UUID requireUserId() {
        UUID userId = RequestContextHolder.get().userId();
        if (userId == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return userId;
    }

    public record DecisionResponse(String message, boolean alreadyDecided) {
    }
}
