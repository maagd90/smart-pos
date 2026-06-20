package com.smartpos.contracts.context;

import java.io.IOException;
import java.util.stream.Collectors;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;

/**
 * Propagates the current {@link TenantContext} as gateway-style headers on outbound REST calls.
 */
public class TenantContextRestTemplateInterceptor implements ClientHttpRequestInterceptor {

    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution)
            throws IOException {
        TenantContext context = RequestContextHolder.get();
        if (context != null) {
            if (context.userId() != null) {
                request.getHeaders().set(RequestContextFilter.HEADER_USER_ID, context.userId().toString());
            }
            if (context.accountId() != null) {
                request.getHeaders().set(RequestContextFilter.HEADER_ACCOUNT_ID, context.accountId().toString());
            }
            if (context.storeId() != null) {
                request.getHeaders().set(RequestContextFilter.HEADER_STORE_ID, context.storeId().toString());
            }
            request.getHeaders().set(RequestContextFilter.HEADER_PLATFORM_ADMIN, String.valueOf(context.platformAdmin()));
            request.getHeaders().set(RequestContextFilter.HEADER_ACCOUNT_WIDE_ACCESS,
                    String.valueOf(context.accountWideAccess()));
            if (context.permissions() != null && !context.permissions().isEmpty()) {
                request.getHeaders().set(RequestContextFilter.HEADER_PERMISSIONS,
                        String.join(",", context.permissions()));
            }
            if (context.accessibleStores() != null && !context.accessibleStores().isEmpty()) {
                request.getHeaders().set(RequestContextFilter.HEADER_ACCESSIBLE_STORES,
                        context.accessibleStores().stream().map(Object::toString).collect(Collectors.joining(",")));
            }
            if (context.correlationId() != null) {
                request.getHeaders().set(RequestContextFilter.HEADER_CORRELATION_ID, context.correlationId());
            }
        }
        return execution.execute(request, body);
    }
}
