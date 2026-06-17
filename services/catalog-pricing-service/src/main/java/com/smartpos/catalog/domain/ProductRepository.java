package com.smartpos.catalog.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for managing product persistence.
 */
public interface ProductRepository extends JpaRepository<Product, UUID> {

    /**
     * Finds all products belonging to a store.
     *
     * @param storeId the store ID
     * @return list of products in the store
     */
    List<Product> findByStoreId(UUID storeId);

    /**
     * Finds a specific product by ID and store ID.
     *
     * @param id the product ID
     * @param storeId the store ID
     * @return the product if found
     */
    Optional<Product> findByIdAndStoreId(UUID id, UUID storeId);
}
