package com.smartpos.catalog.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpos.catalog.domain.ProrationTier;
import com.smartpos.catalog.domain.Product;
import com.smartpos.catalog.domain.ResolvedRefundPolicy;
import com.smartpos.catalog.domain.StoreRefundPolicy;
import com.smartpos.catalog.domain.StoreRefundPolicyRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RefundPolicyResolverTest {

    @Mock private StoreRefundPolicyRepository policyRepository;

    private RefundPolicyResolver resolver;

    private final UUID storeId = UUID.randomUUID();
    private final UUID accountId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        resolver = new RefundPolicyResolver(policyRepository, new ObjectMapper());
    }

    @Test
    void resolvesProductOverrideOverStoreDefault() {
        StoreRefundPolicy storePolicy = StoreRefundPolicy.createDefault(storeId, accountId);
        Product product = Product.withFixedPrice(storeId, accountId, "P", "SKU", "C",
                new BigDecimal("100"), new BigDecimal("120"), "AED");
        product.updatePolicy(false, 7, null, null, null, null, null);

        ResolvedRefundPolicy resolved = resolver.resolve(product, storePolicy);

        assertFalse(resolved.refundable());
        assertEquals(7, resolved.refundWindowDays());
        assertTrue(resolved.exchangeable());
        assertEquals(14, resolved.exchangeWindowDays());
    }

    @Test
    void sortsProrationTiersOnWrite() {
        List<ProrationTier> tiers = List.of(
                new ProrationTier(14, BigDecimal.valueOf(50)),
                new ProrationTier(7, BigDecimal.valueOf(100)));
        String json = resolver.validateAndSerializeTiers(tiers);
        assertTrue(json.indexOf("\"withinDays\":7") < json.indexOf("\"withinDays\":14"));
    }

    @Test
    void validatesProrationPctRange() {
        List<ProrationTier> tiers = List.of(new ProrationTier(7, BigDecimal.valueOf(101)));
        assertThrows(IllegalArgumentException.class, () -> resolver.validateAndSerializeTiers(tiers));
    }

    @Test
    void seedsDefaultPolicyWhenMissing() {
        when(policyRepository.save(org.mockito.ArgumentMatchers.any())).thenAnswer(i -> i.getArgument(0));
        StoreRefundPolicy policy = resolver.getOrCreateStorePolicy(storeId, accountId);
        assertTrue(policy.isDefaultRefundable());
        assertEquals(14, policy.getDefaultRefundWindowDays());
    }
}
