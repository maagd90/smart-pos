package com.smartpos.gateway.filter;

import com.smartpos.contracts.subscription.SubscriptionGateDecision;
import com.smartpos.gateway.subscription.SubscriptionGateClient;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Global gateway filter that enforces subscription status before forwarding requests.
 *
 * <p>This filter runs after authentication and before routing. It evaluates the
 * subscription gate for every protected business request. Requests to auth, health,
 * and public endpoints are skipped.</p>
 *
 * <p><strong>Milestone 1:</strong> Uses the {@link com.smartpos.gateway.subscription.LocalSubscriptionGateClient}
 * stub which always allows. The filter logic is fully wired so replacing the client
 * activates real enforcement.</p>
 */
@Component
public class SubscriptionGateFilter implements GlobalFilter, Ordered {

    private final SubscriptionGateClient gateClient;

    /**
     * Creates the subscription gate filter.
     *
     * @param gateClient the subscription gate evaluation client
     */
    public SubscriptionGateFilter(SubscriptionGateClient gateClient) {
        this.gateClient = gateClient;
    }

    /**
     * Evaluates the subscription gate for each request and allows or denies access
     * based on the tenant's subscription status.
     *
     * @param exchange the current server exchange
     * @param chain the gateway filter chain
     * @return a {@code Mono<Void>} to indicate when request handling is complete
     */
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        if (isSkippable(path)) {
            return chain.filter(exchange);
        }

        String accountId = exchange.getRequest().getHeaders().getFirst("X-Account-Id");
        String storeId = exchange.getRequest().getHeaders().getFirst("X-Store-Id");
        String method = exchange.getRequest().getMethod().name();

        if (accountId == null || accountId.isBlank()) {
            return chain.filter(exchange);
        }

        return gateClient.evaluate(accountId, storeId, path, method)
                .flatMap(decision -> handleDecision(exchange, chain, decision));
    }

    private boolean isSkippable(String path) {
        return path.startsWith("/actuator")
                || path.startsWith("/api/v1/auth")
                || path.startsWith("/api/v1/platform/health");
    }

    private Mono<Void> handleDecision(ServerWebExchange exchange, GatewayFilterChain chain,
                                       SubscriptionGateDecision decision) {
        return switch (decision.action()) {
            case ALLOW -> chain.filter(exchange);
            case DENY -> {
                exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                yield exchange.getResponse().setComplete();
            }
            case READ_ONLY -> {
                String method = exchange.getRequest().getMethod().name();
                if ("GET".equals(method) || "HEAD".equals(method) || "OPTIONS".equals(method)) {
                    yield chain.filter(exchange);
                }
                exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                yield exchange.getResponse().setComplete();
            }
            case UPGRADE_REQUIRED -> {
                exchange.getResponse().setStatusCode(HttpStatus.PAYMENT_REQUIRED);
                yield exchange.getResponse().setComplete();
            }
        };
    }

    /**
     * Returns the filter order. Runs after authentication (order 10) so that
     * subscription evaluation has access to the tenant context headers.
     *
     * @return the filter order
     */
    @Override
    public int getOrder() {
        return 10;
    }
}
