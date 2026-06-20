package com.smartpos.reporting.domain;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreReportSettingsRepository extends JpaRepository<StoreReportSettings, UUID> {
    Optional<StoreReportSettings> findByStoreIdAndAccountId(UUID storeId, UUID accountId);
}
