package com.smartpos.gateway.subscription;

import com.fasterxml.jackson.databind.JsonNode;
import com.smartpos.contracts.subscription.SubscriptionGateDecision;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
@ConditionalOnProperty(name = "gateway.subscription.remote-enabled", havingValue = "true", matchIfMissing = true)
public class RemoteSubscriptionGateClient implements SubscriptionGateClient {

    private final WebClient webClient;

    public RemoteSubscriptionGateClient(WebClient.Builder builder,
                                        @Value("${gateway.subscription.billing-url:http://billing-subscription-service:8103}") String billingUrl) {
        this.webClient = builder.baseUrl(billingUrl).build();
    }

    @Override
    public Mono<SubscriptionGateDecision> evaluate(String accountId, String storeId, String path, String method) {
        return webClient.post()
                .uri("/api/v1/billing/gate/evaluate")
                .bodyValue(new GateRequest(accountId, storeId, path, method, 0))
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(json -> {
                    JsonNode data = json.get("data");
                    if (data == null) {
                        return SubscriptionGateDecision.allow();
                    }
                    String action = data.get("action").asText();
                    String reason = data.hasNonNull("reason") ? data.get("reason").asText() : null;
                    return switch (action) {
                        case "DENY" -> SubscriptionGateDecision.deny(reason);
                        case "READ_ONLY" -> SubscriptionGateDecision.readOnly(reason);
                        case "UPGRADE_REQUIRED" -> SubscriptionGateDecision.upgradeRequired(reason);
                        default -> SubscriptionGateDecision.allow();
                    };
                })
                .onErrorReturn(SubscriptionGateDecision.allow());
    }

    private record GateRequest(String accountId, String storeId, String path, String method, int currentStoreCount) {
    }
}
