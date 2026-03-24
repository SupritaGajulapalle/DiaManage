FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY . .

RUN chmod +x mvnw
RUN ./mvnw install -DskipTests

EXPOSE 10000

CMD ["java", "-Dserver.port=10000", "-jar", "target/diamanage_backend-0.0.1-SNAPSHOT.jar"]
