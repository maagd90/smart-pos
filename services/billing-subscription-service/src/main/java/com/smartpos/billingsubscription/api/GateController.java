package com.smartpos.billingsubscription.api;

import com.smartpos.billingsubscription.service.SubscriptionGateService;
import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.subscription.SubscriptionGateDecision;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/billing")
public class GateController {

    private final SubscriptionGateService gateService;

    public GateController(SubscriptionGateService gateService) {
        this.gateService = gateService;
    }

    @PostMapping("/gate/evaluate")
    public ResponseEntity<ApiEnvelope<SubscriptionGateDecision>> evaluate(@RequestBody GateEvaluateRequest request) {
        UUID accountId = request.accountId() != null ? UUID.fromString(request.accountId()) : null;
        SubscriptionGateDecision decision = gateService.evaluate(
                accountId, request.path(), request.method(), request.currentStoreCount());
        return ResponseEntity.ok(ApiEnvelope.ok(decision));
    }

    public record GateEvaluateRequest(String accountId, String storeId, String path, String method, int currentStoreCount) {
    }
}
