package com.smartpos.notificationsapprovals.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.notificationsapprovals.api.dto.RegisterDeviceRequest;
import com.smartpos.notificationsapprovals.domain.DeviceRegistration;
import com.smartpos.notificationsapprovals.domain.DeviceRegistrationRepository;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications/devices")
public class DeviceController {

    private final DeviceRegistrationRepository deviceRegistrationRepository;

    public DeviceController(DeviceRegistrationRepository deviceRegistrationRepository) {
        this.deviceRegistrationRepository = deviceRegistrationRepository;
    }

    @PostMapping
    public ResponseEntity<ApiEnvelope<DeviceRegistrationResponse>> register(@RequestBody RegisterDeviceRequest request) {
        UUID userId = requireUserId();
        deviceRegistrationRepository.findByUserIdAndExpoPushToken(userId, request.expoPushToken())
                .orElseGet(() -> deviceRegistrationRepository.save(
                        new DeviceRegistration(userId, request.expoPushToken(), request.platform())));
        return ResponseEntity.ok(ApiEnvelope.ok(new DeviceRegistrationResponse(userId, request.platform())));
    }

    @DeleteMapping("/{token}")
    public ResponseEntity<ApiEnvelope<String>> unregister(@PathVariable("token") String token) {
        UUID userId = requireUserId();
        deviceRegistrationRepository.deleteByUserIdAndExpoPushToken(userId, token);
        return ResponseEntity.ok(ApiEnvelope.ok("deleted"));
    }

    private UUID requireUserId() {
        UUID userId = RequestContextHolder.get().userId();
        if (userId == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return userId;
    }

    public record DeviceRegistrationResponse(UUID userId, String platform) {
    }
}
