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

        // AI 예측 (최근 6개월 월별 데이터)
        double monthlyTarget = getAiPrediction(userId, today);
        double weeklyTarget = monthlyTarget / 4.0;

        // 개선율: 지난주 대비 이번주 변화율
        double improvementRate = w2 > 0 ? (w1 - w2) / w2 * 100.0 : 0.0;

        // 경고 건수: 4주 평균의 1.5배 초과한 주 수
        double avg = (w4 + w3 + w2 + w1) / 4.0;
        int warningCount = (int) List.of(w4, w3, w2, w1).stream()
                .filter(w -> w > avg * 1.5)
                .count();

        // 주별 추세
        List<WeeklyTrendPoint> weeklyTrend = List.of(
                WeeklyTrendPoint.builder().week("3주전").actual(round(w4)).target(null).build(),
                WeeklyTrendPoint.builder().week("2주전").actual(round(w3)).target(null).build(),
                WeeklyTrendPoint.builder().week("지난주").actual(round(w2)).target(null).build(),
                WeeklyTrendPoint.builder().week("이번주").actual(round(w1)).target(round(weeklyTarget)).build()
        );

        // 카테고리별 비교 (지난주 vs 이번주)
        List<CategoryComparison> categoryComparison = List.of(
                buildCategoryComparison("교통", userId, ActivityCategory.TRANSPORT, today),
                buildCategoryComparison("소비", userId, ActivityCategory.CONSUMPTION, today)
        );

        return AnalysisResponse.builder()
                .improvementRate(round(improvementRate))
                .warningCount(warningCount)
                .weeklyTrend(weeklyTrend)
                .categoryComparison(categoryComparison)
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
                                    .impactKg(s.getImpactKg())
                                    .impactWon(s.getImpactWon())
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

    /** 최근 6개월 월별 배출량 → AI 서버에 전달해 다음달 예측 */
    private double getAiPrediction(Long userId, LocalDate today) {
        List<MonthlyPoint> monthlyData = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = YearMonth.from(today).minusMonths(i);
            double total = activityRepository
                    .findByUser_UserIdAndActivityDateBetween(userId, ym.atDay(1), ym.atEndOfMonth())
                    .stream()
                    .mapToDouble(this::emissionOf)
                    .sum();
            monthlyData.add(new MonthlyPoint(ym.format(MONTH_FMT), total));
        }
        return aiPredictClient.predict(monthlyData);
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
