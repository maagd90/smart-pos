package com.smartpos.sales.config;

import com.smartpos.contracts.security.SecurityWebMvcConfigurer;
import org.springframework.context.annotation.Configuration;

/**
 * Registers the shared security interceptor for permission and store-access enforcement.
 */
@Configuration
public class SecurityConfig extends SecurityWebMvcConfigurer {
}
