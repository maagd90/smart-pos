package com.smartpos.tenant.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.tenant.api.dto.AccountResponse;
import com.smartpos.tenant.api.dto.CreatePlatformAccountRequest;
import com.smartpos.tenant.api.dto.StoreResponse;
import com.smartpos.tenant.domain.Account;
import com.smartpos.tenant.domain.AccountRepository;
import com.smartpos.tenant.domain.Store;
import com.smartpos.tenant.domain.StoreRepository;
import com.smartpos.tenant.integration.BillingClient;
import com.smartpos.tenant.integration.IdentityOwnerClient;
import com.smartpos.tenant.integration.IdentityRoleProvisioningClient;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/platform")
public class PlatformController {

    private final AccountRepository accountRepository;
    private final StoreRepository storeRepository;
    private final IdentityRoleProvisioningClient roleProvisioningClient;
    private final IdentityOwnerClient identityOwnerClient;
    private final BillingClient billingClient;

    public PlatformController(AccountRepository accountRepository,
                              StoreRepository storeRepository,
                              IdentityRoleProvisioningClient roleProvisioningClient,
                              IdentityOwnerClient identityOwnerClient,
                              BillingClient billingClient) {
        this.accountRepository = accountRepository;
        this.storeRepository = storeRepository;
        this.roleProvisioningClient = roleProvisioningClient;
        this.identityOwnerClient = identityOwnerClient;
        this.billingClient = billingClient;
    }

    @GetMapping("/accounts")
    public ResponseEntity<ApiEnvelope<List<AccountResponse>>> listAccounts() {
        requirePlatformAdmin();
        List<AccountResponse> accounts = accountRepository.findAll().stream()
                .map(AccountResponse::from).toList();
        return ResponseEntity.ok(ApiEnvelope.ok(accounts));
    }

    @PostMapping("/accounts")
    @Transactional
    public ResponseEntity<ApiEnvelope<AccountResponse>> createAccount(
            @RequestBody CreatePlatformAccountRequest request) {
        requirePlatformAdmin();
        if (request == null || request.name() == null || request.ownerEmail() == null || request.ownerPassword() == null) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "name, ownerEmail, ownerPassword required")));
        }
        String currency = request.currency() != null ? request.currency() : "AED";
        String locale = request.locale() != null ? request.locale() : "en-AE";
        Account account = accountRepository.save(new Account(request.name(), currency, locale));
        roleProvisioningClient.provisionRolesForAccount(account.getId());
        identityOwnerClient.createOwner(account.getId(), request.ownerEmail(), request.ownerPassword(),
                request.ownerDisplayName());
        billingClient.assignDefaultPlan(account.getId());
        return ResponseEntity.created(URI.create("/api/v1/platform/accounts/" + account.getId()))
                .body(ApiEnvelope.ok(AccountResponse.from(account)));
    }

    @PutMapping("/accounts/{accountId}/suspend")
    public ResponseEntity<ApiEnvelope<AccountResponse>> suspendAccount(@PathVariable UUID accountId) {
        requirePlatformAdmin();
        return accountRepository.findById(accountId).map(account -> {
            account.setStatus("SUSPENDED");
            accountRepository.save(account);
            return ResponseEntity.ok(ApiEnvelope.ok(AccountResponse.from(account)));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/accounts/{accountId}/reactivate")
    public ResponseEntity<ApiEnvelope<AccountResponse>> reactivateAccount(@PathVariable UUID accountId) {
        requirePlatformAdmin();
        return accountRepository.findById(accountId).map(account -> {
            account.setStatus("ACTIVE");
            accountRepository.save(account);
            return ResponseEntity.ok(ApiEnvelope.ok(AccountResponse.from(account)));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/stores/{storeId}/suspend")
    public ResponseEntity<ApiEnvelope<StoreResponse>> suspendStore(@PathVariable UUID storeId) {
        requirePlatformAdmin();
        return storeRepository.findById(storeId).map(store -> {
            store.setStatus("SUSPENDED");
            storeRepository.save(store);
            Account account = accountRepository.findById(store.getAccountId()).orElseThrow();
            return ResponseEntity.ok(ApiEnvelope.ok(StoreResponse.from(store, account.getCurrency())));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/stores/{storeId}/reactivate")
    public ResponseEntity<ApiEnvelope<StoreResponse>> reactivateStore(@PathVariable UUID storeId) {
        requirePlatformAdmin();
        return storeRepository.findById(storeId).map(store -> {
            store.setStatus("ACTIVE");
            storeRepository.save(store);
            Account account = accountRepository.findById(store.getAccountId()).orElseThrow();
            return ResponseEntity.ok(ApiEnvelope.ok(StoreResponse.from(store, account.getCurrency())));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    private void requirePlatformAdmin() {
        if (!RequestContextHolder.get().platformAdmin()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Platform admin required");
        }
    }
}
