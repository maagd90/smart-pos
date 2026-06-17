package com.smartpos.contracts.api;

import java.time.Instant;

public record ApiEnvelope<T>(boolean success, T data, ApiError error, Instant timestamp) {
    public static <T> ApiEnvelope<T> ok(T data) {
        return new ApiEnvelope<>(true, data, null, Instant.now());
    }

    public static <T> ApiEnvelope<T> fail(ApiError error) {
        return new ApiEnvelope<>(false, null, error, Instant.now());
    }
}
