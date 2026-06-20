FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY smartpos-parent/pom.xml ./smartpos-parent/pom.xml
COPY discovery-service/pom.xml ./discovery-service/pom.xml
COPY discovery-service/src ./discovery-service/src
RUN mvn -q -f smartpos-parent/pom.xml install -N -DskipTests
RUN mvn -q -f discovery-service/pom.xml package -DskipTests

FROM eclipse-temurin:17-jre-alpine
RUN apk add --no-cache wget
WORKDIR /app
COPY --from=build /workspace/discovery-service/target/*.jar app.jar
EXPOSE 8761
ENTRYPOINT ["java", "-Xmx256m", "-XX:+UseSerialGC", "-jar", "app.jar"]
