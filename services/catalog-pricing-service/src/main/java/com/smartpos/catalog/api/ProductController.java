package com.smartpos.catalog.api;

import com.smartpos.catalog.api.dto.CreateProductRequest;
import com.smartpos.catalog.api.dto.ProductResponse;
import com.smartpos.catalog.api.dto.ProductSaleInfoResponse;
import com.smartpos.catalog.api.dto.ProrationTierRequest;
import com.smartpos.catalog.api.dto.UpdateProductRequest;
import com.smartpos.catalog.domain.ProrationTier;
import com.smartpos.catalog.domain.Product;
import com.smartpos.catalog.domain.ProductRepository;
import com.smartpos.catalog.domain.StoreRefundPolicy;
import com.smartpos.catalog.service.RefundPolicyResolver;
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
import org.springframework.web.bind.annotation.PutMapping;
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
    private final RefundPolicyResolver policyResolver;

    public ProductController(ProductRepository productRepository, RefundPolicyResolver policyResolver) {
        this.productRepository = productRepository;
        this.policyResolver = policyResolver;
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

    @GetMapping("/{productId}/sale-info")
    @RequirePermission("catalog.view")
    public ResponseEntity<ApiEnvelope<ProductSaleInfoResponse>> getSaleInfo(
            @PathVariable UUID storeId, @PathVariable UUID productId) {
        UUID accountId = requireAccountId();
        if (accountId == null) {
            return ResponseEntity.status(401)
                    .body(ApiEnvelope.fail(ApiError.of("UNAUTHORIZED", "accountId is required in tenant context")));
        }
        return productRepository.findByIdAndStoreIdAndAccountId(productId, storeId, accountId)
                .map(product -> {
                    StoreRefundPolicy storePolicy = policyResolver.getOrCreateStorePolicy(storeId, accountId);
                    return ResponseEntity.ok(ApiEnvelope.ok(
                            ProductSaleInfoResponse.from(policyResolver.resolve(product, storePolicy))));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{productId}")
    @RequirePermission("catalog.edit")
    public ResponseEntity<ApiEnvelope<ProductResponse>> updateProduct(
            @PathVariable UUID storeId, @PathVariable UUID productId,
            @RequestBody UpdateProductRequest request) {
        UUID accountId = requireAccountId();
        if (accountId == null) {
            return ResponseEntity.status(401)
                    .body(ApiEnvelope.fail(ApiError.of("UNAUTHORIZED", "accountId is required in tenant context")));
        }
        if (request == null || request.name() == null || request.name().isBlank() || request.costPrice() == null) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "name and costPrice are required")));
        }

        var productOpt = productRepository.findByIdAndStoreIdAndAccountId(productId, storeId, accountId);
        if (productOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Product product = productOpt.get();
        String pricingMode = request.pricingMode() != null ? request.pricingMode() : product.getPricingMode();
        BigDecimal sellingPrice = product.getSellingPrice();
        BigDecimal markupPercent = product.getMarkupPercent();
        if ("fixed".equalsIgnoreCase(pricingMode)) {
            if (request.sellingPrice() == null) {
                return ResponseEntity.badRequest()
                        .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "sellingPrice required for fixed pricing")));
            }
            sellingPrice = request.sellingPrice();
            markupPercent = null;
        } else {
            markupPercent = request.markupPercent() != null ? request.markupPercent() : BigDecimal.ZERO;
            sellingPrice = request.costPrice().multiply(
                    BigDecimal.ONE.add(markupPercent.divide(BigDecimal.valueOf(100), 10, java.math.RoundingMode.HALF_UP)))
                    .setScale(2, java.math.RoundingMode.HALF_UP);
        }
        product.updateDetails(request.name(), request.sku(), request.category(),
                request.costPrice(), pricingMode, markupPercent, sellingPrice);

        String tiersJson = null;
        if (request.refundProrationTiers() != null) {
            try {
                List<ProrationTier> tiers = request.refundProrationTiers().stream()
                        .map(t -> new ProrationTier(t.withinDays(), t.refundPct()))
                        .toList();
                tiersJson = policyResolver.validateAndSerializeTiers(tiers);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest()
                        .body(ApiEnvelope.fail(ApiError.of("INVALID_TIERS", e.getMessage())));
            }
        }
        product.updatePolicy(request.refundable(), request.refundWindowDays(),
                request.exchangeable(), request.exchangeWindowDays(),
                request.restockingFeePct(), request.restockingFeeFlat(), tiersJson);
        product = productRepository.save(product);
        return ResponseEntity.ok(ApiEnvelope.ok(ProductResponse.from(product)));
    }

    private UUID requireAccountId() {
        return RequestContextHolder.get().accountId();
    }
}
