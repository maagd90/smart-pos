package com.smartpos.refunds;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Refunds Service microservice application.
 */
@SpringBootApplication
@EnableScheduling
public class RefundsServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(RefundsServiceApplication.class, args);
    }
}
