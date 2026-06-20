package com.smartpos.notificationsapprovals.api;

import com.smartpos.contracts.health.HealthResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Health check endpoint for the Notifications and Approvals Service.
 *
 * <p>Returns service status information used by the gateway health routes,
 * smoke tests, and container orchestration health probes.</p>
 */
@RestController
@RequestMapping("/api/v1")
public class HealthController {

    /**
     * Returns the current health status of this service.
     *
     * @return health response with service name, status, and timestamp
     */
    @GetMapping("/health")
    public HealthResponse health() {
        return HealthResponse.up("notifications-approvals-service", "0.1.0-SNAPSHOT");
    }
}
