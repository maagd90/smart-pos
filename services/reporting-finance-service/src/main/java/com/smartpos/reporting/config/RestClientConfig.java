package com.smartpos.reporting.config;

import com.smartpos.contracts.context.TenantContextRestTemplateInterceptor;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestClientConfig {

    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setInterceptors(List.of(new TenantContextRestTemplateInterceptor()));
        return restTemplate;
    }
}
