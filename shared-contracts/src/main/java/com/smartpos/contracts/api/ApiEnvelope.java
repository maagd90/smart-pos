package com.smartpos.contracts.api;

import java.time.Instant;

/**
 * Standard API response wrapper used across all services.
 *
 * <p>Every REST endpoint returns data inside this envelope so clients have
 * a consistent structure for success and failure responses.</p>
 *
 * @param <T> the type of the payload data
 */
public record ApiEnvelope<T>(boolean success, T data, ApiError error, Instant timestamp) {

    /**
     * Creates a successful response envelope containing the given data.
     *
     * @param data the response payload
     * @param <T>  the payload type
     * @return envelope with success=true
     */
    public static <T> ApiEnvelope<T> ok(T data) {
        return new ApiEnvelope<>(true, data, null, Instant.now());
    }

    /**
     * Creates a failure response envelope containing the given error.
     *
     * @param error the error details
     * @param <T>   the payload type (always null in error responses)
     * @return envelope with success=false
     */
    public static <T> ApiEnvelope<T> fail(ApiError error) {
        return new ApiEnvelope<>(false, null, error, Instant.now());
    }
}
