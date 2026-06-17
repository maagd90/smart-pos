package com.smartpos.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Global filter that ensures every request has a correlation ID for distributed tracing.
 *
 * <p>If the incoming request already has an X-Correlation-Id header, it is preserved.
 * Otherwise, a new UUID is generated and added to both the request and response.</p>
 */
@Component
public class CorrelationIdFilter implements GlobalFilter, Ordered {

    private static final String CORRELATION_HEADER = "X-Correlation-Id";

    /**
     * Filters each request to ensure a correlation ID is present.
     *
     * @param exchange the current server exchange
     * @param chain the gateway filter chain
     * @return a {@code Mono<Void>} to indicate when request handling is complete
     */
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String correlationId = exchange.getRequest().getHeaders().getFirst(CORRELATION_HEADER);

        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
            ServerHttpRequest mutated = exchange.getRequest().mutate()
                    .header(CORRELATION_HEADER, correlationId)
                    .build();
            exchange = exchange.mutate().request(mutated).build();
        }

        exchange.getResponse().getHeaders().add(CORRELATION_HEADER, correlationId);
        return chain.filter(exchange);
    }

    /**
     * Returns the filter order. Runs early (order -10) to ensure correlation ID
     * is available to all subsequent filters and services.
     *
     * @return the filter order
     */
    @Override
    public int getOrder() {
        return -10;
    }
}
