package com.smartpos.contracts.api;

import java.time.Instant;
import java.util.Map;

public record ApiError(Instant timestamp, String code, String message, Map<String, Object> details) {
  public static ApiError of(String code, String message) {
    return new ApiError(Instant.now(), code, message, Map.of());
  }
}
