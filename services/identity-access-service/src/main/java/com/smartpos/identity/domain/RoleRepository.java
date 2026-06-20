package com.smartpos.identity.domain;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for role management.
 */
public interface RoleRepository extends JpaRepository<Role, UUID> {

    List<Role> findByAccountId(UUID accountId);

    /**
     * Finds system template roles (account_id = all-zeros).
     */
    List<Role> findByAccountIdAndSystemTrue(UUID accountId);
}
