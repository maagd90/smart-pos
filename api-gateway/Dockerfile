FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY smartpos-parent/pom.xml ./smartpos-parent/pom.xml
COPY shared-contracts/pom.xml ./shared-contracts/pom.xml
COPY shared-contracts/src ./shared-contracts/src
COPY api-gateway/pom.xml ./api-gateway/pom.xml
COPY api-gateway/src ./api-gateway/src
RUN mvn -q -f smartpos-parent/pom.xml install -N -DskipTests
RUN mvn -q -f shared-contracts/pom.xml install -DskipTests
RUN mvn -q -f api-gateway/pom.xml package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /workspace/api-gateway/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
