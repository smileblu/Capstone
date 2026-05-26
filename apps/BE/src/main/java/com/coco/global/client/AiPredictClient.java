package com.coco.global.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Component
public class AiPredictClient {

    private final RestClient restClient;
    private final RestClient reportRestClient;   // 60초 타임아웃 (보고서 생성용)
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AiPredictClient(@Value("${ai.base-url}") String baseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);   // 10초
        factory.setReadTimeout(65_000);      // 65초
        this.reportRestClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .build();
    }

    // ── 개인 주간 예측 ────────────────────────────────────────────────────────

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

    // ── 개인 시나리오 개인화 ──────────────────────────────────────────────────

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

    // ── ESG 보고서 생성 ───────────────────────────────────────────────────────

    /**
     * POST /company-report (타임아웃 65초)
     * Python에서 PDF 생성 후 파일 경로 반환.
     * 실패 시 null 반환.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> generateReport(Map<String, Object> request) {
        try {
            String json = objectMapper.writeValueAsString(request);
            String resp = reportRestClient.post()
                    .uri("/company-report")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(json)
                    .retrieve()
                    .body(String.class);
            return objectMapper.readValue(resp, Map.class);
        } catch (Exception e) {
            return null;
        }
    }

    // ── 기업 배출 Baseline ARIMA 예측 ─────────────────────────────────────────

    /**
     * POST /company-baseline
     * 월별 배출량 시계열 → ARIMA/SARIMA 6개월 예측.
     * 실패 시 null 반환 → 서비스에서 선형 외삽 fallback.
     */
    public CompanyBaselineResponse companyBaseline(CompanyBaselineRequest request) {
        try {
            return restClient.post()
                    .uri("/company-baseline")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(CompanyBaselineResponse.class);
        } catch (Exception e) {
            return null;
        }
    }

    // ── 기업 감축 시나리오 LLM 생성 ───────────────────────────────────────────

    /**
     * POST /company-scenario
     * 기업 프로필 → Claude API → 맞춤형 감축 시나리오 3개.
     * 실패 시 null 반환 → 서비스에서 fallback 시나리오 사용.
     */
    public CompanyScenarioFullResponse companyScenarioFull(CompanyScenarioFullRequest request) {
        try {
            CompanyScenarioFullResponse resp = restClient.post()
                    .uri("/company-scenario")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(CompanyScenarioFullResponse.class);
            // error 필드가 있으면 실패로 간주
            if (resp != null && resp.getError() != null) return null;
            return resp;
        } catch (Exception e) {
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Request / Response DTOs
    // ═══════════════════════════════════════════════════════════════════════

    // ── 개인 예측 DTOs ────────────────────────────────────────────────────

    @Getter @AllArgsConstructor
    public static class MonthlyPoint {
        private String date;
        @JsonProperty("emission_kg") private double emissionKg;
    }

    @Getter @AllArgsConstructor
    public static class WeeklyPoint {
        private String week;
        @JsonProperty("emission_kg") private double emissionKg;
    }

    @Getter @AllArgsConstructor
    private static class PredictWeeklyRequest {
        private List<WeeklyPoint> data;
        private int horizon;
    }

    @Getter @NoArgsConstructor
    public static class WeeklyBaselineResponse {
        @JsonProperty("forecast_kg")   private List<Double> forecastKg;
        @JsonProperty("outlier_count") private int outlierCount;
    }

    @Getter @AllArgsConstructor
    public static class UserProfile {
        @JsonProperty("top_transport_mode")       private String topTransportMode;
        @JsonProperty("top_consumption_category") private String topConsumptionCategory;
        @JsonProperty("transport_kg")             private double transportKg;
        @JsonProperty("electricity_kg")           private double electricityKg;
        @JsonProperty("consumption_kg")           private double consumptionKg;
    }

    @Getter @NoArgsConstructor
    public static class PersonalizedScenario {
        @JsonProperty("scenario_id")  private String scenarioId;
        private String title;
        private String subtitle;
        @JsonProperty("reduction_rate") private Double reductionRate;
    }

    @Getter @NoArgsConstructor
    private static class PersonalizeResponse {
        private List<PersonalizedScenario> scenarios;
    }

    // ── 기업 Baseline DTOs ────────────────────────────────────────────────

    @Getter @AllArgsConstructor
    public static class CompanyBaselineRequest {
        @JsonProperty("monthly_emissions") private List<Double> monthlyEmissions;
        @JsonProperty("data_months")       private int dataMonths;
        @JsonProperty("industry_type")     private String industryType;
    }

    @Getter @NoArgsConstructor
    public static class CompanyBaselineResponse {
        private String status;                              // "ok" | "insufficient"
        @JsonProperty("model_used")      private String modelUsed;
        @JsonProperty("data_months")     private int dataMonths;
        private List<Double> forecast;
        @JsonProperty("forecast_upper")  private List<Double> forecastUpper;
        @JsonProperty("forecast_lower")  private List<Double> forecastLower;
        @JsonProperty("outlier_months")  private List<Integer> outlierMonths;
        @JsonProperty("seasonal_ratio")  private Double seasonalRatio;
        @JsonProperty("drift_applied")   private boolean driftApplied;
    }

    // ── 기업 시나리오 DTOs ────────────────────────────────────────────────

    @Getter @AllArgsConstructor
    public static class CompanyScenarioFullRequest {
        @JsonProperty("company_context")   private CompanyContextDto companyContext;
        @JsonProperty("emission_summary")  private EmissionSummaryDto emissionSummary;
        @JsonProperty("baseline_forecast") private List<Double> baselineForecast;
        @JsonProperty("cost_context")      private CostContextDto costContext;
        @JsonProperty("fuel_types")        private List<String> fuelTypes;
    }

    @Getter @AllArgsConstructor
    public static class CompanyContextDto {
        private String industry;
        @JsonProperty("site_type")           private String siteType;
        @JsonProperty("employee_count")      private int employeeCount;
        @JsonProperty("onboarding_purpose")  private String onboardingPurpose;
    }

    @Getter @AllArgsConstructor
    public static class EmissionSummaryDto {
        @JsonProperty("recent_3mo_avg_total") private double recent3moAvgTotal;
        @JsonProperty("yoy_change_pct")       private double yoyChangePct;
        @JsonProperty("category_weights")     private Map<String, Double> categoryWeights;
    }

    @Getter @AllArgsConstructor
    public static class CostContextDto {
        @JsonProperty("monthly_carbon_cost_krw") private long monthlyCarbonCostKrw;
        @JsonProperty("k_ets_price")             private int kEtsPrice;
    }

    @Getter @NoArgsConstructor
    public static class CompanyScenarioFullResponse {
        private List<CompanyScenarioItemFull> scenarios;
        private String error;
    }

    @Getter @NoArgsConstructor
    public static class CompanyScenarioItemFull {
        private String id;
        private String name;
        private String label;
        private String description;
        private String difficulty;
        private boolean recommended;
        private double feasibility;
        private List<ActionItemDto> actions;
    }

    @Getter @NoArgsConstructor
    public static class ActionItemDto {
        @JsonProperty("target_category")    private String targetCategory;
        @JsonProperty("action_desc")        private String actionDesc;
        @JsonProperty("reduction_rate")     private double reductionRate;
        @JsonProperty("investment_cost_krw") private long investmentCostKrw;
        @JsonProperty("payback_months")     private int paybackMonths;
    }
}
