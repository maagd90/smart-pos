package com.smartpos.identity.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.identity.api.dto.LoginRequest;
import com.smartpos.identity.api.dto.LoginResponse;
import com.smartpos.identity.api.dto.RefreshRequest;
import com.smartpos.identity.api.dto.RegisterRequest;
import com.smartpos.identity.domain.PermissionRepository;
import com.smartpos.identity.domain.RefreshToken;
import com.smartpos.identity.domain.RefreshTokenRepository;
import com.smartpos.identity.domain.User;
import com.smartpos.identity.domain.UserRepository;
import com.smartpos.identity.domain.UserRole;
import com.smartpos.identity.domain.UserRoleRepository;
import com.smartpos.identity.security.AuthTokenService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Production authentication controller with bcrypt password hashing and JWT issue/refresh.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRoleRepository userRoleRepository;
    private final PermissionRepository permissionRepository;
    private final AuthTokenService tokenService;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository,
                          RefreshTokenRepository refreshTokenRepository,
                          UserRoleRepository userRoleRepository,
                          PermissionRepository permissionRepository,
                          AuthTokenService tokenService,
                          BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRoleRepository = userRoleRepository;
        this.permissionRepository = permissionRepository;
        this.tokenService = tokenService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Registers a new user with bcrypt password hashing.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiEnvelope<?>> register(@RequestBody RegisterRequest request) {
        if (request == null || request.email() == null || request.password() == null || request.accountId() == null) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "email, password, and accountId are required")));
        }

        if (userRepository.findByEmail(request.email()).isPresent()) {
            return ResponseEntity.status(409)
                    .body(ApiEnvelope.fail(ApiError.of("USER_EXISTS", "User with this email already exists")));
        }

        String hashedPassword = passwordEncoder.encode(request.password());
        User user = new User(request.accountId(), request.email(), request.displayName(), hashedPassword);
        userRepository.save(user);

        return ResponseEntity.status(201)
                .body(ApiEnvelope.ok(new UserCreatedResponse(user.getId(), user.getEmail())));
    }

    /**
     * Authenticates with email/password and issues JWT access + refresh tokens.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiEnvelope<?>> login(@RequestBody LoginRequest request) {
        if (request == null || request.email() == null || request.password() == null) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "email and password are required")));
        }

        return userRepository.findByEmail(request.email())
                .<ResponseEntity<ApiEnvelope<?>>>map(user -> {
                    if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
                        return ResponseEntity.status(401)
                                .body(ApiEnvelope.fail(ApiError.of("INVALID_CREDENTIALS", "Invalid email or password")));
                    }

                    if (!"ACTIVE".equals(user.getStatus())) {
                        return ResponseEntity.status(403)
                                .body(ApiEnvelope.fail(ApiError.of("ACCOUNT_DISABLED", "Account is disabled")));
                    }

                    // Resolve permissions from user_roles
                    Set<String> permissions = permissionRepository.findPermissionKeysByUserId(user.getId());

                    // Resolve accessible stores from user_roles (B3)
                    List<UserRole> roles = userRoleRepository.findByUserId(user.getId());
                    boolean hasAccountWideRole = roles.stream().anyMatch(r -> r.getStoreId() == null);
                    Set<UUID> accessibleStores = roles.stream()
                            .filter(r -> r.getStoreId() != null)
                            .map(UserRole::getStoreId)
                            .collect(Collectors.toSet());

                    String permissionStr = String.join(",", permissions);
                    String accessToken = tokenService.generateAccessToken(user, permissionStr, hasAccountWideRole, accessibleStores);

                    // Issue refresh token
                    String refreshTokenRaw = UUID.randomUUID().toString();
                    String refreshHash = hashToken(refreshTokenRaw);
                    Instant refreshExpiry = Instant.now().plusSeconds(7 * 24 * 3600); // 7 days
                    RefreshToken refreshToken = new RefreshToken(user.getId(), refreshHash, refreshExpiry);
                    refreshTokenRepository.save(refreshToken);

                    LoginResponse response = new LoginResponse(
                            accessToken, refreshTokenRaw, "Bearer",
                            tokenService.getExpirationSeconds(),
                            permissions, accessibleStores, hasAccountWideRole);
                    return ResponseEntity.ok(ApiEnvelope.ok(response));
                })
                .orElseGet(() -> ResponseEntity.status(401)
                        .body(ApiEnvelope.fail(ApiError.of("INVALID_CREDENTIALS", "Invalid email or password"))));
    }

    /**
     * Refreshes an access token using a refresh token.
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiEnvelope<?>> refresh(@RequestBody RefreshRequest request) {
        if (request == null || request.refreshToken() == null) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "refreshToken is required")));
        }

        String hash = hashToken(request.refreshToken());
        return refreshTokenRepository.findByTokenHash(hash)
                .<ResponseEntity<ApiEnvelope<?>>>map(token -> {
                    if (token.isRevoked() || token.isExpired()) {
                        return ResponseEntity.status(401)
                                .body(ApiEnvelope.fail(ApiError.of("TOKEN_EXPIRED", "Refresh token is expired or revoked")));
                    }

                    User user = userRepository.findById(token.getUserId()).orElse(null);
                    if (user == null) {
                        return ResponseEntity.status(401)
                                .body(ApiEnvelope.fail(ApiError.of("USER_NOT_FOUND", "User not found")));
                    }

                    Set<String> permissions = permissionRepository.findPermissionKeysByUserId(user.getId());
                    List<UserRole> roles = userRoleRepository.findByUserId(user.getId());
                    boolean hasAccountWideRole = roles.stream().anyMatch(r -> r.getStoreId() == null);
                    Set<UUID> accessibleStores = roles.stream()
                            .filter(r -> r.getStoreId() != null)
                            .map(UserRole::getStoreId)
                            .collect(Collectors.toSet());

                    String permissionStr = String.join(",", permissions);
                    String accessToken = tokenService.generateAccessToken(user, permissionStr, hasAccountWideRole, accessibleStores);

                    // Rotate refresh token
                    token.revoke();
                    refreshTokenRepository.save(token);

                    String newRefreshRaw = UUID.randomUUID().toString();
                    String newHash = hashToken(newRefreshRaw);
                    RefreshToken newToken = new RefreshToken(user.getId(), newHash, Instant.now().plusSeconds(7 * 24 * 3600));
                    refreshTokenRepository.save(newToken);

                    LoginResponse response = new LoginResponse(
                            accessToken, newRefreshRaw, "Bearer",
                            tokenService.getExpirationSeconds(),
                            permissions, accessibleStores, hasAccountWideRole);
                    return ResponseEntity.ok(ApiEnvelope.ok(response));
                })
                .orElseGet(() -> ResponseEntity.status(401)
                        .body(ApiEnvelope.fail(ApiError.of("INVALID_TOKEN", "Invalid refresh token"))));
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash token", e);
        }
    }

    public record UserCreatedResponse(UUID id, String email) {}
}
