package com.coco.domain.analysis.service;

import com.coco.domain.activity.entity.Activity;
import com.coco.domain.activity.entity.ActivityCategory;
import com.coco.domain.activity.repository.ActivityRepository;
import com.coco.domain.ai.infrastructure.PythonAiCliClient;
import com.coco.domain.analysis.dto.*;
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
public class AnalysisService {

    private static final long WON_PER_KG_CO2 = 80L;

    private final ActivityRepository activityRepository;
    private final PythonAiCliClient pythonAiCliClient;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public MonthlySummaryResponse getMonthlySummary(Long userId, int year, int month) {
        LocalDate start = YearMonth.of(year, month).atDay(1);
        LocalDate end = YearMonth.of(year, month).atEndOfMonth();

        double transportKg = sumEmissionKg(userId, ActivityCategory.TRANSPORT, start, end);
        double consumptionKg = sumEmissionKg(userId, ActivityCategory.CONSUMPTION, start, end);
        double electricityKg = sumEmissionKg(userId, ActivityCategory.ELECTRICITY, start, end);

        double totalKg = transportKg + consumptionKg + electricityKg;

        return MonthlySummaryResponse.builder()
                .transport(CategoryEmissionResponse.builder()
                        .emissionKg(transportKg)
                        .moneyWon((long) toWon(transportKg))
                        .build())
                .consumption(CategoryEmissionResponse.builder()
                        .emissionKg(consumptionKg)
                        .moneyWon(toWon(consumptionKg))
                        .build())
                .electricity(CategoryEmissionResponse.builder()
                        .emissionKg(electricityKg)
                        .moneyWon(toWon(electricityKg))
                        .build())
                .total(MonthlySummaryResponse.TotalEmissionResponse.builder()
                        .emissionKg(totalKg)
                        .moneyWon(toWon(totalKg))
                        .build())
                .build();
    }

    @Transactional(readOnly = true)
    public MonthlyTrendResponse getMonthlyTrend(Long userId, int rangeMonths) {
        if (rangeMonths <= 0) rangeMonths = 12;

        YearMonth now = YearMonth.now();
        YearMonth startMonth = now.minusMonths(rangeMonths - 1L);
        LocalDate start = startMonth.atDay(1);
        LocalDate end = now.atEndOfMonth();

        Map<YearMonth, Double> transport = loadMonthlyMap(userId, ActivityCategory.TRANSPORT, start, end);
        Map<YearMonth, Double> consumption = loadMonthlyMap(userId, ActivityCategory.CONSUMPTION, start, end);
        Map<YearMonth, Double> electricity = loadMonthlyMap(userId, ActivityCategory.ELECTRICITY, start, end);

        List<MonthSeriesPoint> transportSeries = new ArrayList<>();
        List<MonthSeriesPoint> consumptionSeries = new ArrayList<>();
        List<MonthSeriesPoint> electricitySeries = new ArrayList<>();

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");
        for (int i = 0; i < rangeMonths; i++) {
            YearMonth ym = startMonth.plusMonths(i);
            transportSeries.add(toPoint(fmt, ym, transport.getOrDefault(ym, 0.0)));
            consumptionSeries.add(toPoint(fmt, ym, consumption.getOrDefault(ym, 0.0)));
            electricitySeries.add(toPoint(fmt, ym, electricity.getOrDefault(ym, 0.0)));
        }

        return MonthlyTrendResponse.builder()
                .transport(transportSeries)
                .consumption(consumptionSeries)
                .electricity(electricitySeries)
                .build();
    }

    @Transactional(readOnly = true)
    public CategoryRatioResponse getCategoryRatio(Long userId, int year, int month) {
        LocalDate start = YearMonth.of(year, month).atDay(1);
        LocalDate end = YearMonth.of(year, month).atEndOfMonth();

        double transportKg = sumEmissionKg(userId, ActivityCategory.TRANSPORT, start, end);
        double consumptionKg = sumEmissionKg(userId, ActivityCategory.CONSUMPTION, start, end);
        double electricityKg = sumEmissionKg(userId, ActivityCategory.ELECTRICITY, start, end);
        double total = transportKg + consumptionKg + electricityKg;

        if (total <= 0) {
            return CategoryRatioResponse.builder()
                    .transportPercent(0.0)
                    .consumptionPercent(0.0)
                    .electricityPercent(0.0)
                    .build();
        }

        return CategoryRatioResponse.builder()
                .transportPercent(transportKg / total * 100.0)
                .consumptionPercent(consumptionKg / total * 100.0)
                .electricityPercent(electricityKg / total * 100.0)
                .build();
    }

