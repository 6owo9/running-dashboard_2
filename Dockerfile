# Stage 1: 프론트엔드 빌드
FROM node:20-alpine AS frontend
RUN npm install -g pnpm
WORKDIR /app
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ .
RUN pnpm build

# Stage 2: 백엔드 빌드 (프론트 dist를 static으로 복사)
FROM eclipse-temurin:21-jdk-alpine AS backend
WORKDIR /app
COPY backend/ .
COPY --from=frontend /app/dist/ src/main/resources/static/
RUN chmod +x gradlew && ./gradlew bootJar --no-daemon -x test

# Stage 3: 실행
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=backend /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
