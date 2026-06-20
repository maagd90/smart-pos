package com.smartpos.tenant.domain;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreSettingsRepository extends JpaRepository<StoreSettings, UUID> {
    Optional<StoreSettings> findByStoreIdAndAccountId(UUID storeId, UUID accountId);
}
