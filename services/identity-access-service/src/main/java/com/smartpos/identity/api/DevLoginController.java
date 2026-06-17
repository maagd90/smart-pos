package com.smartpos.identity.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.identity.api.dto.DevLoginRequest;
import com.smartpos.identity.api.dto.DevLoginResponse;
import com.smartpos.identity.domain.DevUserRepository;
import com.smartpos.identity.security.JwtTokenService;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Development-only authentication controller.
 *
 * <p><strong>WARNING:</strong> This endpoint is intended for local development
 * and automated testing ONLY. It must NEVER be enabled in production environments.
 * It issues JWT tokens without requiring a password or any credential verification.</p>
 *
 * <p>In production, authentication will be handled through proper OAuth2/OIDC flows
 * with password hashing and MFA support (planned for Milestone 2).</p>
 */
@Profile({"local", "dev"})
@RestController
@RequestMapping("/api/v1/auth")
public class DevLoginController {

    private final DevUserRepository userRepository;
    private final JwtTokenService tokenService;

    /**
     * Creates the dev-login controller.
     *
     * @param userRepository repository for looking up dev users
     * @param tokenService service for generating JWT tokens
     */
    public DevLoginController(DevUserRepository userRepository, JwtTokenService tokenService) {
        this.userRepository = userRepository;
        this.tokenService = tokenService;
    }

    /**
     * Issues a JWT token for local development and testing.
     *
     * <p>This endpoint looks up a pre-seeded user by email and returns a signed
     * JWT token without password verification. It is guarded by the local/dev Spring profiles.</p>
     *
     * @param request the login request containing the user's email
     * @return a JWT access token wrapped in the standard API envelope
     */
    @PostMapping("/dev-login")
    public ResponseEntity<ApiEnvelope<?>> devLogin(@RequestBody DevLoginRequest request) {
        if (request == null || request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "Email is required")));
        }

        return userRepository.findByEmail(request.email())
                .<ResponseEntity<ApiEnvelope<?>>>map(user -> {
                    String token = tokenService.generateToken(user);
                    DevLoginResponse response = new DevLoginResponse(
                            token, "Bearer", tokenService.getExpirationSeconds());
                    return ResponseEntity.ok(ApiEnvelope.ok(response));
                })
                .orElseGet(() -> ResponseEntity.status(404)
                        .body(ApiEnvelope.fail(ApiError.of("USER_NOT_FOUND",
                                "No dev user found with email: " + request.email()))));
    }
}
