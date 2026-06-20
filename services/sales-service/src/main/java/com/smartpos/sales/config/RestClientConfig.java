package com.smartpos.sales.config;

import com.smartpos.contracts.context.TenantContextRestTemplateInterceptor;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * Configuration for REST clients used by the sales service.
 */
@Configuration
public class RestClientConfig {

    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setInterceptors(List.of(new TenantContextRestTemplateInterceptor()));
        return restTemplate;
    }
}
