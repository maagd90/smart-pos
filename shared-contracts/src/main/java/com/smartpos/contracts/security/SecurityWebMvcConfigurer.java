package com.smartpos.contracts.security;

import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Auto-configuration for the security interceptor.
 *
 * <p>Services import this class in their configuration to automatically
 * register the SecurityInterceptor for permission/store-access checks.</p>
 */
public class SecurityWebMvcConfigurer implements WebMvcConfigurer {

    private final SecurityInterceptor securityInterceptor;

    public SecurityWebMvcConfigurer() {
        this.securityInterceptor = new SecurityInterceptor();
    }

    public SecurityWebMvcConfigurer(SecurityInterceptor securityInterceptor) {
        this.securityInterceptor = securityInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(securityInterceptor)
                .addPathPatterns("/api/**");
    }
}
