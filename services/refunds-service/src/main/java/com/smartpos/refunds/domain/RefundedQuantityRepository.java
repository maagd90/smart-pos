package com.smartpos.refunds.domain;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefundedQuantityRepository extends JpaRepository<RefundedQuantity, UUID> {

    Optional<RefundedQuantity> findByStoreIdAndSaleIdAndProductId(UUID storeId, UUID saleId, UUID productId);
}
