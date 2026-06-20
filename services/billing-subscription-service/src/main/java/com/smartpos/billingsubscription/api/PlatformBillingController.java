package com.smartpos.billingsubscription.api;

import com.smartpos.billingsubscription.domain.AccountAiEntitlement;
import com.smartpos.billingsubscription.domain.AccountAiEntitlementRepository;
import com.smartpos.billingsubscription.domain.AiKey;
import com.smartpos.billingsubscription.domain.AiKeyRepository;
import com.smartpos.billingsubscription.domain.Plan;
import com.smartpos.billingsubscription.domain.PlanRepository;
import com.smartpos.billingsubscription.service.SubscriptionGateService;
import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.security.RequirePermission;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/platform")
public class PlatformBillingController {

    private final PlanRepository planRepository;
    private final SubscriptionGateService subscriptionGateService;
    private final AiKeyRepository aiKeyRepository;
    private final AccountAiEntitlementRepository aiEntitlementRepository;

    public PlatformBillingController(PlanRepository planRepository,
                                     SubscriptionGateService subscriptionGateService,
                                     AiKeyRepository aiKeyRepository,
                                     AccountAiEntitlementRepository aiEntitlementRepository) {
        this.planRepository = planRepository;
        this.subscriptionGateService = subscriptionGateService;
        this.aiKeyRepository = aiKeyRepository;
        this.aiEntitlementRepository = aiEntitlementRepository;
    }

    @GetMapping("/plans")
    @RequirePermission("accounts.manage")
    public ResponseEntity<ApiEnvelope<List<PlanResponse>>> listPlans() {
        requirePlatformAdmin();
        List<PlanResponse> plans = planRepository.findAllByOrderByNameAsc().stream()
                .map(PlanResponse::from).toList();
        return ResponseEntity.ok(ApiEnvelope.ok(plans));
    }

    @PutMapping("/accounts/{accountId}/plan")
    @RequirePermission("accounts.manage")
    public ResponseEntity<ApiEnvelope<PlanResponse>> assignPlan(
            @PathVariable UUID accountId, @RequestBody AssignPlanRequest request) {
        requirePlatformAdmin();
        Plan plan = planRepository.findById(request.planId())
                .orElseThrow(() -> new IllegalArgumentException("Plan not found"));
        subscriptionGateService.assignPlan(accountId, plan.getId());
        return ResponseEntity.ok(ApiEnvelope.ok(PlanResponse.from(plan)));
    }

    @PutMapping("/accounts/{accountId}/ai-entitlement")
    @RequirePermission("accounts.manage")
    public ResponseEntity<ApiEnvelope<AiEntitlementResponse>> setAiEntitlement(
            @PathVariable UUID accountId, @RequestBody AiEntitlementRequest request) {
        requirePlatformAdmin();
        AccountAiEntitlement ent = aiEntitlementRepository.findById(accountId)
                .orElseGet(() -> new AccountAiEntitlement(accountId, false));
        ent.setAiEnabled(request.aiEnabled());
        aiEntitlementRepository.save(ent);
        return ResponseEntity.ok(ApiEnvelope.ok(new AiEntitlementResponse(accountId, ent.isAiEnabled())));
    }

    @GetMapping("/ai-keys")
    @RequirePermission("accounts.manage")
    public ResponseEntity<ApiEnvelope<AiKeyStatusResponse>> getAiKeyStatus() {
        requirePlatformAdmin();
        return aiKeyRepository.findTopByOrderByRotatedAtDesc()
                .map(key -> ResponseEntity.ok(ApiEnvelope.ok(
                        new AiKeyStatusResponse(key.getLast4(), key.getRotatedAt()))))
                .orElseGet(() -> ResponseEntity.ok(ApiEnvelope.ok(
                        new AiKeyStatusResponse(null, null))));
    }

    @PutMapping("/ai-keys")
    @Transactional
    @RequirePermission("accounts.manage")
    public ResponseEntity<ApiEnvelope<AiKeyStatusResponse>> rotateAiKey(@RequestBody RotateAiKeyRequest request) {
        requirePlatformAdmin();
        if (request == null || request.apiKey() == null || request.apiKey().length() < 4) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "apiKey is required (min 4 chars)")));
        }
        String last4 = request.apiKey().substring(request.apiKey().length() - 4);
        AiKey key = new AiKey(hashKey(request.apiKey()), last4);
        aiKeyRepository.save(key);
        return ResponseEntity.ok(ApiEnvelope.ok(new AiKeyStatusResponse(last4, key.getRotatedAt())));
    }

    private void requirePlatformAdmin() {
        if (!RequestContextHolder.get().platformAdmin()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Platform admin required");
        }
    }

    private String hashKey(String key) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return Base64.getEncoder().encodeToString(digest.digest(key.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public record AssignPlanRequest(UUID planId) {
    }

    public record AiEntitlementRequest(boolean aiEnabled) {
    }

    public record RotateAiKeyRequest(String apiKey) {
    }

    public record PlanResponse(UUID id, String name, int maxStores, int maxUsers, boolean aiEnabled) {
        static PlanResponse from(Plan plan) {
            return new PlanResponse(plan.getId(), plan.getName(), plan.getMaxStores(), plan.getMaxUsers(), plan.isAiEnabled());
        }
    }

    public record AiEntitlementResponse(UUID accountId, boolean aiEnabled) {
    }

    public record AiKeyStatusResponse(String last4, Instant rotatedAt) {
    }
}
