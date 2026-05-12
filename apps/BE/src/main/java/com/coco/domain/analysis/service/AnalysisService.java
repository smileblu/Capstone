package com.coco.domain.analysis.service;

import com.coco.domain.activity.entity.Activity;
import com.coco.domain.activity.entity.ActivityCategory;
import com.coco.domain.activity.repository.ActivityRepository;
import com.coco.domain.analysis.dto.AnalysisResponse;
import com.coco.domain.analysis.dto.AnalysisResponse.CategoryComparison;
import com.coco.domain.analysis.dto.AnalysisResponse.WeeklyTrendPoint;
import com.coco.domain.analysis.dto.ScenarioResponse;
import com.coco.domain.analysis.entity.Scenario;
import com.coco.domain.analysis.repository.ScenarioRepository;
import com.coco.global.client.AiPredictClient;
import com.coco.global.client.AiPredictClient.MonthlyPoint;
import com.coco.global.client.AiPredictClient.PersonalizedScenario;
import com.coco.global.client.AiPredictClient.UserProfile;
import com.coco.global.client.AiPredictClient.WeeklyPoint;
import com.coco.domain.mission.entity.MissionStatus;
import com.coco.domain.mission.repository.MissionRepository;
import com.coco.global.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalysisService {

    private final ActivityRepository activityRepository;
    private final AiPredictClient aiPredictClient;
    private final ScenarioRepository scenarioRepository;
    private final MissionRepository missionRepository;

    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

    @Transactional(readOnly = true)
    public AnalysisResponse getAnalysis() {
        Long userId = SecurityUtil.getCurrentUserId();
        LocalDate today = LocalDate.now();

        // 최근 4주 구간 정의 (교통 + 소비만 집계, 전기는 월 단위라 제외)
        double w4 = weeklyEmission(userId, today.minusDays(27), today.minusDays(21));
        double w3 = weeklyEmission(userId, today.minusDays(20), today.minusDays(14));
        double w2 = weeklyEmission(userId, today.minusDays(13), today.minusDays(7));
        double w1 = weeklyEmission(userId, today.minusDays(6), today);   // 이번 주

        // [수정 5] 최근 4주 평균 기반 목표. 데이터가 2주 미만이면 목표 설정 불가 → null
        long nonZeroWeeks = List.of(w4, w3, w2, w1).stream().filter(w -> w > 0).count();
        double avg = (w4 + w3 + w2 + w1) / 4.0;
        Double targetCurr = nonZeroWeeks >= 2 ? round(avg * 0.95) : null;
        Double targetW1   = nonZeroWeeks >= 2 ? round(avg * 0.90) : null;
        Double targetW2   = nonZeroWeeks >= 2 ? round(avg * 0.85) : null;

        // 개선율: 지난주 대비 이번주 변화율
        double improvementRate = w2 > 0 ? (w1 - w2) / w2 * 100.0 : 0.0;

        // 경고 건수: 4주 평균의 1.5배 초과한 주 수
        int warningCount = (int) List.of(w4, w3, w2, w1).stream()
                .filter(w -> w > avg * 1.5)
                .count();

        // 미래 2주 예측: AI 서버(ARIMA) 기반 주간 예측값 사용
        List<Double> fw = aiPredictClient.predictWeekly(
                List.of(
                        new WeeklyPoint("3주전", w4),
                        new WeeklyPoint("2주전", w3),
                        new WeeklyPoint("지난주", w2),
                        new WeeklyPoint("이번주", w1)
                ),
                2
        );
        double fw1 = fw.size() > 0 ? fw.get(0) : Math.max(0, w1 * 0.9);
        double fw2 = fw.size() > 1 ? fw.get(1) : Math.max(0, fw1 * 0.9);

        // 선택한 시나리오(미션 PENDING)의 감축 효과를 예측값에 반영 (최소 FE 변경)
        // impactKg를 "주간 감축량(kg)"으로 간주하고 1주후/2주후 예측에서 차감
        double pendingImpactKg = missionRepository.findByUser_UserIdAndStatus(userId, MissionStatus.PENDING)
                .stream()
                .mapToDouble(m -> m.getImpactKg())
                .sum();
        if (pendingImpactKg > 0) {
            fw1 = Math.max(0, fw1 - pendingImpactKg);
            fw2 = Math.max(0, fw2 - pendingImpactKg);
        }

        // 주별 추세 (과거 4주 실제 + 이번주부터 예측 연결 + 이번주~2주후 목표)
        List<WeeklyTrendPoint> weeklyTrend = List.of(
                WeeklyTrendPoint.builder().week("3주전").actual(round(w4)).forecast(null).target(null).build(),
                WeeklyTrendPoint.builder().week("2주전").actual(round(w3)).forecast(null).target(null).build(),
                WeeklyTrendPoint.builder().week("지난주").actual(round(w2)).forecast(null).target(null).build(),
                WeeklyTrendPoint.builder().week("이번주").actual(round(w1)).forecast(round(w1)).target(targetCurr).build(),
                WeeklyTrendPoint.builder().week("1주후").actual(null).forecast(round(fw1)).target(targetW1).build(),
                WeeklyTrendPoint.builder().week("2주후").actual(null).forecast(round(fw2)).target(targetW2).build()
        );

        // 카테고리별 비교 (지난주 vs 이번주)
        List<CategoryComparison> categoryComparison = List.of(
                buildCategoryComparison("교통", userId, ActivityCategory.TRANSPORT, today),
                buildCategoryComparison("소비", userId, ActivityCategory.CONSUMPTION, today)
        );

        // [수정 1·2·3·6] 월별 grand_total(모든 카테고리) → AI Baseline 예측 + 이상치 탐지
        List<MonthlyPoint> monthlyData = buildMonthlyGrandTotal(userId, today);
        AiPredictClient.MonthlyBaselineResponse baseline = aiPredictClient.predictMonthlyBaseline(monthlyData);

        AnalysisResponse.OutlierDetection outlierDetection = null;
        AnalysisResponse.MonthlyBaseline monthlyBaseline = null;
        if (baseline != null) {
            outlierDetection = AnalysisResponse.OutlierDetection.builder()
                    .count(baseline.getOutlierCount())
                    .months(baseline.getOutlierMonths() != null ? baseline.getOutlierMonths() : List.of())
                    .build();
            monthlyBaseline = AnalysisResponse.MonthlyBaseline.builder()
                    .forecastKg(baseline.getForecastKg())
                    .moneyWon(baseline.getMoneyWon())
                    .build();
        }

        return AnalysisResponse.builder()
                .improvementRate(round(improvementRate))
                .warningCount(warningCount)
                .weeklyTrend(weeklyTrend)
                .categoryComparison(categoryComparison)
                .outlierDetection(outlierDetection)
                .monthlyBaseline(monthlyBaseline)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ScenarioResponse> getScenarios() {
        Long userId = SecurityUtil.getCurrentUserId();
        LocalDate today = LocalDate.now();
        YearMonth ym = YearMonth.from(today);

        // 이번달 활동 전체 조회
        List<Activity> activities = activityRepository.findByUser_UserIdAndActivityDateBetween(
                userId, ym.atDay(1), ym.atEndOfMonth());

        // 카테고리별 배출량 집계
        double transportKg = 0, electricityKg = 0, consumptionKg = 0;
        // 교통수단별 누적 거리 (가장 많이 쓴 수단 파악용)
        Map<String, Double> transportDistanceMap = new java.util.HashMap<>();
        // 소비 카테고리별 횟수
        Map<String, Integer> consumptionCountMap = new java.util.HashMap<>();

        for (Activity a : activities) {
            double kg = emissionOf(a);
            if (a.getCategory() == ActivityCategory.TRANSPORT) {
                transportKg += kg;
                if (a.getTransportActivity() != null) {
                    String mode = a.getTransportActivity().getTransportMode();
                    double dist = a.getTransportActivity().getDistanceKm() != null
                            ? a.getTransportActivity().getDistanceKm() : 0;
                    transportDistanceMap.merge(mode, dist, Double::sum);
                }
            } else if (a.getCategory() == ActivityCategory.ELECTRICITY) {
                electricityKg += kg;
            } else if (a.getCategory() == ActivityCategory.CONSUMPTION) {
                consumptionKg += kg;
                if (a.getConsumptionActivity() != null && a.getConsumptionActivity().getCategory() != null) {
                    consumptionCountMap.merge(a.getConsumptionActivity().getCategory(), 1, Integer::sum);
                }
            }
        }

        // 최다 이용 교통수단
        String topTransportMode = transportDistanceMap.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("NONE");

        // 최다 소비 카테고리
        String topConsumptionCategory = consumptionCountMap.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("NONE");

        // AI 서버에서 개인 맞춤 시나리오 텍스트 생성
        UserProfile profile = new UserProfile(
                topTransportMode, topConsumptionCategory,
                transportKg, electricityKg, consumptionKg);
        List<PersonalizedScenario> personalized = aiPredictClient.personalize(profile);

        // AI 결과 + DB의 impactKg/impactWon/difficulty 합쳐서 반환
        if (personalized != null && !personalized.isEmpty()) {
            return personalized.stream()
                    .map(ps -> scenarioRepository.findByScenarioId(ps.getScenarioId())
                            .map(s -> ScenarioResponse.builder()
                                    .id(s.getScenarioId())
                                    .title(ps.getTitle())
                                    .subtitle(ps.getSubtitle())
                                    // LLM이 준 감축률을 impact에 반영 (FE 변경 최소)
                                    .impactKg(s.getImpactKg() * clampReductionRate(ps.getReductionRate()))
                                    .impactWon(Math.round(s.getImpactWon() * clampReductionRate(ps.getReductionRate())))
                                    .difficulty(s.getDifficulty())
                                    .build())
                            .orElse(null))
                    .filter(s -> s != null)
                    .collect(java.util.stream.Collectors.toList());
        }

        // fallback: DB에서 카테고리 기본 시나리오 반환
        return fallbackScenarios(transportKg, electricityKg, consumptionKg);
    }

    /** AI 서버 응답 실패 시 DB 기본 시나리오 반환 */
    private List<ScenarioResponse> fallbackScenarios(
            double transportKg, double electricityKg, double consumptionKg) {
        Map<String, Double> scores = Map.of(
                "TRANSPORT", transportKg, "ELECTRICITY", electricityKg, "CONSUMPTION", consumptionKg);
        List<String> priorities = scores.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .map(Map.Entry::getKey)
                .collect(java.util.stream.Collectors.toList());

        List<ScenarioResponse> result = new ArrayList<>();
        if (!priorities.isEmpty()) {
            scenarioRepository.findByCategoryOrderByImpactKgDesc(priorities.get(0))
                    .stream().limit(2).map(this::toDto).forEach(result::add);
        }
        if (priorities.size() > 1) {
            scenarioRepository.findByCategoryOrderByImpactKgDesc(priorities.get(1))
                    .stream().limit(1).map(this::toDto).forEach(result::add);
        }
        scenarioRepository.findByCategoryOrderByImpactKgDesc("COMMON")
                .stream().limit(1).map(this::toDto).forEach(result::add);
        return result;
    }

    private ScenarioResponse toDto(Scenario s) {
        return ScenarioResponse.builder()
                .id(s.getScenarioId())
                .title(s.getTitle())
                .subtitle(s.getSubtitle())
                .impactKg(s.getImpactKg())
                .impactWon(s.getImpactWon())
                .difficulty(s.getDifficulty())
                .build();
    }

    /** 감축률(0~1) 방어 로직. 미설정/이상값이면 1.0(원래 impact 유지) */
    private double clampReductionRate(Double r) {
        if (r == null) return 1.0;
        if (r.isNaN() || r.isInfinite()) return 1.0;
        // LLM이 주는 범위는 0.05~0.50이지만, 서버에서는 넉넉하게 방어
        return Math.max(0.0, Math.min(1.0, r));
    }

    // ── private helpers ───────────────────────────────────────────────────────

    /** 날짜 범위 내 교통+소비 배출량 합계 (전기는 월단위라 제외) */
    private double weeklyEmission(Long userId, LocalDate start, LocalDate end) {
        return activityRepository.findByUser_UserIdAndActivityDateBetween(userId, start, end)
                .stream()
                .filter(a -> a.getCategory() != ActivityCategory.ELECTRICITY)
                .mapToDouble(this::emissionOf)
                .sum();
    }

    private double emissionOf(Activity a) {
        if (a.getEmissionResult() == null || a.getEmissionResult().getTotalEmission() == null) return 0.0;
        return a.getEmissionResult().getTotalEmission();
    }

    /**
     * [수정 1] 최근 6개월 월별 grand_total (교통 + 전기 + 소비 모든 카테고리 합산).
     * ARIMA 입력용 시계열 배열 빌드.
     */
    private List<MonthlyPoint> buildMonthlyGrandTotal(Long userId, LocalDate today) {
        List<MonthlyPoint> monthlyData = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = YearMonth.from(today).minusMonths(i);
            double total = activityRepository
                    .findByUser_UserIdAndActivityDateBetween(userId, ym.atDay(1), ym.atEndOfMonth())
                    .stream()
                    .mapToDouble(this::emissionOf)   // 전기 포함 전 카테고리
                    .sum();
            monthlyData.add(new MonthlyPoint(ym.format(MONTH_FMT), total));
        }
        return monthlyData;
    }

    private CategoryComparison buildCategoryComparison(
            String label, Long userId, ActivityCategory category, LocalDate today) {

        double prev = activityRepository
                .findByUser_UserIdAndActivityDateBetween(userId, today.minusDays(13), today.minusDays(7))
                .stream()
                .filter(a -> a.getCategory() == category)
                .mapToDouble(this::emissionOf)
                .sum();

        double curr = activityRepository
                .findByUser_UserIdAndActivityDateBetween(userId, today.minusDays(6), today)
                .stream()
                .filter(a -> a.getCategory() == category)
                .mapToDouble(this::emissionOf)
                .sum();

        return CategoryComparison.builder()
                .name(label)
                .prevWeek(round(prev))
                .currWeek(round(curr))
                .build();
    }

    private double round(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
