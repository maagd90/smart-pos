package com.smartpos.gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

/**
 * Redis-backed rate limiting configuration for the API gateway.
 *
 * <p>Configures key resolvers that determine how rate limit buckets are assigned.
 * When an authenticated user is present (X-User-Id header populated by JWT filter),
 * the user ID is used as the bucket key. For unauthenticated requests, the remote
 * address is used as fallback.</p>
 *
 * <p>Rate limit values are configured in application.yml per route:</p>
 * <ul>
 *   <li>Auth routes: stricter limits (default 10 req/sec, burst 20)</li>
 *   <li>General API routes: standard limits (default 50 req/sec, burst 100)</li>
 * </ul>
 */
@Configuration
public class RateLimitConfig {

    /**
     * Key resolver that uses the authenticated user ID when available,
     * falling back to the client's remote IP address.
     *
     * @return the configured key resolver
     */
    @Bean
    public KeyResolver userOrIpKeyResolver() {
        return exchange -> {
            String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
            if (userId != null && !userId.isBlank()) {
                return Mono.just(userId);
            }
            String remoteAddr = exchange.getRequest().getRemoteAddress() != null
                    ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                    : "unknown";
            return Mono.just(remoteAddr);
        };
    }
}
