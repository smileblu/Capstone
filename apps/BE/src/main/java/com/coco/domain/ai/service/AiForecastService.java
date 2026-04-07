package com.coco.domain.ai.service;

import com.coco.domain.ai.dto.*;
import com.coco.domain.ai.entity.AiForecastRun;
import com.coco.domain.ai.infrastructure.PythonAiCliClient;
import com.coco.domain.ai.repository.AiForecastRunRepository;
import com.coco.domain.analysis.dto.MonthSeriesPoint;
import com.coco.domain.activity.entity.Activity;
import com.coco.domain.activity.entity.ActivityCategory;
import com.coco.domain.activity.repository.ActivityRepository;
import com.coco.domain.user.entity.User;
import com.coco.domain.user.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AiForecastService {

    private static final long WON_PER_KG_CO2 = 80L;

    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final AiForecastRunRepository aiForecastRunRepository;
    private final PythonAiCliClient pythonAiCliClient;
    private final ObjectMapper objectMapper;

    @Transactional
    public AiForecastRunResponse runForecast(AiForecastRunRequest request) {
        Long userId = request.getUserId();
        validateUser(userId);

        int historyMonths = request.getHistoryMonths() != null ? request.getHistoryMonths() : 12;
        int horizonMonths = request.getHorizonMonths() != null ? request.getHorizonMonths() : 3;
        String model = request.getModel() != null ? request.getModel() : "arima";

        if (historyMonths < 3) {
            throw new IllegalArgumentException("historyMonths must be >= 3");
        }
        if (horizonMonths <= 0) {
            throw new IllegalArgumentException("horizonMonths must be positive");
        }

        YearMonth nowMonth = YearMonth.now();
        YearMonth startMonth = nowMonth.minusMonths(historyMonths - 1L);

        LocalDate startDate = startMonth.atDay(1);
        LocalDate endDate = nowMonth.atEndOfMonth();

        // 월별 합산(kgCO2)
        List<Double> transportHistory = loadMonthlyEmissionHistory(userId, ActivityCategory.TRANSPORT, startDate, endDate, historyMonths);
        List<Double> consumptionHistory = loadMonthlyEmissionHistory(userId, ActivityCategory.CONSUMPTION, startDate, endDate, historyMonths);
        List<Double> electricityHistory = loadMonthlyEmissionHistory(userId, ActivityCategory.ELECTRICITY, startDate, endDate, historyMonths);

        // Python forecast 실행 (카테고리별)
        List<Double> transportForecast = pythonForecast(model, transportHistory, horizonMonths);
        List<Double> consumptionForecast = pythonForecast(model, consumptionHistory, horizonMonths);
        List<Double> electricityForecast = pythonForecast(model, electricityHistory, horizonMonths);

        // Future month 생성
        List<YearMonth> futureMonths = new ArrayList<>();
        for (int i = 1; i <= horizonMonths; i++) {
            futureMonths.add(nowMonth.plusMonths(i));
        }

        List<MonthSeriesPoint> transportSeries = toSeries(futureMonths, transportForecast);
        List<MonthSeriesPoint> consumptionSeries = toSeries(futureMonths, consumptionForecast);
        List<MonthSeriesPoint> electricitySeries = toSeries(futureMonths, electricityForecast);

        Map<String, Object> forecastPayload = new HashMap<>();
        forecastPayload.put("transport", transportSeries);
        forecastPayload.put("consumption", consumptionSeries);
        forecastPayload.put("electricity", electricitySeries);

        String forecastJson;
        try {
            forecastJson = objectMapper.writeValueAsString(forecastPayload);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new RuntimeException("Failed to create forecastJson", e);
        }

        AiForecastRun run = AiForecastRun.builder()
                .userId(userId)
                .modelName(model)
                .lastHistoryMonth(nowMonth.atDay(1))
                .horizonMonths(horizonMonths)
                .forecastJson(forecastJson)
                .status(AiForecastRun.Status.DONE)
                .createdAt(java.time.LocalDateTime.now())
                .build();

        AiForecastRun saved = aiForecastRunRepository.save(run);

        return AiForecastRunResponse.builder()
                .forecastId(saved.getId())
                .status(saved.getStatus().name())
                .build();
    }

    @Transactional(readOnly = true)
    public AiForecastResultResponse getForecastResult(Long forecastId) {
        AiForecastRun run = aiForecastRunRepository.findById(forecastId)
                .orElseThrow(() -> new RuntimeException("ForecastRun not found"));

        if (run.getForecastJson() == null) {
            throw new RuntimeException("ForecastRun forecastJson is empty");
        }

        // forecastJson 파싱: { "transport":[...], "consumption":[...], "electricity":[...] }
        Map<String, List<MonthSeriesPoint>> map;
        try {
            map = objectMapper.readValue(
                    run.getForecastJson(),
                    new TypeReference<Map<String, List<MonthSeriesPoint>>>() {}
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse forecastJson", e);
        }

        return AiForecastResultResponse.builder()
                .transport(map.getOrDefault("transport", List.of()))
                .consumption(map.getOrDefault("consumption", List.of()))
                .electricity(map.getOrDefault("electricity", List.of()))
                .modelName(run.getModelName())
                .lastHistoryMonth(run.getLastHistoryMonth() != null ? run.getLastHistoryMonth().toString() : null)
                .build();
    }

    @Transactional(readOnly = true)
    public AiForecastRecommendationsResponse getRecommendations(Long forecastId) {
        AiForecastRun run = aiForecastRunRepository.findById(forecastId)
                .orElseThrow(() -> new RuntimeException("ForecastRun not found"));

        Map<String, List<MonthSeriesPoint>> map;
        try {
            map = objectMapper.readValue(
                    run.getForecastJson(),
                    new TypeReference<Map<String, List<MonthSeriesPoint>>>() {}
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse forecastJson", e);
        }

        double transportBase = sum(map.getOrDefault("transport", List.of()));
        double consumptionBase = sum(map.getOrDefault("consumption", List.of()));
        double electricityBase = sum(map.getOrDefault("electricity", List.of()));

        // 시나리오: 프론트 표시용(LLM 교체 가능하도록 상수 계수 기반으로 분리)
        List<AiScenarioRecommendationResponse> scenarios = new ArrayList<>();

        scenarios.add(makeScenario(
                "s1",
                "대중교통 이용 확대",
                "주 3일 대중교통 이용",
                "transport",
                transportBase,
                0.90
        ));
        scenarios.add(makeScenario(
                "s2",
                "친환경 이동수단 전환",
                "자전거/도보 이동 늘리기",
                "transport",
                transportBase,
                0.85
        ));
        scenarios.add(makeScenario(
                "s3",
                "전력 사용 줄이기",
                "대기전력 차단 + 절전모드",
                "electricity",
                electricityBase,
                0.88
        ));
        scenarios.add(makeScenario(
                "s4",
                "배달 줄이기",
                "주 2회 배달 대신 직접 조리",
                "consumption",
                consumptionBase,
                0.90
        ));

        scenarios.sort(Comparator.comparingLong(AiScenarioRecommendationResponse::getExpectedReductionMoneyWon).reversed());

        // FE 시나리오 타입에 맞게 difficulty만 재분류(단순 규칙)
        long best = scenarios.isEmpty() ? 0 : scenarios.get(0).getExpectedReductionMoneyWon();
        List<AiScenarioRecommendationResponse> finalList = new ArrayList<>();
        for (AiScenarioRecommendationResponse s : scenarios) {
            String diff;
            if (best <= 0) {
                diff = "하";
            } else if (s.getExpectedReductionMoneyWon() >= best * 0.7) {
                diff = "상";
            } else if (s.getExpectedReductionMoneyWon() >= best * 0.35) {
                diff = "중";
            } else {
                diff = "하";
            }

            finalList.add(AiScenarioRecommendationResponse.builder()
                    .id(s.getId())
                    .title(s.getTitle())
                    .subtitle(s.getSubtitle())
                    .impactText(s.getImpactText())
                    .difficulty(diff)
                    .expectedReductionKg(s.getExpectedReductionKg())
                    .expectedReductionMoneyWon(s.getExpectedReductionMoneyWon())
                    .build());
        }

        return AiForecastRecommendationsResponse.builder()
                .recommendations(finalList)
                .build();
    }

    // ----- helpers -----

    private void validateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getUserId() == null) {
            throw new RuntimeException("Invalid userId");
        }
    }

    private double sum(List<MonthSeriesPoint> list) {
        double s = 0.0;
        for (MonthSeriesPoint p : list) {
            s += p.getEmissionKg();
        }
        return s;
    }

    private List<Double> pythonForecast(String model, List<Double> history, int horizon) {
        Map<String, Object> params = new HashMap<>();
        params.put("history", history);
        params.put("horizon", horizon);
        params.put("model", model);
        params.put("order", List.of(1, 1, 1));

        JsonNode json = pythonAiCliClient.runTask("forecast", params);
        if (json.has("error")) {
            throw new RuntimeException("Python forecast failed: " + json.get("error").toString());
        }

        JsonNode result = json.get("result");
        JsonNode forecast = result.get("forecast");
        List<Double> out = new ArrayList<>();
        for (JsonNode n : forecast) {
            out.add(n.asDouble());
        }
        return out;
    }

    private List<Double> loadMonthlyEmissionHistory(
            Long userId,
            ActivityCategory category,
            LocalDate startDate,
            LocalDate endDate,
            int expectedMonths
    ) {
        List<Activity> activities = activityRepository.findByUser_UserIdAndActivityDateBetween(
                userId,
                startDate,
                endDate
        );

        activities.removeIf(a -> a.getCategory() != category);

        Map<YearMonth, Double> map = new HashMap<>();
        for (Activity a : activities) {
            if (a.getActivityDate() == null) continue;
            if (a.getEmissionResult() == null || a.getEmissionResult().getTotalEmission() == null) continue;
            YearMonth ym = YearMonth.from(a.getActivityDate());
            map.put(ym, map.getOrDefault(ym, 0.0) + a.getEmissionResult().getTotalEmission());
        }

        // 정렬된 월 리스트 만들기: 시작~현재 총 expectedMonths
        YearMonth nowMonth = YearMonth.from(endDate);
        YearMonth startMonth = nowMonth.minusMonths(expectedMonths - 1L);

        List<Double> series = new ArrayList<>();
        for (int i = 0; i < expectedMonths; i++) {
            YearMonth ym = startMonth.plusMonths(i);
            series.add(map.getOrDefault(ym, 0.0));
        }
        return series;
    }

    private List<MonthSeriesPoint> toSeries(List<YearMonth> months, List<Double> values) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");
        List<MonthSeriesPoint> out = new ArrayList<>();
        for (int i = 0; i < months.size(); i++) {
            double emissionKg = i < values.size() ? values.get(i) : 0.0;
            long moneyWon = Math.round(emissionKg * WON_PER_KG_CO2);
            out.add(MonthSeriesPoint.builder()
                    .month(months.get(i).format(fmt))
                    .emissionKg(emissionKg)
                    .moneyWon(moneyWon)
                    .build());
        }
        return out;
    }

    private AiScenarioRecommendationResponse makeScenario(
            String id,
            String title,
            String subtitle,
            String key,
            double baseTotalKg,
            double keepRate
    ) {
        double reducedTotalKg = baseTotalKg * keepRate;
        double reductionKg = Math.max(0.0, baseTotalKg - reducedTotalKg);
        long reductionWon = Math.round(reductionKg * WON_PER_KG_CO2);

        String difficulty = "중";
        String impactText = String.format(
                "- %.1fkgCO2 | %s원 절약",
                reductionKg,
                reductionWon
        );

        return AiScenarioRecommendationResponse.builder()
                .id(id)
                .title(title)
                .subtitle(subtitle)
                .impactText(impactText)
                .difficulty(difficulty)
                .expectedReductionKg(reductionKg)
                .expectedReductionMoneyWon(reductionWon)
                .build();
    }

    // (향후 LLM 추천으로 교체 시에도 difficulty/delta 포맷만 유지하면 FE 연동이 유지됩니다.)
}