    /**
     * 개인 최근 패턴(rolling window) 기준 이상치 탐지.
     * 현재 구현은 월별 합계 emissionKg 시계열을 기반으로 수행합니다.
     */
    @Transactional(readOnly = true)
    public AnomalyOutliersResponse getAnomalyOutliers(Long userId, int rangeMonths, int windowSize) {
        if (rangeMonths <= 0) rangeMonths = 10;
        if (windowSize <= 0) windowSize = 7;

        YearMonth now = YearMonth.now();
        YearMonth startMonth = now.minusMonths(rangeMonths - 1L);
        LocalDate start = startMonth.atDay(1);
        LocalDate end = now.atEndOfMonth();

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");

        // 이상치 탐지는 "원본 입력값" 기준(physical_invalid 탐지 목적)
        // - transport: distanceKm
        // - consumption: count
        // - electricity: billAmount
        Map<ActivityCategory, List<Double>> seriesMap = new EnumMap<>(ActivityCategory.class);
        seriesMap.put(ActivityCategory.TRANSPORT, loadRawSeries(userId, ActivityCategory.TRANSPORT, start, end, rangeMonths));
        seriesMap.put(ActivityCategory.CONSUMPTION, loadRawSeries(userId, ActivityCategory.CONSUMPTION, start, end, rangeMonths));
        seriesMap.put(ActivityCategory.ELECTRICITY, loadRawSeries(userId, ActivityCategory.ELECTRICITY, start, end, rangeMonths));

        List<AnomalyOutlierPointResponse> points = new ArrayList<>();
        int outlierCount = 0;
        int warningCount = 0;

        for (int i = 0; i < rangeMonths; i++) {
            YearMonth ym = startMonth.plusMonths(i);
            String monthStr = ym.format(fmt);

            for (Map.Entry<ActivityCategory, List<Double>> e : seriesMap.entrySet()) {
                ActivityCategory cat = e.getKey();
                List<Double> series = e.getValue();
                double current = series.get(i);

                // history = current 제외한 과거 최근 windowSize개
                int from = Math.max(0, i - windowSize);
                List<Double> history = series.subList(from, i);

                Map<String, Object> params = new HashMap<>();
                params.put("history", history);
                params.put("current", current);
                params.put("window_size", windowSize);
                params.put("min_physical_value", 0.0);
                params.put("std_eps", 1e-6);
                params.put("warning_abs_z", 1.8);
                params.put("outlier_abs_z", 2.5);

                JsonNode json = pythonAiCliClient.runTask("anomaly", params);
                if (json.has("error")) {
                    // python 실패 시 이상치 데이터는 건너뜀
                    continue;
                }
                JsonNode result = json.get("result");
                if (result == null) continue;

                String state = result.path("state").asText("");
                if ("outlier".equals(state)) {
                    outlierCount++;
                }
                if ("warning".equals(state) || "physical_invalid".equals(state)) {
                    warningCount++;
                }

                boolean include = "outlier".equals(state) || "warning".equals(state) || "physical_invalid".equals(state);
                if (!include) continue;

                points.add(AnomalyOutlierPointResponse.builder()
                        .category(mapCategory(cat))
                        .month(monthStr)
                        .state(state)
                        .zScore(result.hasNonNull("z_score") ? result.get("z_score").asDouble() : null)
                        .mean(result.hasNonNull("mean") ? result.get("mean").asDouble() : null)
                        .std(result.hasNonNull("std") ? result.get("std").asDouble() : null)
                        .windowSize(result.hasNonNull("window_size") ? result.get("window_size").asInt() : windowSize)
                        .reason(result.path("reason").asText(null))
                        .build());
            }
        }

        return AnomalyOutliersResponse.builder()
                .outliers(points)
                .outlierCount(outlierCount)
                .warningCount(warningCount)
                .build();
    }

    // ---------------- helpers ----------------

