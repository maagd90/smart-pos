package com.smartpos.inventory.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * Represents a single inventory movement in the append-only stock ledger.
 *
 * <p>Current stock for a product is computed as the sum of signed quantities
 * across all movements for that product in a store.</p>
 *
 * <p>Movement types and their signs:</p>
 * <ul>
 *   <li>receive: positive (stock in)</li>
 *   <li>sale: negative (stock out)</li>
 *   <li>return: positive (stock in from refund)</li>
 *   <li>adjust: positive or negative (manual correction)</li>
 * </ul>
 */
@Entity
@Table(name = "inventory_movements")
public class InventoryMovement {

    @Id
    private UUID id;

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "movement_type", nullable = false)
    private String movementType;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "reference_type")
    private String referenceType;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    /** Default constructor required by JPA. */
    protected InventoryMovement() {}

    /**
     * Creates a new inventory movement.
     *
     * @param storeId the store where movement occurred
     * @param accountId the owning account
     * @param productId the product being moved
     * @param movementType the type (receive, sale, return, adjust)
     * @param quantity the signed quantity
     * @param referenceType optional reference type (e.g., "sale", "refund")
     * @param referenceId optional reference ID
     */
    public InventoryMovement(UUID storeId, UUID accountId, UUID productId,
                             String movementType, int quantity,
                             String referenceType, UUID referenceId) {
        this.id = UUID.randomUUID();
        this.storeId = storeId;
        this.accountId = accountId;
        this.productId = productId;
        this.movementType = movementType;
        this.quantity = quantity;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getStoreId() { return storeId; }
    public UUID getAccountId() { return accountId; }
    public UUID getProductId() { return productId; }
    public String getMovementType() { return movementType; }
    public int getQuantity() { return quantity; }
    public String getReferenceType() { return referenceType; }
    public UUID getReferenceId() { return referenceId; }
    public Instant getCreatedAt() { return createdAt; }
}
