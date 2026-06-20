package com.smartpos.identity.domain;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for looking up users by email during dev-login flow.
 */
public interface DevUserRepository extends JpaRepository<DevUser, UUID> {

    /**
     * Finds a user by their email address.
     *
     * @param email the email address to search for
     * @return an optional containing the user if found
     */
    Optional<DevUser> findByEmail(String email);
}
