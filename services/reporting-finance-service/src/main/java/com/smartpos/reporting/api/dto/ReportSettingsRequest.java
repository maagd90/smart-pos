package com.smartpos.reporting.api.dto;

import java.util.List;
import java.util.UUID;

public record ReportSettingsRequest(String channel, List<String> recipients, String sendTime, String timezone) {
}
