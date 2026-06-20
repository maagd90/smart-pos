package com.smartpos.catalog.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpos.catalog.domain.ProrationTier;
import com.smartpos.catalog.domain.Product;
import com.smartpos.catalog.domain.ResolvedRefundPolicy;
import com.smartpos.catalog.domain.StoreRefundPolicy;
import com.smartpos.catalog.domain.StoreRefundPolicyRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RefundPolicyResolver {

    private final StoreRefundPolicyRepository policyRepository;
    private final ObjectMapper objectMapper;

    public RefundPolicyResolver(StoreRefundPolicyRepository policyRepository, ObjectMapper objectMapper) {
        this.policyRepository = policyRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public StoreRefundPolicy getOrCreateStorePolicy(UUID storeId, UUID accountId) {
        return policyRepository.findByStoreIdAndAccountId(storeId, accountId)
                .orElseGet(() -> policyRepository.save(StoreRefundPolicy.createDefault(storeId, accountId)));
    }

    public ResolvedRefundPolicy resolve(Product product, StoreRefundPolicy storePolicy) {
        boolean refundable = product.getRefundable() != null
                ? product.getRefundable() : storePolicy.isDefaultRefundable();
        int refundWindowDays = product.getRefundWindowDays() != null
                ? product.getRefundWindowDays() : storePolicy.getDefaultRefundWindowDays();
        boolean exchangeable = product.getExchangeable() != null
                ? product.getExchangeable() : storePolicy.isDefaultExchangeable();
        int exchangeWindowDays = product.getExchangeWindowDays() != null
                ? product.getExchangeWindowDays() : storePolicy.getDefaultExchangeWindowDays();
        BigDecimal restockingFeePct = product.getRestockingFeePct() != null
                ? product.getRestockingFeePct() : storePolicy.getRestockingFeePct();
        BigDecimal restockingFeeFlat = product.getRestockingFeeFlat() != null
                ? product.getRestockingFeeFlat() : storePolicy.getRestockingFeeFlat();
        String tiersJson = product.getRefundProrationTiersJson() != null
                ? product.getRefundProrationTiersJson() : storePolicy.getRefundProrationTiersJson();

        return new ResolvedRefundPolicy(
                product.getCostPrice(),
                refundable,
                refundWindowDays,
                exchangeable,
                exchangeWindowDays,
                restockingFeePct,
                restockingFeeFlat,
                parseTiers(tiersJson));
    }

    public List<ProrationTier> parseTiers(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            List<ProrationTier> tiers = objectMapper.readValue(json, new TypeReference<>() {});
            return tiers.stream()
                    .sorted(Comparator.comparingInt(ProrationTier::withinDays))
                    .toList();
        } catch (Exception e) {
            return List.of();
        }
    }

    public String validateAndSerializeTiers(List<ProrationTier> tiers) {
        if (tiers == null || tiers.isEmpty()) {
            return "[]";
        }
        List<ProrationTier> sorted = new ArrayList<>(tiers);
        sorted.sort(Comparator.comparingInt(ProrationTier::withinDays));
        int prevDays = 0;
        for (ProrationTier tier : sorted) {
            if (tier.withinDays() <= 0) {
                throw new IllegalArgumentException("withinDays must be > 0");
            }
            if (tier.refundPct().compareTo(BigDecimal.ZERO) < 0
                    || tier.refundPct().compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new IllegalArgumentException("refundPct must be between 0 and 100");
            }
            if (tier.withinDays() <= prevDays) {
                throw new IllegalArgumentException("tiers must be sorted ascending by withinDays");
            }
            prevDays = tier.withinDays();
        }
        try {
            return objectMapper.writeValueAsString(sorted);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid proration tiers", e);
        }
    }
}
