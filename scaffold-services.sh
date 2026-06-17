#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

services=(
  "identity-access-service:8101:identity_access_db:IdentityAccessServiceApplication"
  "tenant-admin-service:8102:tenant_admin_db:TenantAdminServiceApplication"
  "billing-subscription-service:8103:billing_subscription_db:BillingSubscriptionServiceApplication"
  "catalog-pricing-service:8104:catalog_pricing_db:CatalogPricingServiceApplication"
  "inventory-service:8105:inventory_db:InventoryServiceApplication"
  "sales-service:8106:sales_db:SalesServiceApplication"
  "refunds-service:8107:refunds_db:RefundsServiceApplication"
  "customers-privacy-service:8108:customers_privacy_db:CustomersPrivacyServiceApplication"
  "ai-deals-service:8109:ai_deals_db:AiDealsServiceApplication"
  "notifications-approvals-service:8110:notifications_approvals_db:NotificationsApprovalsServiceApplication"
  "messaging-delivery-service:8111:messaging_delivery_db:MessagingDeliveryServiceApplication"
  "reporting-finance-service:8112:reporting_finance_db:ReportingFinanceServiceApplication"
)

write_file() {
  local path="$1"
  mkdir -p "$(dirname "$path")"
  cat > "$path"
}

write_file pom.xml <<'EOF'
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.smartpos</groupId>
  <artifactId>store-management-platform</artifactId>
  <version>0.1.0-SNAPSHOT</version>
  <packaging>pom</packaging>
  <modules>
    <module>shared-contracts</module>
    <module>discovery-service</module>
    <module>api-gateway</module>
    <module>services/identity-access-service</module>
    <module>services/tenant-admin-service</module>
    <module>services/billing-subscription-service</module>
    <module>services/catalog-pricing-service</module>
    <module>services/inventory-service</module>
    <module>services/sales-service</module>
    <module>services/refunds-service</module>
    <module>services/customers-privacy-service</module>
    <module>services/ai-deals-service</module>
    <module>services/notifications-approvals-service</module>
    <module>services/messaging-delivery-service</module>
    <module>services/reporting-finance-service</module>
  </modules>
  <properties>
    <java.version>17</java.version>
    <spring.boot.version>3.3.5</spring.boot.version>
    <spring.cloud.version>2023.0.3</spring.cloud.version>
    <maven.compiler.release>17</maven.compiler.release>
  </properties>
</project>
EOF

write_file shared-contracts/pom.xml <<'EOF'
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.smartpos</groupId>
  <artifactId>shared-contracts</artifactId>
  <version>0.1.0-SNAPSHOT</version>
  <packaging>jar</packaging>
  <properties><maven.compiler.release>17</maven.compiler.release></properties>
</project>
EOF

write_file shared-contracts/src/main/java/com/smartpos/contracts/auth/AuthPrincipal.java <<'EOF'
package com.smartpos.contracts.auth;

import java.util.Set;
import java.util.UUID;

public record AuthPrincipal(UUID userId, UUID accountId, UUID storeId, boolean platformAdmin, Set<String> permissions) {}
EOF

write_file shared-contracts/src/main/java/com/smartpos/contracts/api/ApiError.java <<'EOF'
package com.smartpos.contracts.api;

import java.time.Instant;
import java.util.Map;

public record ApiError(Instant timestamp, String code, String message, Map<String, Object> details) {
  public static ApiError of(String code, String message) {
    return new ApiError(Instant.now(), code, message, Map.of());
  }
}
EOF

write_file shared-contracts/src/main/java/com/smartpos/contracts/events/DomainEvent.java <<'EOF'
package com.smartpos.contracts.events;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record DomainEvent(UUID eventId, String eventType, UUID accountId, UUID storeId, String aggregateType, UUID aggregateId, Instant occurredAt, Map<String, Object> payload) {}
EOF

write_file discovery-service/pom.xml <<'EOF'
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-parent</artifactId><version>3.3.5</version><relativePath/></parent>
  <groupId>com.smartpos</groupId><artifactId>discovery-service</artifactId><version>0.1.0-SNAPSHOT</version>
  <properties><java.version>17</java.version><spring-cloud.version>2023.0.3</spring-cloud.version></properties>
  <dependencies><dependency><groupId>org.springframework.cloud</groupId><artifactId>spring-cloud-starter-netflix-eureka-server</artifactId></dependency><dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-actuator</artifactId></dependency></dependencies>
  <dependencyManagement><dependencies><dependency><groupId>org.springframework.cloud</groupId><artifactId>spring-cloud-dependencies</artifactId><version>${spring-cloud.version}</version><type>pom</type><scope>import</scope></dependency></dependencies></dependencyManagement>
  <build><plugins><plugin><groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId></plugin></plugins></build>
