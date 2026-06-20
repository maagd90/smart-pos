package com.smartpos.reporting.api;

import com.smartpos.contracts.health.HealthResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Health check endpoint for the Reporting and Finance Service.
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
        return HealthResponse.up("reporting-finance-service", "0.1.0-SNAPSHOT");
    }
}
