package com.smartpos.refunds.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.context.TenantContext;
import com.smartpos.contracts.security.RequirePermission;
import com.smartpos.contracts.security.RequireStoreAccess;
import com.smartpos.refunds.api.dto.CreateExchangeRequest;
import com.smartpos.refunds.api.dto.ExchangeResponse;
import com.smartpos.refunds.service.ExchangeSagaService;
import java.net.URI;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/stores/{storeId}/exchanges")
@RequireStoreAccess
public class ExchangesController {

    private final ExchangeSagaService exchangeSagaService;

    public ExchangesController(ExchangeSagaService exchangeSagaService) {
        this.exchangeSagaService = exchangeSagaService;
    }

    @PostMapping
    @RequirePermission("exchange.create")
    public ResponseEntity<ApiEnvelope<ExchangeResponse>> createExchange(
            @PathVariable UUID storeId, @RequestBody CreateExchangeRequest request) {
        if (request == null || request.originalSaleId() == null
                || request.returnedItems() == null || request.returnedItems().isEmpty()
                || request.replacementItems() == null || request.replacementItems().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST",
                            "originalSaleId, returnedItems, and replacementItems are required")));
        }

        TenantContext context = RequestContextHolder.get();
        if (context.accountId() == null) {
            return ResponseEntity.status(401)
                    .body(ApiEnvelope.fail(ApiError.of("UNAUTHORIZED", "accountId is required in tenant context")));
        }

        ExchangeSagaService.ExchangeResult result =
                exchangeSagaService.executeExchange(storeId, context.accountId(), request);

        if (result.httpStatus() == 404) {
            return ResponseEntity.notFound().build();
        }
        if (result.httpStatus() == 400) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of(result.errorCode(), result.errorMessage())));
        }
        if (result.httpStatus() == 422) {
            return ResponseEntity.unprocessableEntity()
                    .body(ApiEnvelope.fail(ApiError.of(result.errorCode(), result.errorMessage())));
        }
        if (result.httpStatus() == 500) {
            return ResponseEntity.internalServerError()
                    .body(ApiEnvelope.fail(ApiError.of(result.errorCode(), result.errorMessage())));
        }

        return ResponseEntity
                .created(URI.create("/api/v1/stores/" + storeId + "/exchanges/" + result.exchange().getId()))
                .body(ApiEnvelope.ok(ExchangeResponse.from(result.exchange())));
    }
}
