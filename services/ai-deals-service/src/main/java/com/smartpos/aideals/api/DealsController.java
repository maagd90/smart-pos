package com.smartpos.aideals.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.security.RequirePermission;
import com.smartpos.contracts.security.RequireStoreAccess;
import com.smartpos.aideals.api.dto.CreateDealRequest;
import com.smartpos.aideals.api.dto.DealResponse;
import com.smartpos.aideals.domain.Deal;
import com.smartpos.aideals.domain.DealRepository;
import com.smartpos.aideals.outbox.OutboxEvent;
import com.smartpos.aideals.outbox.OutboxRepository;
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
@RequestMapping("/api/v1")
public class DealsController {

    private final DealRepository dealRepository;
    private final OutboxRepository outboxRepository;

    public DealsController(DealRepository dealRepository, OutboxRepository outboxRepository) {
        this.dealRepository = dealRepository;
        this.outboxRepository = outboxRepository;
    }

    @PostMapping("/stores/{storeId}/deals")
    @RequireStoreAccess
    @RequirePermission("deal.create")
    @Transactional
    public ResponseEntity<ApiEnvelope<DealResponse>> createDeal(
            @PathVariable UUID storeId, @RequestBody CreateDealRequest request) {
        UUID accountId = RequestContextHolder.get().accountId();
        String summary = request != null && request.offerSummary() != null ? request.offerSummary() : "New deal";
        Deal deal = dealRepository.save(new Deal(accountId, storeId, summary));
        outboxRepository.save(new OutboxEvent("Deal", deal.getId(), "deal.pending_approval", Map.of(
                "dealId", deal.getId().toString(),
                "storeId", storeId.toString(),
                "accountId", accountId.toString(),
                "offerSummary", summary)));
        return ResponseEntity.created(URI.create("/api/v1/deals/" + deal.getId()))
                .body(ApiEnvelope.ok(DealResponse.from(deal)));
    }

    @PostMapping("/deals/{dealId}/accept")
    @RequirePermission("deal.approve")
    @Transactional
    public ResponseEntity<ApiEnvelope<DealResponse>> accept(@PathVariable UUID dealId) {
        return decide(dealId, true);
    }

    @PostMapping("/deals/{dealId}/reject")
    @RequirePermission("deal.approve")
    @Transactional
    public ResponseEntity<ApiEnvelope<DealResponse>> reject(@PathVariable UUID dealId) {
        return decide(dealId, false);
    }

    private ResponseEntity<ApiEnvelope<DealResponse>> decide(UUID dealId, boolean accept) {
        Deal deal = dealRepository.findById(dealId).orElseThrow();
        if (accept) {
            deal.approve();
        } else {
            deal.reject();
        }
        dealRepository.save(deal);
        return ResponseEntity.ok(ApiEnvelope.ok(DealResponse.from(deal)));
    }
}
