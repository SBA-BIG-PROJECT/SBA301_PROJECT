# Build stage
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -XX:+TieredCompilation -XX:TieredStopAtLevel=1 -XX:ReservedCodeCacheSize=48m -Xss256k -Xmx160m -Xms80m -XX:+UseSerialGC $JAVA_TOOL_OPTIONS -Dserver.port=${PORT} -jar app.jar"]
