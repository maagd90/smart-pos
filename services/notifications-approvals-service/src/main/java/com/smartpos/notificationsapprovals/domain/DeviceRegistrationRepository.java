package com.smartpos.notificationsapprovals.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceRegistrationRepository extends JpaRepository<DeviceRegistration, UUID> {

    List<DeviceRegistration> findByUserId(UUID userId);

    Optional<DeviceRegistration> findByUserIdAndExpoPushToken(UUID userId, String expoPushToken);

    void deleteByUserIdAndExpoPushToken(UUID userId, String expoPushToken);
}
