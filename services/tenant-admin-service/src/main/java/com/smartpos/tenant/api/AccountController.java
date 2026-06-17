package com.smartpos.tenant.api;

import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.tenant.api.dto.AccountResponse;
import com.smartpos.tenant.api.dto.CreateAccountRequest;
import com.smartpos.tenant.api.dto.CreateStoreRequest;
import com.smartpos.tenant.api.dto.StoreResponse;
import com.smartpos.tenant.domain.Account;
import com.smartpos.tenant.domain.AccountRepository;
import com.smartpos.tenant.domain.Store;
import com.smartpos.tenant.domain.StoreRepository;
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

/**
 * REST controller for managing tenant accounts and their stores.
 *
 * <p>Provides minimal account and store management operations for milestone 1.
 * All store operations are scoped to the parent account.</p>
 */
@RestController
@RequestMapping("/api/v1/accounts")
public class AccountController {

    private final AccountRepository accountRepository;
    private final StoreRepository storeRepository;

    /**
     * Creates the account controller.
     *
     * @param accountRepository repository for account persistence
     * @param storeRepository repository for store persistence
     */
    public AccountController(AccountRepository accountRepository, StoreRepository storeRepository) {
        this.accountRepository = accountRepository;
        this.storeRepository = storeRepository;
    }

    /**
     * Creates a new tenant account.
     *
     * @param request the account creation request
     * @return the created account wrapped in an API envelope
     */
    @PostMapping
    public ResponseEntity<ApiEnvelope<AccountResponse>> createAccount(@RequestBody CreateAccountRequest request) {
        if (request == null || request.name() == null || request.name().isBlank()) {
            return badRequest("Account name is required");
        }

        String currency = request.currency() != null && !request.currency().isBlank() ? request.currency() : "AED";
        String locale = request.locale() != null && !request.locale().isBlank() ? request.locale() : "en-AE";

        Account account = accountRepository.save(new Account(request.name(), currency, locale));
        AccountResponse response = AccountResponse.from(account);
        return ResponseEntity
                .created(URI.create("/api/v1/accounts/" + account.getId()))
                .body(ApiEnvelope.ok(response));
    }

    /**
     * Lists all tenant accounts.
     *
     * @return list of accounts wrapped in an API envelope
     */
    @GetMapping
    public ResponseEntity<ApiEnvelope<List<AccountResponse>>> listAccounts() {
        List<AccountResponse> accounts = accountRepository.findAll()
                .stream()
                .map(AccountResponse::from)
                .toList();
        return ResponseEntity.ok(ApiEnvelope.ok(accounts));
    }

    /**
     * Creates a new store under the specified account.
     *
     * @param accountId the parent account ID
     * @param request the store creation request
     * @return the created store wrapped in an API envelope
     */
    @PostMapping("/{accountId}/stores")
    public ResponseEntity<ApiEnvelope<StoreResponse>> createStore(
            @PathVariable UUID accountId, @RequestBody CreateStoreRequest request) {
        if (!accountRepository.existsById(accountId)) {
            return notFound("Account not found");
        }
        if (request == null || request.name() == null || request.name().isBlank()) {
            return badRequest("Store name is required");
        }

        String timezone = request.timezone() != null && !request.timezone().isBlank()
                ? request.timezone()
                : "Asia/Dubai";

        Store store = storeRepository.save(new Store(accountId, request.name(), timezone));
        StoreResponse response = StoreResponse.from(store);
        return ResponseEntity
                .created(URI.create("/api/v1/accounts/" + accountId + "/stores/" + store.getId()))
                .body(ApiEnvelope.ok(response));
    }

    /**
     * Lists all stores for the specified account.
     *
     * @param accountId the parent account ID
     * @return list of stores wrapped in an API envelope
     */
    @GetMapping("/{accountId}/stores")
    public ResponseEntity<ApiEnvelope<List<StoreResponse>>> listStores(@PathVariable UUID accountId) {
        if (!accountRepository.existsById(accountId)) {
            return notFound("Account not found");
        }

        List<StoreResponse> stores = storeRepository.findByAccountId(accountId)
                .stream()
                .map(StoreResponse::from)
                .toList();
        return ResponseEntity.ok(ApiEnvelope.ok(stores));
    }

    private <T> ResponseEntity<ApiEnvelope<T>> badRequest(String message) {
        return ResponseEntity.badRequest().body(ApiEnvelope.fail(ApiError.of("VALIDATION_FAILED", message)));
    }

    private <T> ResponseEntity<ApiEnvelope<T>> notFound(String message) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiEnvelope.fail(ApiError.of("NOT_FOUND", message)));
    }
}
