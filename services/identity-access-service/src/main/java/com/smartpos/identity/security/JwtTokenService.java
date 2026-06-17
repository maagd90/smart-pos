package com.smartpos.identity.security;

import com.smartpos.identity.domain.DevUser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service responsible for generating JWT tokens.
 *
 * <p>In Milestone 1, tokens are signed with HMAC-SHA256.
 * Production will migrate to RS256 with key rotation.</p>
 */
@Service
public class JwtTokenService {

    private final SecretKey key;
    private final String issuer;
    private final long expirationSeconds;

    /**
     * Creates the token service with the configured secret and issuer.
     *
     * @param secret the HMAC secret (minimum 32 characters)
     * @param issuer the token issuer claim value
     * @param expirationSeconds token validity duration in seconds
     */
    public JwtTokenService(
            @Value("${identity.jwt.secret}") String secret,
            @Value("${identity.jwt.issuer}") String issuer,
            @Value("${identity.jwt.expiration-seconds:3600}") long expirationSeconds) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.issuer = issuer;
        this.expirationSeconds = expirationSeconds;
    }

    /**
     * Generates a JWT token for the given user.
     *
     * @param user the authenticated user
     * @return a signed JWT token string
     */
    public String generateToken(DevUser user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("account_id", user.getAccountId().toString())
                .claim("store_id", user.getStoreId() != null ? user.getStoreId().toString() : "")
                .claim("platform_admin", user.isPlatformAdmin())
                .claim("permissions", user.getPermissions())
                .issuer(issuer)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(expirationSeconds)))
                .signWith(key)
                .compact();
    }

    /**
     * Returns the configured token expiration in seconds.
     *
     * @return expiration duration in seconds
     */
    public long getExpirationSeconds() {
        return expirationSeconds;
    }
}
