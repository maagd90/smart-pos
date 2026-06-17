package com.smartpos.contracts.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to require a specific permission for accessing a controller method.
 *
 * <p>Used with {@link SecurityInterceptor} to automatically enforce
 * permission checks without per-controller boilerplate.</p>
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {
    /**
     * The permission key that must be held by the current user.
     */
    String value();
}
