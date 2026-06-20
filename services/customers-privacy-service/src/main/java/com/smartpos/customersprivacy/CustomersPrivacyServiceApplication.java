package com.smartpos.customersprivacy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Customers and Privacy Service microservice application.
 *
 * <p><strong>Milestone 1:</strong> Runnable skeleton with health endpoint,
 * database connectivity, Flyway migrations, Kafka connectivity, and
 * Eureka registration. Business logic is implemented in subsequent milestones.</p>
 */
@SpringBootApplication
public class CustomersPrivacyServiceApplication {

    /**
     * Application entry point.
     *
     * @param args command-line arguments
     */
    public static void main(String[] args) {
        SpringApplication.run(CustomersPrivacyServiceApplication.class, args);
    }
}
