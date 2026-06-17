package com.smartpos.contracts.context;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.Collections;
import java.util.Set;
import java.util.UUID;

/**
 * Servlet filter that extracts gateway-forwarded headers and populates the
 * thread-local {@link RequestContextHolder} with the current tenant context.
 *
 * <p>This filter must be registered in every domain service. It reads the
 * following headers set by the API gateway after JWT validation:</p>
 * <ul>
 *   <li>X-User-Id</li>
 *   <li>X-Account-Id</li>
 *   <li>X-Store-Id</li>
 *   <li>X-Platform-Admin</li>
 *   <li>X-Permissions</li>
 *   <li>X-Correlation-Id</li>
 * </ul>
 *
 * <p><strong>Milestone 1 stub:</strong> This filter trusts the headers as-is.
 * Full validation against the Identity service will be added in Milestone 2.</p>
 */
public class RequestContextFilter implements Filter {

    /** Header name for the authenticated user ID. */
    public static final String HEADER_USER_ID = "X-User-Id";
    /** Header name for the tenant account ID. */
    public static final String HEADER_ACCOUNT_ID = "X-Account-Id";
    /** Header name for the current store context. */
    public static final String HEADER_STORE_ID = "X-Store-Id";
    /** Header name for the platform admin flag. */
    public static final String HEADER_PLATFORM_ADMIN = "X-Platform-Admin";
    /** Header name for the comma-separated permission keys. */
    public static final String HEADER_PERMISSIONS = "X-Permissions";
    /** Header name for the request correlation identifier. */
    public static final String HEADER_CORRELATION_ID = "X-Correlation-Id";

    /**
     * Extracts tenant context from gateway-forwarded headers and populates
     * the thread-local holder for the duration of the request.
     *
     * @param request the servlet request
     * @param response the servlet response
     * @param chain the filter chain
     * @throws IOException if an I/O error occurs
     * @throws ServletException if a servlet error occurs
     */
    /** Header name for account-wide access flag. */
    public static final String HEADER_ACCOUNT_WIDE_ACCESS = "X-Account-Wide-Access";
    /** Header name for comma-separated accessible store IDs. */
    public static final String HEADER_ACCESSIBLE_STORES = "X-Accessible-Stores";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        try {
            if (request instanceof HttpServletRequest httpRequest) {
                TenantContext context = extractContext(httpRequest);
                RequestContextHolder.set(context);
            }
            chain.doFilter(request, response);
        } finally {
            RequestContextHolder.clear();
        }
    }

    private TenantContext extractContext(HttpServletRequest request) {
        UUID userId = parseUuid(request.getHeader(HEADER_USER_ID));
        UUID accountId = parseUuid(request.getHeader(HEADER_ACCOUNT_ID));
        UUID storeId = parseUuid(request.getHeader(HEADER_STORE_ID));
        boolean platformAdmin = "true".equalsIgnoreCase(request.getHeader(HEADER_PLATFORM_ADMIN));
        Set<String> permissions = parsePermissions(request.getHeader(HEADER_PERMISSIONS));
        String correlationId = request.getHeader(HEADER_CORRELATION_ID);
        boolean accountWideAccess = "true".equalsIgnoreCase(request.getHeader(HEADER_ACCOUNT_WIDE_ACCESS));
        Set<UUID> accessibleStores = parseUuidSet(request.getHeader(HEADER_ACCESSIBLE_STORES));

        return new TenantContext(userId, accountId, storeId, platformAdmin, permissions,
                correlationId, accountWideAccess, accessibleStores);
    }

    private UUID parseUuid(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private Set<String> parsePermissions(String value) {
        if (value == null || value.isBlank()) return Collections.emptySet();
        Set<String> result = new java.util.HashSet<>();
        for (String token : value.split(",")) {
            String trimmed = token.trim();
            if (!trimmed.isEmpty()) {
                result.add(trimmed);
            }
        }
        return Collections.unmodifiableSet(result);
    }

    private Set<UUID> parseUuidSet(String value) {
        if (value == null || value.isBlank()) return Collections.emptySet();
        Set<UUID> result = new java.util.HashSet<>();
        for (String token : value.split(",")) {
            String trimmed = token.trim();
            if (!trimmed.isEmpty()) {
                try {
                    result.add(UUID.fromString(trimmed));
                } catch (IllegalArgumentException e) {
                    // skip invalid UUIDs
                }
            }
        }
        return Collections.unmodifiableSet(result);
    }
}
