package com.smartpos.catalog.api;

import com.smartpos.catalog.api.dto.ProrationTierRequest;
import com.smartpos.catalog.api.dto.RefundPolicyRequest;
import com.smartpos.catalog.api.dto.RefundPolicyResponse;
import com.smartpos.catalog.domain.ProrationTier;
import com.smartpos.catalog.domain.StoreRefundPolicy;
import com.smartpos.catalog.domain.StoreRefundPolicyRepository;
import com.smartpos.catalog.service.RefundPolicyResolver;
import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.context.TenantContext;
import com.smartpos.contracts.security.RequirePermission;
import com.smartpos.contracts.security.RequireStoreAccess;
import java.math.BigDecimal;
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
@RequestMapping("/api/v1/stores/{storeId}/refund-policy")
@RequireStoreAccess
public class RefundPolicyController {

    private final StoreRefundPolicyRepository policyRepository;
    private final RefundPolicyResolver policyResolver;

    public RefundPolicyController(StoreRefundPolicyRepository policyRepository,
                                  RefundPolicyResolver policyResolver) {
        this.policyRepository = policyRepository;
        this.policyResolver = policyResolver;
    }

    @GetMapping
    @RequirePermission("catalog.view")
    public ResponseEntity<ApiEnvelope<RefundPolicyResponse>> getPolicy(@PathVariable UUID storeId) {
        UUID accountId = requireAccountId();
        if (accountId == null) {
            return unauthorized();
        }
        StoreRefundPolicy policy = policyResolver.getOrCreateStorePolicy(storeId, accountId);
        List<ProrationTier> tiers = policyResolver.parseTiers(policy.getRefundProrationTiersJson());
        return ResponseEntity.ok(ApiEnvelope.ok(RefundPolicyResponse.from(policy, tiers)));
    }

    @PutMapping
    @Transactional
    @RequirePermission("store.refund_policy.manage")
    public ResponseEntity<ApiEnvelope<RefundPolicyResponse>> updatePolicy(
            @PathVariable UUID storeId, @RequestBody RefundPolicyRequest request) {
        UUID accountId = requireAccountId();
        if (accountId == null) {
            return unauthorized();
        }
        if (request == null) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "request body is required")));
        }

        StoreRefundPolicy policy = policyResolver.getOrCreateStorePolicy(storeId, accountId);
        List<ProrationTier> tiers = request.refundProrationTiers() != null
                ? request.refundProrationTiers().stream()
                        .map(t -> new ProrationTier(t.withinDays(), t.refundPct()))
                        .toList()
                : List.of();
        String tiersJson;
        try {
            tiersJson = policyResolver.validateAndSerializeTiers(tiers);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_TIERS", e.getMessage())));
        }

        policy.applyUpdate(
                request.defaultRefundable() != null ? request.defaultRefundable() : policy.isDefaultRefundable(),
                request.defaultRefundWindowDays() != null ? request.defaultRefundWindowDays() : policy.getDefaultRefundWindowDays(),
                request.defaultExchangeable() != null ? request.defaultExchangeable() : policy.isDefaultExchangeable(),
                request.defaultExchangeWindowDays() != null ? request.defaultExchangeWindowDays() : policy.getDefaultExchangeWindowDays(),
                request.restockingFeePct() != null ? request.restockingFeePct() : policy.getRestockingFeePct(),
                request.restockingFeeFlat() != null ? request.restockingFeeFlat() : policy.getRestockingFeeFlat(),
                tiersJson);
        policy = policyRepository.save(policy);
        return ResponseEntity.ok(ApiEnvelope.ok(RefundPolicyResponse.from(policy, tiers)));
    }

    private UUID requireAccountId() {
        return RequestContextHolder.get().accountId();
    }

    private ResponseEntity<ApiEnvelope<RefundPolicyResponse>> unauthorized() {
        return ResponseEntity.status(401)
                .body(ApiEnvelope.fail(ApiError.of("UNAUTHORIZED", "accountId is required in tenant context")));
    }
}
