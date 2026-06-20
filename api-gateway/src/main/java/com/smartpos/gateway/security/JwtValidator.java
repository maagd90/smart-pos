package com.smartpos.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

/**
 * Validates JWT tokens using HMAC-SHA256 signatures.
 *
 * <p>Uses the configured issuer and secret to verify token authenticity.
 * The secret must be at least 32 characters for HMAC-SHA256.</p>
 *
 * <p><strong>Milestone 1:</strong> Uses symmetric HMAC validation. Production
 * deployments should migrate to asymmetric RS256 with key rotation.</p>
 */
@Component
public class JwtValidator {

    private final SecretKey signingKey;
    private final String issuer;

    /**
     * Creates the JWT validator with the configured secret and issuer.
     *
     * @param secret the HMAC signing secret (minimum 32 characters)
     * @param issuer the expected token issuer claim
     */
    public JwtValidator(
            @Value("${gateway.jwt.secret}") String secret,
            @Value("${gateway.jwt.issuer}") String issuer) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.issuer = issuer;
    }

    /**
     * Validates the given JWT token and extracts its claims.
     *
     * @param token the raw JWT string (without "Bearer " prefix)
     * @return the token claims if valid, empty if invalid or expired
     */
    public Optional<Claims> validate(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .requireIssuer(issuer)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.of(claims);
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