</project>
EOF

write_file discovery-service/src/main/java/com/smartpos/discovery/DiscoveryServiceApplication.java <<'EOF'
package com.smartpos.discovery;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;
@EnableEurekaServer
@SpringBootApplication
public class DiscoveryServiceApplication { public static void main(String[] args) { SpringApplication.run(DiscoveryServiceApplication.class, args); } }
EOF

write_file discovery-service/src/main/resources/application.yml <<'EOF'
server:
  port: 8761
spring:
  application:
    name: discovery-service
eureka:
  client:
    register-with-eureka: false
    fetch-registry: false
management:
  endpoints:
    web:
      exposure:
        include: health,info
EOF

write_file discovery-service/Dockerfile <<'EOF'
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
RUN mvn -q -DskipTests package
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
EOF

write_file api-gateway/pom.xml <<'EOF'
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-parent</artifactId><version>3.3.5</version><relativePath/></parent>
  <groupId>com.smartpos</groupId><artifactId>api-gateway</artifactId><version>0.1.0-SNAPSHOT</version>
  <properties><java.version>17</java.version><spring-cloud.version>2023.0.3</spring-cloud.version></properties>
  <dependencies><dependency><groupId>org.springframework.cloud</groupId><artifactId>spring-cloud-starter-gateway</artifactId></dependency><dependency><groupId>org.springframework.cloud</groupId><artifactId>spring-cloud-starter-netflix-eureka-client</artifactId></dependency><dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-actuator</artifactId></dependency><dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-data-redis-reactive</artifactId></dependency></dependencies>
  <dependencyManagement><dependencies><dependency><groupId>org.springframework.cloud</groupId><artifactId>spring-cloud-dependencies</artifactId><version>${spring-cloud.version}</version><type>pom</type><scope>import</scope></dependency></dependencies></dependencyManagement>
  <build><plugins><plugin><groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId></plugin></plugins></build>
</project>
EOF

write_file api-gateway/src/main/java/com/smartpos/gateway/ApiGatewayApplication.java <<'EOF'
package com.smartpos.gateway;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication
public class ApiGatewayApplication { public static void main(String[] args) { SpringApplication.run(ApiGatewayApplication.class, args); } }
EOF

write_file api-gateway/src/main/resources/application.yml <<'EOF'
server:
  port: 8080
