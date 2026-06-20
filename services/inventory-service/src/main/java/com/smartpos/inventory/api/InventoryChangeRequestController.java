package com.smartpos.inventory.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.security.RequirePermission;
import com.smartpos.contracts.security.RequireStoreAccess;
import com.smartpos.inventory.api.dto.ChangeRequestResponse;
import com.smartpos.inventory.api.dto.CreateChangeRequestBody;
import com.smartpos.inventory.domain.InventoryChangeRequest;
import com.smartpos.inventory.domain.InventoryChangeRequestRepository;
import com.smartpos.inventory.domain.InventoryMovement;
import com.smartpos.inventory.domain.InventoryMovementRepository;
import com.smartpos.inventory.outbox.OutboxEvent;
import com.smartpos.inventory.outbox.OutboxRepository;
import java.net.URI;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/stores/{storeId}/change-requests")
@RequireStoreAccess
public class InventoryChangeRequestController {

    private final InventoryChangeRequestRepository changeRequestRepository;
    private final InventoryMovementRepository movementRepository;
    private final OutboxRepository outboxRepository;

    public InventoryChangeRequestController(InventoryChangeRequestRepository changeRequestRepository,
                                            InventoryMovementRepository movementRepository,
                                            OutboxRepository outboxRepository) {
        this.changeRequestRepository = changeRequestRepository;
        this.movementRepository = movementRepository;
        this.outboxRepository = outboxRepository;
    }

    @PostMapping
    @RequirePermission("inventory.adjust")
    @Transactional
    public ResponseEntity<ApiEnvelope<ChangeRequestResponse>> create(
            @PathVariable UUID storeId, @RequestBody CreateChangeRequestBody request) {
        UUID accountId = RequestContextHolder.get().accountId();
        String summary = request.summary() != null ? request.summary()
                : "Adjust product " + request.productId() + " by " + request.quantity();
        InventoryChangeRequest changeRequest = changeRequestRepository.save(
                new InventoryChangeRequest(accountId, storeId, request.productId(), request.quantity(), summary));
        outboxRepository.save(new OutboxEvent("InventoryChangeRequest", changeRequest.getId(),
                "inventory.change.requested", Map.of(
                        "changeId", changeRequest.getId().toString(),
                        "storeId", storeId.toString(),
                        "accountId", accountId.toString(),
                        "summary", summary)));
        return ResponseEntity.created(URI.create("/api/v1/stores/" + storeId + "/change-requests/" + changeRequest.getId()))
                .body(ApiEnvelope.ok(ChangeRequestResponse.from(changeRequest)));
    }

    @PostMapping("/{changeId}/approve")
    @RequirePermission("inventory.change.approve")
    @Transactional
    public ResponseEntity<ApiEnvelope<ChangeRequestResponse>> approve(
            @PathVariable UUID storeId, @PathVariable UUID changeId) {
        InventoryChangeRequest changeRequest = changeRequestRepository.findById(changeId).orElseThrow();
        if ("PENDING".equals(changeRequest.getStatus())) {
            movementRepository.save(new InventoryMovement(
                    storeId, changeRequest.getAccountId(), changeRequest.getProductId(),
                    "adjust", changeRequest.getQuantity(), "change_request", changeId));
            changeRequest.approve();
            changeRequestRepository.save(changeRequest);
        }
        return ResponseEntity.ok(ApiEnvelope.ok(ChangeRequestResponse.from(changeRequest)));
    }

    @PostMapping("/{changeId}/reject")
    @RequirePermission("inventory.change.approve")
    @Transactional
    public ResponseEntity<ApiEnvelope<ChangeRequestResponse>> reject(
            @PathVariable UUID storeId, @PathVariable UUID changeId) {
        InventoryChangeRequest changeRequest = changeRequestRepository.findById(changeId).orElseThrow();
        changeRequest.reject();
        changeRequestRepository.save(changeRequest);
        return ResponseEntity.ok(ApiEnvelope.ok(ChangeRequestResponse.from(changeRequest)));
    }
}
