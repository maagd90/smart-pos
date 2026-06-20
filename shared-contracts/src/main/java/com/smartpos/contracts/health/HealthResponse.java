package com.smartpos.contracts.health;

import java.time.Instant;

/**
 * Standard health check response returned by every service's health endpoint.
 *
 * @param service   the service name
 * @param status    the health status (UP, DOWN, DEGRADED)
 * @param version   the service version
 * @param timestamp when the health check was performed
 */
public record HealthResponse(String service, String status, String version, Instant timestamp) {

    /**
     * Creates an UP health response for the given service.
     *
     * @param service the service name
     * @param version the service version
     * @return healthy response
     */
    public static HealthResponse up(String service, String version) {
        return new HealthResponse(service, "UP", version, Instant.now());
    }
}
