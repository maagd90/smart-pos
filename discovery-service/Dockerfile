FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY pom.xml .
COPY shared-contracts ./shared-contracts
COPY discovery-service/pom.xml ./discovery-service/pom.xml
COPY discovery-service/src ./discovery-service/src
RUN mvn -q -DskipTests -pl shared-contracts,discovery-service -am package

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /workspace/discovery-service/target/*.jar app.jar
EXPOSE 8761
ENTRYPOINT ["java", "-jar", "app.jar"]
