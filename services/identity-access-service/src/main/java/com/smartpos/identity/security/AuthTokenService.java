package com.smartpos.identity.security;

import com.smartpos.identity.domain.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * JWT token service for real authentication (Milestone 2).
 *
 * <p>The JWT carries userId, accountId, platformAdmin, and the full permission set.
 * It does NOT bake a single store_id — accessible stores are derived from user_roles.</p>
 */
@Service
public class AuthTokenService {

    private final SecretKey key;
    private final String issuer;
    private final long expirationSeconds;

    public AuthTokenService(
            @Value("${identity.jwt.secret}") String secret,
            @Value("${identity.jwt.issuer}") String issuer,
            @Value("${identity.jwt.expiration-seconds:3600}") long expirationSeconds) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.issuer = issuer;
        this.expirationSeconds = expirationSeconds;
    }

    /**
     * Generates an access token for the authenticated user.
     *
     * @param user the authenticated user
     * @param permissions comma-separated permission keys
     * @param accountWideAccess true if user has account-wide role (store_id=NULL)
     * @param accessibleStores specific store IDs where user has roles
     * @return signed JWT token
     */
    public String generateAccessToken(User user, String permissions, boolean accountWideAccess, Set<UUID> accessibleStores) {
        Instant now = Instant.now();
        String storesClaim = accessibleStores.stream()
                .map(UUID::toString)
                .collect(Collectors.joining(","));

        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("account_id", user.getAccountId().toString())
                .claim("platform_admin", user.isPlatformAdmin())
                .claim("permissions", permissions)
                .claim("account_wide_access", accountWideAccess)
                .claim("accessible_stores", storesClaim)
                .issuer(issuer)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(expirationSeconds)))
                .signWith(key)
                .compact();
    }

    public long getExpirationSeconds() {
        return expirationSeconds;
    }
}
