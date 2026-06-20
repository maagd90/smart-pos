package com.smartpos.contracts.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.context.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerMapping;

class SecurityInterceptorTest {

    private final SecurityInterceptor interceptor = new SecurityInterceptor();
    private final UUID storeA = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private final UUID storeB = UUID.fromString("33333333-3333-3333-3333-333333333333");

    @BeforeEach
    void setUp() {
        RequestContextHolder.clear();
    }

    @AfterEach
    void tearDown() {
        RequestContextHolder.clear();
    }

    @Test
    void deniesStoreAccessForCashierAssignedToDifferentStore() throws Exception {
        TenantContext context = new TenantContext(
                UUID.randomUUID(),
                UUID.randomUUID(),
                null,
                false,
                Set.of("sale.create"),
                "corr-1",
                false,
                Set.of(storeA));
        RequestContextHolder.set(context);

        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        StringWriter body = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(body));
        when(request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE)).thenReturn(Map.of("storeId", storeB.toString()));

        HandlerMethod handler = handlerMethod(SecuredController.class, "storeEndpoint");

        assertFalse(interceptor.preHandle(request, response, handler));
    }

    @Test
    void deniesMissingPermissionEvenWithStoreAccess() throws Exception {
        TenantContext context = new TenantContext(
                UUID.randomUUID(),
                UUID.randomUUID(),
                null,
                false,
                Set.of("sale.view"),
                "corr-2",
                false,
                Set.of(storeA));
        RequestContextHolder.set(context);

        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        StringWriter body = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(body));
        when(request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE)).thenReturn(Map.of("storeId", storeA.toString()));

        HandlerMethod handler = handlerMethod(SecuredController.class, "createSale");

        assertFalse(interceptor.preHandle(request, response, handler));
    }

    @Test
    void allowsRequestWithPermissionAndStoreAccess() throws Exception {
        TenantContext context = new TenantContext(
                UUID.randomUUID(),
                UUID.randomUUID(),
                null,
                false,
                Set.of("sale.create"),
                "corr-3",
                false,
                Set.of(storeA));
        RequestContextHolder.set(context);

        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        when(request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE)).thenReturn(Map.of("storeId", storeA.toString()));

        HandlerMethod handler = handlerMethod(SecuredController.class, "createSale");

        assertTrue(interceptor.preHandle(request, response, handler));
    }

    private HandlerMethod handlerMethod(Class<?> type, String methodName) throws NoSuchMethodException {
        return new HandlerMethod(new SecuredController(), type.getMethod(methodName));
    }

    @RequireStoreAccess
    static class SecuredController {
        public void storeEndpoint() {}

        @RequirePermission("sale.create")
        public void createSale() {}
    }
}
