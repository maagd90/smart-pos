package com.smartpos.billingsubscription.domain;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountSubscriptionRepository extends JpaRepository<AccountSubscription, UUID> {
}
