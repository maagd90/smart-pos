package com.smartpos.identityaccess;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Identity and Access Service microservice application.
 *
 * <p><strong>Milestone 1:</strong> Runnable skeleton with health endpoint,
 * database connectivity, Flyway migrations, Kafka connectivity, and
 * Eureka registration. Business logic is implemented in subsequent milestones.</p>
 */
@SpringBootApplication(scanBasePackages = {"com.smartpos.identityaccess", "com.smartpos.identity"})
@EntityScan(basePackages = "com.smartpos.identity.domain")
@EnableJpaRepositories(basePackages = "com.smartpos.identity.domain")
public class IdentityAccessServiceApplication {

    /**
     * Application entry point.
     *
     * @param args command-line arguments
     */
    public static void main(String[] args) {
        SpringApplication.run(IdentityAccessServiceApplication.class, args);
    }
}
