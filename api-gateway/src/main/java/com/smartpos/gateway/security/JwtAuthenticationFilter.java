package com.smartpos.gateway.security;

import io.jsonwebtoken.Claims;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Web filter that extracts and validates JWT tokens from incoming requests.
 *
 * <p>When a valid token is found in the Authorization header, this filter
 * sets up the Spring Security authentication context and mutates the request
 * to include forwarded identity headers for downstream services.</p>
 *
 * <p>Forwarded headers:</p>
 * <ul>
 *   <li>X-User-Id - the authenticated user's UUID</li>
 *   <li>X-Account-Id - the user's tenant account UUID</li>
 *   <li>X-Store-Id - the store context from the token (if present)</li>
 *   <li>X-Platform-Admin - whether the user is a platform administrator</li>
 *   <li>X-Permissions - comma-separated permission keys</li>
 *   <li>X-Correlation-Id - unique request correlation identifier</li>
 * </ul>
 */
@Component
public class JwtAuthenticationFilter implements WebFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtValidator jwtValidator;

    /**
     * Creates the authentication filter.
     *
     * @param jwtValidator the JWT token validator
     */
    public JwtAuthenticationFilter(JwtValidator jwtValidator) {
        this.jwtValidator = jwtValidator;
    }

    /**
     * Filters each request to extract and validate JWT tokens, setting up
     * the security context and forwarding identity headers to downstream services.
     *
     * @param exchange the current server exchange
     * @param chain the web filter chain
     * @return a {@code Mono<Void>} to indicate when request handling is complete
     */
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            return chain.filter(exchange);
        }

        String token = authHeader.substring(BEARER_PREFIX.length());
        Optional<Claims> claimsOpt = jwtValidator.validate(token);

        if (claimsOpt.isEmpty()) {
            return chain.filter(exchange);
        }

        Claims claims = claimsOpt.get();
        String userId = claims.getSubject();
        String accountId = claims.get("account_id", String.class);
        String storeId = claims.get("store_id", String.class);
        String platformAdmin = String.valueOf(claims.get("platform_admin", Boolean.class));
        String permissions = claims.get("permissions", String.class);

        List<SimpleGrantedAuthority> authorities = permissions != null
                ? Arrays.stream(permissions.split(","))
                    .map(p -> new SimpleGrantedAuthority("PERMISSION_" + p))
                    .collect(Collectors.toList())
                : List.of();

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userId, null, authorities);

        String correlationId = Optional.ofNullable(
                exchange.getRequest().getHeaders().getFirst("X-Correlation-Id"))
                .orElse(java.util.UUID.randomUUID().toString());

        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                .header("X-User-Id", userId != null ? userId : "")
                .header("X-Account-Id", accountId != null ? accountId : "")
                .header("X-Store-Id", storeId != null ? storeId : "")
                .header("X-Platform-Admin", platformAdmin)
                .header("X-Permissions", permissions != null ? permissions : "")
                .header("X-Correlation-Id", correlationId)
                .build();

        ServerWebExchange mutatedExchange = exchange.mutate().request(mutatedRequest).build();

        return chain.filter(mutatedExchange)
                .contextWrite(ReactiveSecurityContextHolder.withAuthentication(auth));
    }
}
