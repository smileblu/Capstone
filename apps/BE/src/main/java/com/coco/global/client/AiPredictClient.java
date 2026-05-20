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
     * 주간 배출량 → 이상치 보간 + auto_arima + 드리프트 보정 후 N주 예측.
     * 실패 시 null 반환 → 서비스에서 fallback 처리.
     */
    public WeeklyBaselineResponse predictWeekly(List<WeeklyPoint> data, int horizon) {
        try {
            return restClient.post()
                    .uri("/predict-weekly")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new PredictWeeklyRequest(data, horizon))
                    .retrieve()
                    .body(WeeklyBaselineResponse.class);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 기업 프로필을 보내고 탄소 감축 시나리오 3개를 LLM으로 받는다.
     * 실패 시 null 반환 → 서비스에서 fallback 사용.
     */
    public CompanyScenarioResponse companyScenario(CompanyProfile profile) {
        try {
            return restClient.post()
                    .uri("/company-scenario")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(profile)
                    .retrieve()
                    .body(CompanyScenarioResponse.class);
        } catch (Exception e) {
            return null;
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

    // ── Request / Response DTOs ───────────────────────────────────────────────

    @Getter
    @AllArgsConstructor
    public static class MonthlyPoint {
        private String date;
        @JsonProperty("emission_kg")
        private double emissionKg;
    }

    @Getter
    @AllArgsConstructor
    public static class WeeklyPoint {
        private String week;
        @JsonProperty("emission_kg")
        private double emissionKg;
    }

    @Getter
    @AllArgsConstructor
    private static class PredictWeeklyRequest {
        private List<WeeklyPoint> data;
        private int horizon;
    }

    @Getter
    @NoArgsConstructor
    public static class WeeklyBaselineResponse {
        @JsonProperty("forecast_kg")
        private List<Double> forecastKg;
        @JsonProperty("outlier_count")
        private int outlierCount;
    }

    @Getter
    @AllArgsConstructor
    public static class UserProfile {
        @JsonProperty("top_transport_mode")
        private String topTransportMode;
        @JsonProperty("top_consumption_category")
        private String topConsumptionCategory;
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
        @JsonProperty("reduction_rate")
        private Double reductionRate;
    }

    @Getter
    @NoArgsConstructor
    private static class PersonalizeResponse {
        private List<PersonalizedScenario> scenarios;
    }

    @Getter
    @AllArgsConstructor
    public static class CompanyProfile {
        @JsonProperty("industry")
        private String industry;
        @JsonProperty("management_purpose")
        private String managementPurpose;
        @JsonProperty("top_emission_type")
        private String topEmissionType;
        @JsonProperty("total_emission_kg_3m_avg")
        private double totalEmissionKg3mAvg;
        @JsonProperty("mom_change_rate")
        private double momChangeRate;
        @JsonProperty("scope1_ratio")
        private double scope1Ratio;
        @JsonProperty("scope2_ratio")
        private double scope2Ratio;
        @JsonProperty("scope3_ratio")
        private double scope3Ratio;
    }

    @Getter
    @NoArgsConstructor
    public static class CompanyScenarioItem {
        @JsonProperty("scenario_id")
        private String scenarioId;
        private String title;
        private String description;
        @JsonProperty("reduction_rate")
        private double reductionRate;
    }

    @Getter
    @NoArgsConstructor
    public static class CompanyScenarioResponse {
        private List<CompanyScenarioItem> scenarios;
    }
}
