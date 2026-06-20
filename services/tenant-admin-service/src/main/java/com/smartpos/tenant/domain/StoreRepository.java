package com.smartpos.tenant.domain;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for managing store persistence.
 */
public interface StoreRepository extends JpaRepository<Store, UUID> {

    /**
     * Finds all stores belonging to the given account.
     *
     * @param accountId the account ID
     * @return list of stores for the account
     */
    List<Store> findByAccountId(UUID accountId);
}
