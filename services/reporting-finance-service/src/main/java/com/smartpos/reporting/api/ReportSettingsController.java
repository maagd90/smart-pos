package com.smartpos.reporting.api;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.security.RequirePermission;
import com.smartpos.contracts.security.RequireStoreAccess;
import com.smartpos.reporting.api.dto.ReportSettingsRequest;
import com.smartpos.reporting.api.dto.ReportSettingsResponse;
import com.smartpos.reporting.domain.StoreReportSettings;
import com.smartpos.reporting.domain.StoreReportSettingsRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/stores/{storeId}/report-settings")
@RequireStoreAccess
public class ReportSettingsController {

    private final StoreReportSettingsRepository repository;
    private final ObjectMapper objectMapper;

    public ReportSettingsController(StoreReportSettingsRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    @RequirePermission("reports.view")
    public ResponseEntity<ApiEnvelope<ReportSettingsResponse>> getSettings(@PathVariable UUID storeId) {
        UUID accountId = RequestContextHolder.get().accountId();
        StoreReportSettings settings = repository.findByStoreIdAndAccountId(storeId, accountId)
                .orElseGet(() -> StoreReportSettings.createDefault(storeId, accountId));
        return ResponseEntity.ok(ApiEnvelope.ok(toResponse(settings)));
    }

    @PutMapping
    @Transactional
    @RequirePermission("reports.export")
    public ResponseEntity<ApiEnvelope<ReportSettingsResponse>> updateSettings(
            @PathVariable UUID storeId, @RequestBody ReportSettingsRequest request) {
        UUID accountId = RequestContextHolder.get().accountId();
        StoreReportSettings settings = repository.findByStoreIdAndAccountId(storeId, accountId)
                .orElseGet(() -> StoreReportSettings.createDefault(storeId, accountId));
        if (request != null) {
            String recipientsJson = serializeRecipients(request.recipients());
            settings.update(request.channel(), recipientsJson, request.sendTime(), request.timezone());
        }
        settings = repository.save(settings);
        return ResponseEntity.ok(ApiEnvelope.ok(toResponse(settings)));
    }

    private ReportSettingsResponse toResponse(StoreReportSettings settings) {
        return new ReportSettingsResponse(
                settings.getStoreId(),
                settings.getChannel(),
                parseRecipients(settings.getRecipientsJson()),
                settings.getSendTime(),
                settings.getTimezone());
    }

    private List<String> parseRecipients(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private String serializeRecipients(List<String> recipients) {
        try {
            return objectMapper.writeValueAsString(recipients != null ? recipients : List.of());
        } catch (Exception e) {
            return "[]";
        }
    }
}
