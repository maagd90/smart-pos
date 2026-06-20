package com.smartpos.refunds.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpos.refunds.domain.ExchangeRepository;
import com.smartpos.refunds.domain.RefundedQuantityRepository;
import com.smartpos.refunds.domain.RefundRepository;
import com.smartpos.refunds.integration.CatalogClient;
import com.smartpos.refunds.integration.SalesClient;
import com.smartpos.refunds.integration.TenantClient;
import com.smartpos.refunds.outbox.OutboxRepository;
import com.smartpos.refunds.service.ExchangeSagaService;
import com.smartpos.refunds.service.RefundEligibilityService;
import com.smartpos.refunds.service.RefundPricingService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RefundServiceConfig {

    @Bean
    public RefundPricingService refundPricingService(ObjectMapper objectMapper) {
        return new RefundPricingService(objectMapper);
    }

    @Bean
    public RefundEligibilityService refundEligibilityService(
            RefundedQuantityRepository refundedQuantityRepository,
            RefundPricingService refundPricingService) {
        return new RefundEligibilityService(refundedQuantityRepository, refundPricingService);
    }

    @Bean
    public ExchangeSagaService exchangeSagaService(
            ExchangeRepository exchangeRepository,
            RefundRepository refundRepository,
            RefundedQuantityRepository refundedQuantityRepository,
            OutboxRepository outboxRepository,
            SalesClient salesClient,
            CatalogClient catalogClient,
            TenantClient tenantClient,
            RefundEligibilityService eligibilityService,
            RefundPricingService pricingService) {
        return new ExchangeSagaService(exchangeRepository, refundRepository, refundedQuantityRepository,
                outboxRepository, salesClient, catalogClient, tenantClient, eligibilityService, pricingService);
    }
}
