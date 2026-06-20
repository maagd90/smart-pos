# Builds inventory-service independently using smartpos-parent + shared-contracts only.
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY smartpos-parent/pom.xml ./smartpos-parent/pom.xml
COPY shared-contracts/pom.xml ./shared-contracts/pom.xml
COPY shared-contracts/src ./shared-contracts/src
COPY services/inventory-service/pom.xml ./services/inventory-service/pom.xml
COPY services/inventory-service/src ./services/inventory-service/src
RUN mvn -q -f smartpos-parent/pom.xml install -N -DskipTests
RUN mvn -q -f shared-contracts/pom.xml install -DskipTests
RUN mvn -q -f services/inventory-service/pom.xml test package -DskipTests

FROM eclipse-temurin:17-jre-alpine
RUN apk add --no-cache wget
WORKDIR /app
COPY --from=build /workspace/services/inventory-service/target/*.jar app.jar
EXPOSE 8105
ENTRYPOINT ["java", "-Xmx384m", "-XX:+UseSerialGC", "-jar", "app.jar"]
