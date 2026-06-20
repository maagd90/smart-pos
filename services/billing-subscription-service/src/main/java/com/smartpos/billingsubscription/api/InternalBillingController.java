package com.smartpos.billingsubscription.api;

import com.smartpos.billingsubscription.service.SubscriptionGateService;
import com.smartpos.contracts.api.ApiEnvelope;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/accounts")
public class InternalBillingController {

    private static final UUID STARTER_PLAN_ID = UUID.fromString("20000000-0000-0000-0000-000000000001");

    private final SubscriptionGateService subscriptionGateService;

    public InternalBillingController(SubscriptionGateService subscriptionGateService) {
        this.subscriptionGateService = subscriptionGateService;
    }

    @PostMapping("/{accountId}/default-plan")
    public ResponseEntity<ApiEnvelope<String>> assignDefaultPlan(@PathVariable UUID accountId) {
        subscriptionGateService.assignPlan(accountId, STARTER_PLAN_ID);
        return ResponseEntity.ok(ApiEnvelope.ok("assigned"));
    }
}
