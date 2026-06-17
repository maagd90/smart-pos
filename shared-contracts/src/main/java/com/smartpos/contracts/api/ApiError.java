package com.smartpos.contracts.api;

import java.time.Instant;
import java.util.Map;

/**
 * Structured error information returned in failed API responses.
 *
 * <p>Contains a machine-readable code, a human-readable message,
 * and an optional details map for field-level or contextual information.</p>
 */
public record ApiError(Instant timestamp, String code, String message, Map<String, Object> details) {

    /**
     * Creates an error with the given code and message, no extra details.
     *
     * @param code    machine-readable error code (e.g. "VALIDATION_FAILED")
     * @param message human-readable description
     * @return a new ApiError instance
     */
    public static ApiError of(String code, String message) {
        return new ApiError(Instant.now(), code, message, Map.of());
    }

    /**
     * Creates an error with the given code, message, and details map.
     *
     * @param code    machine-readable error code
     * @param message human-readable description
     * @param details additional context (field errors, constraints, etc.)
     * @return a new ApiError instance
     */
    public static ApiError of(String code, String message, Map<String, Object> details) {
        return new ApiError(Instant.now(), code, message, details);
    }
}
