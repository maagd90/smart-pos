package com.smartpos.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * API Gateway - the single public entry point for all client requests.
 *
 * <p>Responsibilities:</p>
 * <ul>
 *   <li>JWT validation and authentication</li>
 *   <li>Rate limiting via Redis</li>
 *   <li>Subscription gate enforcement</li>
 *   <li>Request routing to downstream services via Eureka discovery</li>
 *   <li>Forwarding authenticated user context as headers</li>
 * </ul>
 */
@SpringBootApplication
public class ApiGatewayApplication {

    /**
     * Application entry point.
     *
     * @param args command-line arguments
     */
    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