    private long toWon(double emissionKg) {
        if (emissionKg <= 0) return 0L;
        return Math.round(emissionKg * WON_PER_KG_CO2);
    }

    private MonthSeriesPoint toPoint(DateTimeFormatter fmt, YearMonth ym, double emissionKg) {
        long moneyWon = Math.round(toWon(emissionKg));
        return MonthSeriesPoint.builder()
                .month(ym.format(fmt))
                .emissionKg(emissionKg)
                .moneyWon(moneyWon)
                .build();
    }

    private double sumEmissionKg(Long userId, ActivityCategory category, LocalDate start, LocalDate end) {
        return loadSeries(userId, category, start, end, computeMonthsBetweenInclusive(start, end)).stream()
                .mapToDouble(Double::doubleValue)
                .sum();
    }

    private List<Double> loadSeries(Long userId, ActivityCategory category, LocalDate start, LocalDate end, int months) {
        Map<YearMonth, Double> map = loadMonthlyMap(userId, category, start, end);
        YearMonth startMonth = YearMonth.from(start);
        List<Double> series = new ArrayList<>(months);
        for (int i = 0; i < months; i++) {
            YearMonth ym = startMonth.plusMonths(i);
            series.add(map.getOrDefault(ym, 0.0));
        }
        return series;
    }

    /**
     * 이상치 탐지용 원본 입력 시계열(월별 합계)
     */
    private List<Double> loadRawSeries(
            Long userId,
            ActivityCategory category,
            LocalDate start,
            LocalDate end,
            int months
    ) {
        List<Activity> activities = activityRepository.findByUser_UserIdAndCategoryAndActivityDateBetween(
                userId,
                category,
                start,
                end
        );

        Map<YearMonth, Double> map = new HashMap<>();
        for (Activity a : activities) {
            if (a.getActivityDate() == null) continue;

            YearMonth ym = YearMonth.from(a.getActivityDate());
            switch (category) {
                case TRANSPORT -> {
                    var t = a.getTransportActivity();
                    if (t == null || t.getDistanceKm() == null) continue;
                    map.put(ym, map.getOrDefault(ym, 0.0) + t.getDistanceKm());
                }
                case CONSUMPTION -> {
                    var c = a.getConsumptionActivity();
                    if (c == null || c.getCount() == null) continue;
                    map.put(ym, map.getOrDefault(ym, 0.0) + c.getCount());
                }
                case ELECTRICITY -> {
                    var e = a.getElectricityActivity();
                    if (e == null || e.getBillAmount() == null) continue;
                    map.put(ym, map.getOrDefault(ym, 0.0) + e.getBillAmount());
                }
            }
        }

        YearMonth startMonth = YearMonth.from(start);
        List<Double> series = new ArrayList<>(months);
        for (int i = 0; i < months; i++) {
            YearMonth ym = startMonth.plusMonths(i);
            series.add(map.getOrDefault(ym, 0.0));
        }
        return series;
    }

    private int computeMonthsBetweenInclusive(LocalDate start, LocalDate end) {
        YearMonth s = YearMonth.from(start);
        YearMonth e = YearMonth.from(end);
        int months = (e.getYear() - s.getYear()) * 12 + (e.getMonthValue() - s.getMonthValue()) + 1;
        return Math.max(1, months);
    }

    private Map<YearMonth, Double> loadMonthlyMap(Long userId, ActivityCategory category, LocalDate start, LocalDate end) {
        List<Activity> activities = activityRepository.findByUser_UserIdAndCategoryAndActivityDateBetween(
                userId,
                category,
                start,
                end
        );

        Map<YearMonth, Double> map = new HashMap<>();
        for (Activity a : activities) {
            if (a.getActivityDate() == null) continue;
            if (a.getEmissionResult() == null || a.getEmissionResult().getTotalEmission() == null) continue;
            YearMonth ym = YearMonth.from(a.getActivityDate());
            map.put(ym, map.getOrDefault(ym, 0.0) + a.getEmissionResult().getTotalEmission());
        }
        return map;
    }

    private String mapCategory(ActivityCategory cat) {
        return switch (cat) {
            case TRANSPORT -> "transport";
            case CONSUMPTION -> "consumption";
            case ELECTRICITY -> "electricity";
        };
    }
}

