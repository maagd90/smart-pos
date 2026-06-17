package com.smartpos.catalog.api;

import com.smartpos.catalog.api.dto.CreateProductRequest;
import com.smartpos.catalog.api.dto.ProductResponse;
import com.smartpos.catalog.domain.Product;
import com.smartpos.catalog.domain.ProductRepository;
import com.smartpos.contracts.api.ApiEnvelope;
import com.smartpos.contracts.api.ApiError;
import com.smartpos.contracts.context.RequestContextHolder;
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
 *
 * <p>All endpoints are scoped to a specific store via the path variable.
 * Supports both markup-based and fixed pricing modes.</p>
 */
@RestController
@RequestMapping("/api/v1/stores/{storeId}/products")
public class ProductController {

    private static final UUID DEFAULT_ACCOUNT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final ProductRepository productRepository;

    /**
     * Creates the product controller.
     *
     * @param productRepository repository for product persistence
     */
    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    /**
     * Creates a new product in the store catalog.
     *
     * <p>Pricing is calculated based on the pricingMode:</p>
     * <ul>
     *   <li>markup: sellingPrice = costPrice * (1 + markupPercent/100)</li>
     *   <li>fixed: sellingPrice is provided directly</li>
     * </ul>
     *
     * @param storeId the store to add the product to
     * @param request the product creation request
     * @return the created product
     */
    @PostMapping
    public ResponseEntity<ApiEnvelope<ProductResponse>> createProduct(
            @PathVariable UUID storeId, @RequestBody CreateProductRequest request) {

        if (request == null || request.name() == null || request.name().isBlank() || request.costPrice() == null) {
            return ResponseEntity.badRequest()
                    .body(ApiEnvelope.fail(ApiError.of("INVALID_REQUEST", "name and costPrice are required")));
        }

        UUID accountId = RequestContextHolder.get().accountId() != null
                ? RequestContextHolder.get().accountId()
                : DEFAULT_ACCOUNT_ID;
        String currency = request.currency() != null ? request.currency() : "AED";
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
     *
     * @param storeId the store to list products for
     * @return list of products
     */
    @GetMapping
    public ResponseEntity<ApiEnvelope<List<ProductResponse>>> listProducts(@PathVariable UUID storeId) {
        List<ProductResponse> products = productRepository.findByStoreId(storeId)
                .stream()
                .map(ProductResponse::from)
                .toList();
        return ResponseEntity.ok(ApiEnvelope.ok(products));
    }

    /**
     * Gets a specific product by ID.
     *
     * @param storeId the store the product belongs to
     * @param productId the product ID
     * @return the product if found
     */
    @GetMapping("/{productId}")
    public ResponseEntity<ApiEnvelope<ProductResponse>> getProduct(
            @PathVariable UUID storeId, @PathVariable UUID productId) {
        return productRepository.findByIdAndStoreId(productId, storeId)
                .map(product -> ResponseEntity.ok(ApiEnvelope.ok(ProductResponse.from(product))))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
