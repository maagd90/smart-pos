package com.smartpos.tenant.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.context.TenantContext;
import com.smartpos.contracts.security.RequirePermission;
import com.smartpos.tenant.api.dto.AccountResponse;
import com.smartpos.tenant.api.dto.CreateAccountRequest;
import com.smartpos.tenant.api.dto.CreateStoreRequest;
import com.smartpos.tenant.api.dto.StoreResponse;
import com.smartpos.tenant.domain.Account;
import com.smartpos.tenant.domain.AccountRepository;
import com.smartpos.tenant.domain.Store;
import com.smartpos.tenant.domain.StoreRepository;
import com.smartpos.tenant.integration.IdentityRoleProvisioningClient;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/accounts")
public class AccountController {

    private final AccountRepository accountRepository;
    private final StoreRepository storeRepository;
    private final IdentityRoleProvisioningClient roleProvisioningClient;

    public AccountController(AccountRepository accountRepository,
                             StoreRepository storeRepository,
                             IdentityRoleProvisioningClient roleProvisioningClient) {
        this.accountRepository = accountRepository;
        this.storeRepository = storeRepository;
        this.roleProvisioningClient = roleProvisioningClient;
    }

    @PostMapping
    @RequirePermission("accounts.manage")
    public ResponseEntity<ApiEnvelope<AccountResponse>> createAccount(@RequestBody CreateAccountRequest request) {
        if (request == null || request.name() == null || request.name().isBlank()) {
            return badRequest("Account name is required");
        }

        String currency = request.currency() != null && !request.currency().isBlank() ? request.currency() : "AED";
        String locale = request.locale() != null && !request.locale().isBlank() ? request.locale() : "en-AE";

        Account account = accountRepository.save(new Account(request.name(), currency, locale));
        roleProvisioningClient.provisionRolesForAccount(account.getId());
        AccountResponse response = AccountResponse.from(account);
        return ResponseEntity
                .created(URI.create("/api/v1/accounts/" + account.getId()))
                .body(ApiEnvelope.ok(response));
    }

    @GetMapping
    @RequirePermission("accounts.manage")
    public ResponseEntity<ApiEnvelope<List<AccountResponse>>> listAccounts() {
        TenantContext context = RequestContextHolder.get();
        if (context.accountId() == null && !context.platformAdmin()) {
            return ResponseEntity.status(401)
                    .body(ApiEnvelope.fail(ApiError.of("UNAUTHORIZED", "accountId is required")));
        }

        List<AccountResponse> accounts;
        if (context.platformAdmin()) {
            accounts = accountRepository.findAll().stream().map(AccountResponse::from).toList();
        } else {
            accounts = accountRepository.findById(context.accountId())
                    .stream()
                    .map(AccountResponse::from)
                    .toList();
        }
        return ResponseEntity.ok(ApiEnvelope.ok(accounts));
    }

    @GetMapping("/{accountId}")
    public ResponseEntity<ApiEnvelope<AccountResponse>> getAccount(@PathVariable UUID accountId) {
        TenantContext context = RequestContextHolder.get();
        if (context.accountId() == null) {
            return ResponseEntity.status(401)
                    .body(ApiEnvelope.fail(ApiError.of("UNAUTHORIZED", "accountId is required")));
        }
        if (!context.platformAdmin() && !context.accountId().equals(accountId)) {
            return ResponseEntity.status(403)
                    .body(ApiEnvelope.fail(ApiError.of("FORBIDDEN", "Access denied to account")));
        }
        return accountRepository.findById(accountId)
                .map(account -> ResponseEntity.ok(ApiEnvelope.ok(AccountResponse.from(account))))
                .orElseGet(() -> notFound("Account not found"));
    }

    @PostMapping("/{accountId}/stores")
    @RequirePermission("stores.manage")
    public ResponseEntity<ApiEnvelope<StoreResponse>> createStore(
            @PathVariable UUID accountId, @RequestBody CreateStoreRequest request) {
        if (!canAccessAccount(accountId)) {
            return ResponseEntity.status(403)
                    .body(ApiEnvelope.fail(ApiError.of("FORBIDDEN", "Access denied to account")));
        }
        if (!accountRepository.existsById(accountId)) {
            return notFound("Account not found");
        }
        if (request == null || request.name() == null || request.name().isBlank()) {
            return badRequest("Store name is required");
        }

        String timezone = request.timezone() != null && !request.timezone().isBlank()
                ? request.timezone()
                : "Asia/Dubai";

        Account account = accountRepository.findById(accountId).orElseThrow();
        Store store = storeRepository.save(new Store(accountId, request.name(), timezone));
        StoreResponse response = StoreResponse.from(store, account.getCurrency());
        return ResponseEntity
                .created(URI.create("/api/v1/accounts/" + accountId + "/stores/" + store.getId()))
                .body(ApiEnvelope.ok(response));
    }

    @GetMapping("/{accountId}/stores")
    public ResponseEntity<ApiEnvelope<List<StoreResponse>>> listStores(@PathVariable UUID accountId) {
        if (!canAccessAccount(accountId)) {
            return ResponseEntity.status(403)
                    .body(ApiEnvelope.fail(ApiError.of("FORBIDDEN", "Access denied to account")));
        }
        if (!accountRepository.existsById(accountId)) {
            return notFound("Account not found");
        }

        Account account = accountRepository.findById(accountId).orElseThrow();
        List<StoreResponse> stores = storeRepository.findByAccountId(accountId)
                .stream()
                .map(store -> StoreResponse.from(store, account.getCurrency()))
                .toList();
        return ResponseEntity.ok(ApiEnvelope.ok(stores));
    }

    private boolean canAccessAccount(UUID accountId) {
        TenantContext context = RequestContextHolder.get();
        if (context.platformAdmin()) {
            return true;
        }
        return context.accountId() != null && context.accountId().equals(accountId);
    }

    private <T> ResponseEntity<ApiEnvelope<T>> badRequest(String message) {
        return ResponseEntity.badRequest().body(ApiEnvelope.fail(ApiError.of("VALIDATION_FAILED", message)));
    }

    private <T> ResponseEntity<ApiEnvelope<T>> notFound(String message) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiEnvelope.fail(ApiError.of("NOT_FOUND", message)));
    }
}
