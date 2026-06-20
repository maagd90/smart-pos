package com.smartpos.reporting.api.dto;

import java.util.List;
import java.util.UUID;

public record ReportSettingsResponse(UUID storeId, String channel, List<String> recipients, String sendTime, String timezone) {
}
