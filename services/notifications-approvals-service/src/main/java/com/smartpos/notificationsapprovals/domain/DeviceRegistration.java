package com.smartpos.notificationsapprovals.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "device_registrations")
public class DeviceRegistration {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "expo_push_token", nullable = false)
    private String expoPushToken;

    @Column(nullable = false)
    private String platform;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected DeviceRegistration() {}

    public DeviceRegistration(UUID userId, String expoPushToken, String platform) {
        this.id = UUID.randomUUID();
        this.userId = userId;
        this.expoPushToken = expoPushToken;
        this.platform = platform;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getExpoPushToken() { return expoPushToken; }
    public String getPlatform() { return platform; }
}
