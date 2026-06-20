package com.smartpos.messagingdelivery.config;

import com.smartpos.contracts.context.RequestContextFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registers the request context filter that extracts gateway-forwarded
 * tenant and user identity headers into thread-local storage.
 *
 * <p>This makes the {@link com.smartpos.contracts.context.RequestContextHolder}
 * available throughout the request lifecycle for authorization and data-scoping.</p>
 */
@Configuration
public class RequestContextConfig {

    /**
     * Registers the request context filter with highest priority.
     *
     * @return the filter registration bean
     */
    @Bean
    public FilterRegistrationBean<RequestContextFilter> smartposRequestContextFilterRegistration() {
        FilterRegistrationBean<RequestContextFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new RequestContextFilter());
        registration.addUrlPatterns("/api/*");
        registration.setOrder(1);
        return registration;
    }
}
