package com.coco.global.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Component
public class AiPredictClient {

    private final RestClient restClient;

    public AiPredictClient(@Value("${ai.base-url}") String baseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    /**
     * Python AI 서버에 월별 배출량 데이터를 보내고 다음 달 예측값을 받는다.
     * 통신 실패 시 최근 달 값의 90%를 fallback으로 반환.
     */
    public double predict(List<MonthlyPoint> data) {
        try {
            PredictResponse response = restClient.post()
                    .uri("/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new PredictRequest(data))
                    .retrieve()
                    .body(PredictResponse.class);
            return response != null ? response.getPredictedKg() : fallback(data);
        } catch (Exception e) {
            return fallback(data);
        }
    }

    /**
     * 사용자 활동 프로필을 보내고 개인 맞춤 시나리오 텍스트 목록을 받는다.
     * 실패 시 null 반환 → 서비스에서 DB 기본 텍스트 사용.
     */
    public List<PersonalizedScenario> personalize(UserProfile profile) {
        try {
            PersonalizeResponse response = restClient.post()
                    .uri("/personalize")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(profile)
                    .retrieve()
                    .body(PersonalizeResponse.class);
            return response != null ? response.getScenarios() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private double fallback(List<MonthlyPoint> data) {
        if (data.isEmpty()) return 100.0;
        return data.get(data.size() - 1).getEmissionKg() * 0.9;
    }

    @Getter
    @AllArgsConstructor
    public static class MonthlyPoint {
        private String date;
        @JsonProperty("emission_kg")
        private double emissionKg;
    }

    @Getter
    @AllArgsConstructor
    private static class PredictRequest {
        private List<MonthlyPoint> data;
    }

    @Getter
    @NoArgsConstructor
    private static class PredictResponse {
        @JsonProperty("predicted_kg")
        private double predictedKg;
    }

    @Getter
    @AllArgsConstructor
    public static class UserProfile {
        @JsonProperty("top_transport_mode")
        private String topTransportMode;        // "CAR" | "BUS" | "SUBWAY" | "BIKE" | "WALK" | "NONE"
        @JsonProperty("top_consumption_category")
        private String topConsumptionCategory;  // "food" | "clothing" | "electronics" | "other" | "NONE"
        @JsonProperty("transport_kg")
        private double transportKg;
        @JsonProperty("electricity_kg")
        private double electricityKg;
        @JsonProperty("consumption_kg")
        private double consumptionKg;
    }

    @Getter
    @NoArgsConstructor
    public static class PersonalizedScenario {
        @JsonProperty("scenario_id")
        private String scenarioId;
        private String title;
        private String subtitle;
    }

    @Getter
    @NoArgsConstructor
    private static class PersonalizeResponse {
        private List<PersonalizedScenario> scenarios;
    }
}
