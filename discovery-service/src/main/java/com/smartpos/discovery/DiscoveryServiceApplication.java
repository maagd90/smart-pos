package com.smartpos.discovery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

/**
 * Eureka-based service discovery server for local development.
 *
 * <p>All microservices register with this server and use it to discover
 * each other. In production, Kubernetes DNS replaces this component.</p>
 */
@EnableEurekaServer
@SpringBootApplication
public class DiscoveryServiceApplication {

    /**
     * Application entry point.
     *
     * @param args command-line arguments
     */
    public static void main(String[] args) {
        SpringApplication.run(DiscoveryServiceApplication.class, args);
    }
}
