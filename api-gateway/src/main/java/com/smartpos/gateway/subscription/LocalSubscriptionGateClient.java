package com.smartpos.gateway.subscription;

import com.smartpos.contracts.subscription.SubscriptionGateDecision;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Local stub implementation of the subscription gate.
 *
 * <p><strong>Milestone 1 stub:</strong> This implementation always returns ALLOW.
 * It exists to establish the gate pattern and interface contract so that when
 * the billing-subscription-service is built (Milestone 7), it can be replaced
 * with a remote call without changing the filter or gateway routing logic.</p>
 *
 * <p>Future behavior will check:</p>
 * <ul>
 *   <li>Subscription status (active, trial, past_due, cancelled)</li>
 *   <li>Entitlement limits (max_stores, max_users, feature flags)</li>
 *   <li>Read-only mode for grace periods</li>
 * </ul>
 */
@Component
@ConditionalOnProperty(name = "gateway.subscription.remote-enabled", havingValue = "false")
public class LocalSubscriptionGateClient implements SubscriptionGateClient {

    @Override
    public Mono<SubscriptionGateDecision> evaluate(String accountId, String storeId, String path, String method) {
        // Milestone 1: always allow. Real checks start in Milestone 7.
        return Mono.just(SubscriptionGateDecision.allow());
    }
}
