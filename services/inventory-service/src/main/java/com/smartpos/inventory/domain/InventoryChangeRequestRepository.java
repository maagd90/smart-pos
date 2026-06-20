package com.smartpos.inventory.domain;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryChangeRequestRepository extends JpaRepository<InventoryChangeRequest, UUID> {
}
