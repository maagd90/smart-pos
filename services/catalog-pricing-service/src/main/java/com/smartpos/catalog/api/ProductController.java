package com.smartpos.catalog.api;

import com.smartpos.catalog.api.dto.CreateProductRequest;
import com.smartpos.catalog.api.dto.ProductResponse;
import com.smartpos.catalog.domain.Product;
import com.smartpos.catalog.domain.ProductRepository;
import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.context.TenantContext;
import com.smartpos.contracts.security.RequirePermission;
import com.smartpos.contracts.security.RequireStoreAccess;
import java.math.BigDecimal;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for managing products in a store catalog.
 */
@RestController
@RequestMapping("/api/v1/stores/{storeId}/products")
@RequireStoreAccess
public class ProductController {

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    /**
     * Creates a new product in the store catalog.
     */
    @PostMapping
    @RequirePermission("catalog.create")
    public ResponseEntity<ApiEnvelope<ProductResponse>> createProduct(
            @PathVariable UUID storeId, @RequestBody CreateProductRequest request) {

        if (request == null || request.name() == null || request.name().isBlank() || request.costPrice() == null) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "name and costPrice are required")));
        }

        TenantContext context = RequestContextHolder.get();
        if (context.accountId() == null) {
            return ResponseEntity.status(401)
                    .body(ApiEnvelope.fail(ApiError.of("UNAUTHORIZED", "accountId is required in tenant context")));
        }
        UUID accountId = context.accountId();

        String currency = request.currency();
        if (currency == null || currency.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "currency is required")));
        }
        String pricingMode = request.pricingMode() != null ? request.pricingMode() : "markup";

        Product product;
        if ("fixed".equalsIgnoreCase(pricingMode)) {
            if (request.sellingPrice() == null) {
                return ResponseEntity.badRequest()
                        .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "sellingPrice required for fixed pricing")));
            }
            product = Product.withFixedPrice(storeId, accountId, request.name(), request.sku(),
                    request.category(), request.costPrice(), request.sellingPrice(), currency);
        } else {
            BigDecimal markup = request.markupPercent() != null ? request.markupPercent() : BigDecimal.ZERO;
            product = Product.withMarkup(storeId, accountId, request.name(), request.sku(),
                    request.category(), request.costPrice(), markup, currency);
        }

        product = productRepository.save(product);
        ProductResponse response = ProductResponse.from(product);
        return ResponseEntity
                .created(URI.create("/api/v1/stores/" + storeId + "/products/" + product.getId()))
                .body(ApiEnvelope.ok(response));
    }

    /**
     * Lists all products in the specified store.
     */
    @GetMapping
    @RequirePermission("catalog.view")
    public ResponseEntity<ApiEnvelope<List<ProductResponse>>> listProducts(@PathVariable UUID storeId) {
        UUID accountId = requireAccountId();
        if (accountId == null) {
            return ResponseEntity.status(401)
                    .body(ApiEnvelope.fail(ApiError.of("UNAUTHORIZED", "accountId is required in tenant context")));
        }
        List<ProductResponse> products = productRepository.findByStoreIdAndAccountId(storeId, accountId)
                .stream()
                .map(ProductResponse::from)
                .toList();
        return ResponseEntity.ok(ApiEnvelope.ok(products));
    }

    @GetMapping("/{productId}")
    @RequirePermission("catalog.view")
    public ResponseEntity<ApiEnvelope<ProductResponse>> getProduct(
            @PathVariable UUID storeId, @PathVariable UUID productId) {
        UUID accountId = requireAccountId();
        if (accountId == null) {
            return ResponseEntity.status(401)
                    .body(ApiEnvelope.fail(ApiError.of("UNAUTHORIZED", "accountId is required in tenant context")));
        }
        return productRepository.findByIdAndStoreIdAndAccountId(productId, storeId, accountId)
                .map(product -> ResponseEntity.ok(ApiEnvelope.ok(ProductResponse.from(product))))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private UUID requireAccountId() {
        return RequestContextHolder.get().accountId();
    }
}
