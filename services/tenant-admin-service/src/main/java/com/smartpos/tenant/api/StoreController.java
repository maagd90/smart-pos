package com.smartpos.tenant.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.security.RequirePermission;
import com.smartpos.contracts.security.RequireStoreAccess;
import com.smartpos.tenant.api.dto.StoreSettingsRequest;
import com.smartpos.tenant.api.dto.StoreSettingsResponse;
import com.smartpos.tenant.domain.Store;
import com.smartpos.tenant.domain.StoreRepository;
import com.smartpos.tenant.domain.StoreSettings;
import com.smartpos.tenant.domain.StoreSettingsRepository;
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
@RequestMapping("/api/v1/stores/{storeId}")
@RequireStoreAccess
public class StoreController {

    private final StoreRepository storeRepository;
    private final StoreSettingsRepository settingsRepository;

    public StoreController(StoreRepository storeRepository, StoreSettingsRepository settingsRepository) {
        this.storeRepository = storeRepository;
        this.settingsRepository = settingsRepository;
    }

    @GetMapping("/settings")
    @RequirePermission("store.settings.manage")
    public ResponseEntity<ApiEnvelope<StoreSettingsResponse>> getSettings(@PathVariable UUID storeId) {
        UUID accountId = requireAccountId();
        Store store = storeRepository.findById(storeId).orElse(null);
        if (store == null) {
            return ResponseEntity.notFound().build();
        }
        StoreSettings settings = settingsRepository.findByStoreIdAndAccountId(storeId, accountId)
                .orElseGet(() -> StoreSettings.createDefault(storeId, accountId, store.getTimezone()));
        return ResponseEntity.ok(ApiEnvelope.ok(StoreSettingsResponse.from(settings)));
    }

    @PutMapping("/settings")
    @Transactional
    @RequirePermission("store.settings.manage")
    public ResponseEntity<ApiEnvelope<StoreSettingsResponse>> updateSettings(
            @PathVariable UUID storeId, @RequestBody StoreSettingsRequest request) {
        UUID accountId = requireAccountId();
        Store store = storeRepository.findById(storeId).orElse(null);
        if (store == null) {
            return ResponseEntity.notFound().build();
        }
        StoreSettings settings = settingsRepository.findByStoreIdAndAccountId(storeId, accountId)
                .orElseGet(() -> StoreSettings.createDefault(storeId, accountId, store.getTimezone()));
        if (request != null) {
            settings.update(request.openingTime(), request.closingTime(), request.timezone(),
                    request.monthlyRent(), request.defaultMarkupPct());
        }
        settings = settingsRepository.save(settings);
        return ResponseEntity.ok(ApiEnvelope.ok(StoreSettingsResponse.from(settings)));
    }

    private UUID requireAccountId() {
        UUID accountId = RequestContextHolder.get().accountId();
        if (accountId == null) {
            throw new IllegalStateException("accountId required");
        }
        return accountId;
    }
}
