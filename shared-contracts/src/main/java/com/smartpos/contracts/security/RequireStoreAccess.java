package com.smartpos.contracts.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to require store access validation for store-scoped endpoints.
 *
 * <p>The annotated method's path must include a {storeId} path variable.
 * The interceptor verifies the current user has access to that store.</p>
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireStoreAccess {
}
