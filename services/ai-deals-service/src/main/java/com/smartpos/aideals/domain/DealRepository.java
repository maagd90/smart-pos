package com.smartpos.aideals.domain;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DealRepository extends JpaRepository<Deal, UUID> {
}
