package com.smartpos.identity.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.security.RequirePermission;
import com.smartpos.identity.api.dto.AssignRoleRequest;
import com.smartpos.identity.api.dto.CreateUserRequest;
import com.smartpos.identity.api.dto.RoleResponse;
import com.smartpos.identity.api.dto.UserResponse;
import com.smartpos.identity.domain.User;
import com.smartpos.identity.domain.UserRole;
import com.smartpos.identity.service.UserManagementService;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/accounts/{accountId}")
public class UsersController {

    private final UserManagementService userManagementService;

    public UsersController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @GetMapping("/users")
    @RequirePermission("users.view")
    public ResponseEntity<ApiEnvelope<List<UserResponse>>> listUsers(@PathVariable UUID accountId) {
        if (!canAccessAccount(accountId)) {
            return forbidden();
        }
        List<UserResponse> users = userManagementService.listUsers(accountId).stream()
                .map(UserResponse::from).toList();
        return ResponseEntity.ok(ApiEnvelope.ok(users));
    }

    @PostMapping("/users")
    @RequirePermission("users.manage")
    public ResponseEntity<ApiEnvelope<UserResponse>> createUser(
            @PathVariable UUID accountId, @RequestBody CreateUserRequest request) {
        if (!canAccessAccount(accountId)) {
            return forbidden();
        }
        if (request == null || request.email() == null || request.password() == null) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "email and password are required")));
        }
        try {
            User user = userManagementService.createUser(
                    accountId, request.email(), request.displayName(), request.password());
            return ResponseEntity.created(URI.create("/api/v1/accounts/" + accountId + "/users/" + user.getId()))
                    .body(ApiEnvelope.ok(UserResponse.from(user)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", e.getMessage())));
        }
    }

    @GetMapping("/roles")
    @RequirePermission("users.view")
    public ResponseEntity<ApiEnvelope<List<RoleResponse>>> listRoles(@PathVariable UUID accountId) {
        if (!canAccessAccount(accountId)) {
            return forbidden();
        }
        List<RoleResponse> roles = userManagementService.listRoles(accountId).stream()
                .map(RoleResponse::from).toList();
        return ResponseEntity.ok(ApiEnvelope.ok(roles));
    }

    @PostMapping("/users/{userId}/roles")
    @RequirePermission("users.manage")
    public ResponseEntity<ApiEnvelope<RoleAssignmentResponse>> assignRole(
            @PathVariable UUID accountId,
            @PathVariable UUID userId,
            @RequestBody AssignRoleRequest request) {
        if (!canAccessAccount(accountId)) {
            return forbidden();
        }
        if (request == null || request.roleId() == null) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "roleId is required")));
        }
        try {
            UserRole assignment = userManagementService.assignRole(
                    accountId, userId, request.roleId(), request.storeId());
            return ResponseEntity.ok(ApiEnvelope.ok(new RoleAssignmentResponse(
                    assignment.getUserId(), assignment.getRoleId(), assignment.getStoreId())));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", e.getMessage())));
        }
    }

    private boolean canAccessAccount(UUID accountId) {
        var ctx = RequestContextHolder.get();
        return ctx.platformAdmin() || (ctx.accountId() != null && ctx.accountId().equals(accountId));
    }

    private <T> ResponseEntity<ApiEnvelope<T>> forbidden() {
        return ResponseEntity.status(403)
                .body(ApiEnvelope.fail(ApiError.of("FORBIDDEN", "Access denied to account")));
    }

    public record RoleAssignmentResponse(UUID userId, UUID roleId, UUID storeId) {
    }
}
