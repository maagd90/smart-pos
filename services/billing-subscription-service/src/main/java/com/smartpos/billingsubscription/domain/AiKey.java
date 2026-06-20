package com.smartpos.billingsubscription.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_keys")
public class AiKey {

    @Id
    private UUID id;

    @Column(name = "key_hash", nullable = false)
    private String keyHash;

    @Column(name = "last4", nullable = false)
    private String last4;

    @Column(name = "rotated_at", nullable = false)
    private Instant rotatedAt;

    protected AiKey() {
    }

    public AiKey(String keyHash, String last4) {
        this.id = UUID.randomUUID();
        this.keyHash = keyHash;
        this.last4 = last4;
        this.rotatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getLast4() { return last4; }
    public Instant getRotatedAt() { return rotatedAt; }
}
