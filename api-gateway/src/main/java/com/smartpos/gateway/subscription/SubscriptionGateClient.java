package com.smartpos.gateway.subscription;

import com.smartpos.contracts.subscription.SubscriptionGateDecision;
import reactor.core.publisher.Mono;

/**
 * Client interface for evaluating subscription status before processing requests.
 *
 * <p>The subscription gate ensures that only accounts with valid, active subscriptions
 * can access business endpoints. Different implementations can be swapped:</p>
 * <ul>
 *   <li>{@link LocalSubscriptionGateClient} - Milestone 1 stub that always allows</li>
 *   <li>Remote client - calls billing-subscription-service (Milestone 7)</li>
 * </ul>
 */
public interface SubscriptionGateClient {

    /**
     * Evaluates whether the given account/store may proceed with the request.
     *
     * @param accountId the tenant account identifier
     * @param storeId   the store context (may be null)
     * @param path      the request path being accessed
     * @param method    the HTTP method
     * @return the gate decision
     */
    Mono<SubscriptionGateDecision> evaluate(String accountId, String storeId, String path, String method);
}
