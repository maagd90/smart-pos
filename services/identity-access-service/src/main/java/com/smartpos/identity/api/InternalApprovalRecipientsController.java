package com.smartpos.identity.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.identity.api.dto.ApprovalRecipientResponse;
import com.smartpos.identity.service.ApprovalRecipientService;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/internal/stores")
public class InternalApprovalRecipientsController {

    private final ApprovalRecipientService approvalRecipientService;

    public InternalApprovalRecipientsController(ApprovalRecipientService approvalRecipientService) {
        this.approvalRecipientService = approvalRecipientService;
    }

    @GetMapping("/{storeId}/approval-recipients")
    public ResponseEntity<ApiEnvelope<List<ApprovalRecipientResponse>>> getRecipients(
            @PathVariable UUID storeId,
            @RequestParam UUID accountId) {
        List<ApprovalRecipientResponse> recipients = approvalRecipientService.resolve(accountId, storeId);
        return ResponseEntity.ok(ApiEnvelope.ok(recipients));
    }
}
