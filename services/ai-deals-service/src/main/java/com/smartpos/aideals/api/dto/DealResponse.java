package com.smartpos.aideals.api.dto;

import com.smartpos.aideals.domain.Deal;
import java.util.UUID;

public record DealResponse(UUID id, UUID accountId, UUID storeId, String offerSummary, String status) {
    public static DealResponse from(Deal deal) {
        return new DealResponse(deal.getId(), deal.getAccountId(), deal.getStoreId(), deal.getOfferSummary(), deal.getStatus());
    }
}