spring:
  application:
    name: api-gateway
  cloud:
    gateway:
      routes:
        - id: identity-access-service
          uri: lb://identity-access-service
          predicates: [ Path=/api/v1/auth/**,/api/v1/accounts/*/users/** ]
        - id: tenant-admin-service
          uri: lb://tenant-admin-service
          predicates: [ Path=/api/v1/accounts/**,/api/v1/stores/** ]
        - id: catalog-pricing-service
          uri: lb://catalog-pricing-service
          predicates: [ Path=/api/v1/stores/*/products/** ]
        - id: inventory-service
          uri: lb://inventory-service
          predicates: [ Path=/api/v1/stores/*/inventory/** ]
        - id: sales-service
          uri: lb://sales-service
          predicates: [ Path=/api/v1/stores/*/sales/** ]
        - id: refunds-service
          uri: lb://refunds-service
          predicates: [ Path=/api/v1/stores/*/refunds/** ]
        - id: reporting-finance-service
          uri: lb://reporting-finance-service
          predicates: [ Path=/api/v1/stores/*/reports/**,/api/v1/stores/*/expenses/** ]
eureka:
  client:
    service-url:
      defaultZone: ${EUREKA_CLIENT_SERVICEURL_DEFAULTZONE:http://localhost:8761/eureka}
management:
  endpoints:
    web:
      exposure:
        include: health,info,gateway
EOF

write_file api-gateway/Dockerfile <<'EOF'
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
RUN mvn -q -DskipTests package
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
EOF

for entry in "${services[@]}"; do
  IFS=':' read -r svc port db appClass <<< "$entry"
  pkg="$(echo "$svc" | tr -d '-')"
  base="services/$svc"

  write_file "$base/pom.xml" <<EOF
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-parent</artifactId><version>3.3.5</version><relativePath/></parent>
  <groupId>com.smartpos</groupId><artifactId>$svc</artifactId><version>0.1.0-SNAPSHOT</version>
  <properties><java.version>17</java.version><spring-cloud.version>2023.0.3</spring-cloud.version></properties>
  <dependencies>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-actuator</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-data-jpa</artifactId></dependency>
    <dependency><groupId>org.springframework.kafka</groupId><artifactId>spring-kafka</artifactId></dependency>
    <dependency><groupId>org.springframework.cloud</groupId><artifactId>spring-cloud-starter-netflix-eureka-client</artifactId></dependency>
    <dependency><groupId>org.flywaydb</groupId><artifactId>flyway-core</artifactId></dependency>
    <dependency><groupId>org.flywaydb</groupId><artifactId>flyway-database-postgresql</artifactId></dependency>
    <dependency><groupId>org.postgresql</groupId><artifactId>postgresql</artifactId><scope>runtime</scope></dependency>
  </dependencies>
  <dependencyManagement><dependencies><dependency><groupId>org.springframework.cloud</groupId><artifactId>spring-cloud-dependencies</artifactId><version>\${spring-cloud.version}</version><type>pom</type><scope>import</scope></dependency></dependencies></dependencyManagement>
  <build><plugins><plugin><groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId></plugin></plugins></build>
</project>
EOF

  write_file "$base/src/main/java/com/smartpos/$pkg/$appClass.java" <<EOF
package com.smartpos.$pkg;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication
public class $appClass { public static void main(String[] args) { SpringApplication.run($appClass.class, args); } }
EOF

  write_file "$base/src/main/java/com/smartpos/$pkg/api/HealthController.java" <<EOF
package com.smartpos.$pkg.api;
import java.time.Instant;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
@RestController
@RequestMapping("/api/v1")
public class HealthController {
  @GetMapping("/health")
  public Map<String, Object> health() {
    return Map.of("service", "$svc", "status", "UP", "timestamp", Instant.now().toString());
  }
}
EOF

  write_file "$base/src/main/resources/application.yml" <<EOF
server:
  port: \${SERVER_PORT:$port}
spring:
  application:
    name: $svc
  datasource:
    url: \${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/$db}
    username: \${SPRING_DATASOURCE_USERNAME:smartpos}
    password: \${SPRING_DATASOURCE_PASSWORD:smartpos}
  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
  flyway:
    enabled: true
  kafka:
    bootstrap-servers: \${KAFKA_BOOTSTRAP_SERVERS:localhost:29092}
eureka:
  client:
    service-url:
      defaultZone: \${EUREKA_CLIENT_SERVICEURL_DEFAULTZONE:http://localhost:8761/eureka}
management:
  endpoints:
    web:
      exposure:
        include: health,info
EOF

  write_file "$base/src/main/resources/db/migration/V1__baseline.sql" <<EOF
CREATE TABLE IF NOT EXISTS service_metadata (
    id UUID PRIMARY KEY,
    service_name VARCHAR(120) NOT NULL,
    status VARCHAR(40) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_outbox (
    id UUID PRIMARY KEY,
    aggregate_type VARCHAR(120) NOT NULL,
    aggregate_id UUID,
    event_type VARCHAR(160) NOT NULL,
    payload JSONB NOT NULL,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
EOF

  write_file "$base/Dockerfile" <<'EOF'
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
RUN mvn -q -DskipTests package
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
EOF

done

write_file web-client/package.json <<'EOF'
{
  "name": "store-management-web-client",
  "version": "0.1.0",
  "private": true,
  "scripts": { "dev": "vite --host 0.0.0.0 --port 3000", "build": "tsc && vite build", "preview": "vite preview --host 0.0.0.0 --port 3000" },
  "dependencies": { "@vitejs/plugin-react": "latest", "vite": "latest", "typescript": "latest", "react": "latest", "react-dom": "latest" }
}
EOF
write_file web-client/index.html <<'EOF'
<div id="root"></div><script type="module" src="/src/App.tsx"></script>
EOF
write_file web-client/src/App.tsx <<'EOF'
import React from 'react';
import { createRoot } from 'react-dom/client';
function App() { return <main style={{ fontFamily: 'Arial, sans-serif', padding: 32 }}><h1>Store Management System</h1><p>Web client skeleton. Auth and RBAC screens will be implemented after Identity & Tenant services.</p></main>; }
createRoot(document.getElementById('root')!).render(<App />);
EOF

write_file mobile-client/package.json <<'EOF'
{
  "name": "store-management-mobile-client",
  "version": "0.1.0",
  "private": true,
  "scripts": { "start": "expo start", "web": "expo start --web" },
  "dependencies": { "expo": "latest", "react": "latest", "react-native": "latest", "react-native-web": "latest" }
}
EOF
write_file mobile-client/App.tsx <<'EOF'
import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';
export default function App() { return <SafeAreaView><View style={{ padding: 24 }}><Text style={{ fontSize: 24, fontWeight: '700' }}>Store Management Mobile</Text><Text>Inventory manager and store manager flows will be implemented after core services.</Text></View></SafeAreaView>; }
EOF

cat <<'EOF'
Scaffold created successfully.
Next commands:
  cp .env.example .env
  mvn -q -DskipTests package
  docker compose up --build
EOF
