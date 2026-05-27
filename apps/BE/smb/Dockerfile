# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk-jammy AS builder

WORKDIR /workspace

# Gradle wrapper 및 설정 파일 먼저 복사 (의존성 캐시 레이어 분리)
COPY gradlew gradlew.bat ./
COPY gradle/ gradle/
COPY build.gradle settings.gradle ./

# 의존성 다운로드 (소스 변경 시 이 레이어는 재사용됨)
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon -q

# 소스 복사 후 빌드
COPY src/ src/
RUN ./gradlew bootJar --no-daemon -x test

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# 빌드된 JAR 복사
COPY --from=builder /workspace/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
