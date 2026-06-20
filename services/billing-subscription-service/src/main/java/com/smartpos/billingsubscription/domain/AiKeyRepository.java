package com.smartpos.billingsubscription.domain;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiKeyRepository extends JpaRepository<AiKey, UUID> {
    Optional<AiKey> findTopByOrderByRotatedAtDesc();
}
