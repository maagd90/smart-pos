package com.smartpos.contracts.security;

import com.smartpos.contracts.context.RequestContextHolder;
import com.smartpos.contracts.context.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import java.util.UUID;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

/**
 * Shared interceptor that enforces permission and store-access checks
 * based on {@link RequirePermission} and {@link RequireStoreAccess} annotations.
 *
 * <p>Register this interceptor in each service's WebMvcConfigurer to
 * automatically enforce security without per-controller boilerplate.</p>
 *
 * <p>Maps {@link SecurityException} → HTTP 403.</p>
 */
public class SecurityInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        TenantContext context = RequestContextHolder.get();

        // Check RequirePermission on method or class
        RequirePermission methodPerm = handlerMethod.getMethodAnnotation(RequirePermission.class);
        RequirePermission classPerm = handlerMethod.getBeanType().getAnnotation(RequirePermission.class);
        RequirePermission permission = methodPerm != null ? methodPerm : classPerm;

        if (permission != null) {
            if (context.userId() == null) {
                response.setStatus(401);
                response.setContentType("application/json");
                response.getWriter().write("{\"success\":false,\"error\":{\"code\":\"UNAUTHORIZED\",\"message\":\"Authentication required\"}}");
                return false;
            }
            if (!context.platformAdmin() && !context.hasPermission(permission.value())) {
                response.setStatus(403);
                response.setContentType("application/json");
                response.getWriter().write("{\"success\":false,\"error\":{\"code\":\"FORBIDDEN\",\"message\":\"Missing permission: " + permission.value() + "\"}}");
                return false;
            }
        }

        // Check RequireStoreAccess on method or class
        RequireStoreAccess methodStore = handlerMethod.getMethodAnnotation(RequireStoreAccess.class);
        RequireStoreAccess classStore = handlerMethod.getBeanType().getAnnotation(RequireStoreAccess.class);

        if (methodStore != null || classStore != null) {
            if (context.userId() == null) {
                response.setStatus(401);
                response.setContentType("application/json");
                response.getWriter().write("{\"success\":false,\"error\":{\"code\":\"UNAUTHORIZED\",\"message\":\"Authentication required\"}}");
                return false;
            }

            // Extract storeId from path variables
            @SuppressWarnings("unchecked")
            Map<String, String> pathVars = (Map<String, String>) request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
            if (pathVars != null && pathVars.containsKey("storeId")) {
                UUID storeId;
                try {
                    storeId = UUID.fromString(pathVars.get("storeId"));
                } catch (IllegalArgumentException e) {
                    response.setStatus(400);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"success\":false,\"error\":{\"code\":\"INVALID_STORE_ID\",\"message\":\"Invalid store ID format\"}}");
                    return false;
                }

                if (!context.hasStoreAccess(storeId)) {
                    response.setStatus(403);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"success\":false,\"error\":{\"code\":\"FORBIDDEN\",\"message\":\"Access denied to store: " + storeId + "\"}}");
                    return false;
                }
            }
        }

        return true;
    }
}
