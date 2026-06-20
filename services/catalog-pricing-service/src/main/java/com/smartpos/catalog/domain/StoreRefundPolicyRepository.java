package com.smartpos.catalog.domain;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreRefundPolicyRepository extends JpaRepository<StoreRefundPolicy, UUID> {

    Optional<StoreRefundPolicy> findByStoreIdAndAccountId(UUID storeId, UUID accountId);
}
