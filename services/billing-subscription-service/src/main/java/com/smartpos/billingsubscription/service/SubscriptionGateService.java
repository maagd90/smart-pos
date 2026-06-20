package com.smartpos.billingsubscription.service;

import com.smartpos.billingsubscription.domain.AccountSubscription;
import com.smartpos.billingsubscription.domain.AccountSubscriptionRepository;
import com.smartpos.billingsubscription.domain.Plan;
import com.smartpos.billingsubscription.domain.PlanRepository;
import com.smartpos.contracts.subscription.SubscriptionGateDecision;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class SubscriptionGateService {

    private static final UUID STARTER_PLAN_ID = UUID.fromString("20000000-0000-0000-0000-000000000001");

    private final AccountSubscriptionRepository subscriptionRepository;
    private final PlanRepository planRepository;

    public SubscriptionGateService(AccountSubscriptionRepository subscriptionRepository,
                                     PlanRepository planRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
    }

    public SubscriptionGateDecision evaluate(UUID accountId, String path, String method, int currentStoreCount) {
        if (accountId == null) {
            return SubscriptionGateDecision.allow();
        }

        AccountSubscription subscription = subscriptionRepository.findById(accountId)
                .orElseGet(() -> subscriptionRepository.save(new AccountSubscription(accountId, STARTER_PLAN_ID)));

        if (!"ACTIVE".equals(subscription.getStatus())) {
            return SubscriptionGateDecision.deny("Account subscription is not active");
        }

        Plan plan = planRepository.findById(subscription.getPlanId()).orElse(null);
        if (plan == null) {
            return SubscriptionGateDecision.allow();
        }

        if ("POST".equalsIgnoreCase(method) && path != null && path.matches(".*/accounts/[^/]+/stores/?$")) {
            if (currentStoreCount >= plan.getMaxStores()) {
                return SubscriptionGateDecision.upgradeRequired(
                        "Store limit reached (" + plan.getMaxStores() + "). Upgrade your plan.");
            }
        }

        return SubscriptionGateDecision.allow();
    }

    public Optional<Plan> getPlanForAccount(UUID accountId) {
        return subscriptionRepository.findById(accountId)
                .flatMap(sub -> planRepository.findById(sub.getPlanId()));
    }

    public AccountSubscription assignPlan(UUID accountId, UUID planId) {
        AccountSubscription sub = subscriptionRepository.findById(accountId)
                .orElseGet(() -> new AccountSubscription(accountId, planId));
        sub.setPlanId(planId);
        return subscriptionRepository.save(sub);
    }
}
