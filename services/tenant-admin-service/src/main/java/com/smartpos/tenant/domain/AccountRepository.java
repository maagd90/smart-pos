package com.smartpos.tenant.domain;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for managing tenant account persistence.
 */
public interface AccountRepository extends JpaRepository<Account, UUID> {}
