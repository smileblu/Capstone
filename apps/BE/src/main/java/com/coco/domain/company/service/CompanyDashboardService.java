package com.coco.domain.company.service;

import com.coco.domain.company.dto.CompanyAnalysisResponse;
import com.coco.domain.company.dto.CompanyAnalysisResponse.MonthlyPoint;
import com.coco.domain.company.dto.CompanyAnalysisResponse.ScopeData;
import com.coco.domain.company.dto.CompanyDashboardResponse;
import com.coco.domain.company.dto.CompanyDashboardResponse.EmissionSource;
import com.coco.domain.company.dto.CompanyDashboardResponse.InputStatus;
import com.coco.domain.company.entity.Company;
import com.coco.domain.company.entity.CompanyActivity;
import com.coco.domain.company.repository.CompanyActivityRepository;
import com.coco.domain.company.repository.CompanyRepository;
import com.coco.global.error.code.GeneralErrorCode;
import com.coco.global.error.exception.GeneralException;
import com.coco.global.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompanyDashboardService {

    private final CompanyRepository companyRepository;
    private final CompanyActivityRepository activityRepository;

    private static final Map<String, String> TYPE_LABEL = Map.of(
            "BUSINESS_ELECTRICITY",            "전력",
            "BUSINESS_STATIONARY_COMBUSTION",  "고정 연소",
            "BUSINESS_MOBILE_COMBUSTION",      "이동 연소",
            "BUSINESS_PROCESS_GAS",            "공정 가스",
            "BUSINESS_WASTE",                  "폐기물",
            "BUSINESS_WATER",                  "용수"
    );

    // 홈 화면 입력 현황에 표시할 순서 고정 목록
    private static final List<String> DISPLAY_ORDER = List.of(
            "BUSINESS_ELECTRICITY",
            "BUSINESS_STATIONARY_COMBUSTION",
            "BUSINESS_WASTE",
            "BUSINESS_MOBILE_COMBUSTION",
            "BUSINESS_PROCESS_GAS",
            "BUSINESS_WATER"
    );

    @Transactional(readOnly = true)
    public CompanyDashboardResponse getDashboard() {
        Long userId = SecurityUtil.getCurrentUserId();
        Company company = companyRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        String currentMonth = YearMonth.now().minusMonths(1).toString(); // 입력 대상: 이전 달
        String prevMonth    = YearMonth.now().minusMonths(2).toString();

        List<CompanyActivity> current = activityRepository
                .findByCompany_CompanyIdAndBillingMonth(company.getCompanyId(), currentMonth);
        List<CompanyActivity> prev = activityRepository
                .findByCompany_CompanyIdAndBillingMonth(company.getCompanyId(), prevMonth);

        double totalCurrent = sumCo2e(current);
        double totalPrev    = sumCo2e(prev);

        Double monthlyChange = totalPrev > 0
                ? round1((totalCurrent - totalPrev) / totalPrev * 100)
                : null;

        // 배출 구조 (Top 3)
        Map<String, Double> byType = current.stream().collect(
                Collectors.groupingBy(CompanyActivity::getType,
                        Collectors.summingDouble(a -> a.getCo2eKg().doubleValue())));

        List<EmissionSource> sources = byType.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(3)
                .map(e -> EmissionSource.builder()
                        .name(TYPE_LABEL.getOrDefault(e.getKey(), e.getKey()))
                        .percent(totalCurrent > 0 ? (int) Math.round(e.getValue() / totalCurrent * 100) : 0)
                        .build())
                .collect(Collectors.toList());

        // 입력 현황
        Set<String> enteredTypes = current.stream()
                .map(CompanyActivity::getType)
                .collect(Collectors.toSet());

        List<InputStatus> inputItems = DISPLAY_ORDER.stream()
                .map(type -> InputStatus.builder()
                        .name(TYPE_LABEL.getOrDefault(type, type))
                        .done(enteredTypes.contains(type))
                        .build())
                .collect(Collectors.toList());

        return CompanyDashboardResponse.builder()
                .totalEmission(round2(totalCurrent / 1000))  // kgCO₂e → tCO₂e
                .monthlyChange(monthlyChange)
                .emissionSources(sources)
                .inputItems(inputItems)
                .build();
    }

    // ── Scope 분류 ───────────────────────────────────────────────────────────
    private static final Set<String> SCOPE1_TYPES = Set.of(
            "BUSINESS_STATIONARY_COMBUSTION", "BUSINESS_MOBILE_COMBUSTION", "BUSINESS_PROCESS_GAS");
    private static final Set<String> SCOPE2_TYPES = Set.of("BUSINESS_ELECTRICITY");
    private static final Set<String> SCOPE3_TYPES = Set.of("BUSINESS_WASTE", "BUSINESS_WATER");

    @Transactional(readOnly = true)
    public CompanyAnalysisResponse getAnalysis() {
        Long userId = SecurityUtil.getCurrentUserId();
        Company company = companyRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        // 최근 6개월 빌링 월 목록
        YearMonth latest = YearMonth.now().minusMonths(1);
        List<String> months = new ArrayList<>();
        for (int i = 5; i >= 0; i--) months.add(latest.minusMonths(i).toString());

        List<CompanyActivity> activities = activityRepository
                .findByCompany_CompanyIdAndBillingMonthIn(company.getCompanyId(), months);

        // 월별 집계
        Map<String, Double> monthlyTotal = new LinkedHashMap<>();
        months.forEach(m -> monthlyTotal.put(m, 0.0));
        for (CompanyActivity a : activities) {
            if (a.getCo2eKg() == null) continue;
            monthlyTotal.merge(a.getBillingMonth(), a.getCo2eKg().doubleValue(), Double::sum);
        }

        List<MonthlyPoint> trendData = monthlyTotal.entrySet().stream()
                .map(e -> MonthlyPoint.builder()
                        .month(e.getKey())
                        .emission(round2(e.getValue() / 1000))
                        .build())
                .collect(Collectors.toList());

        // 당월 Scope별 집계
        String currentMonth = latest.toString();
        String prevMonth    = latest.minusMonths(1).toString();

        List<CompanyActivity> curr = activities.stream()
                .filter(a -> currentMonth.equals(a.getBillingMonth())).toList();
        List<CompanyActivity> prev = activities.stream()
                .filter(a -> prevMonth.equals(a.getBillingMonth())).toList();

        double s1Curr = sumByTypes(curr, SCOPE1_TYPES);
        double s2Curr = sumByTypes(curr, SCOPE2_TYPES);
        double s3Curr = sumByTypes(curr, SCOPE3_TYPES);
        double totalCurr = s1Curr + s2Curr + s3Curr;

        double s1Prev = sumByTypes(prev, SCOPE1_TYPES);
        double s2Prev = sumByTypes(prev, SCOPE2_TYPES);
        double s3Prev = sumByTypes(prev, SCOPE3_TYPES);

        List<ScopeData> scopeData = List.of(
                buildScope("Scope 1", "직접 배출 (연료, 차량, 공정)", s1Curr, s1Prev, totalCurr),
                buildScope("Scope 2", "간접 배출 (전력 사용)",       s2Curr, s2Prev, totalCurr),
                buildScope("Scope 3", "기타 간접 배출 (폐기물, 용수)", s3Curr, s3Prev, totalCurr)
        );

        // 최대 scope 이름
        ScopeData topScope = scopeData.stream()
                .max(Comparator.comparingInt(ScopeData::getValue)).orElse(null);
        String insight = topScope != null
                ? "이번 달 배출 증가의 주요 원인은 " + topScope.getName() + " (" + topScope.getDescription() + ")입니다."
                : "아직 입력된 배출 데이터가 없습니다.";

        // 이상치 탐지: 최근 6개월 평균 대비 당월 1.3배 초과
        double[] series = monthlyTotal.values().stream().mapToDouble(v -> v).toArray();
        double avg = Arrays.stream(series).average().orElse(0);
        double latestVal = monthlyTotal.getOrDefault(currentMonth, 0.0);
        CompanyAnalysisResponse.AnomalyAlert anomaly = null;
        if (avg > 0 && latestVal > avg * 1.3) {
            double pct = round1((latestVal - avg) / avg * 100);
            anomaly = CompanyAnalysisResponse.AnomalyAlert.builder()
                    .message(currentMonth + " 배출량이 최근 평균 대비 " + pct + "% 높습니다")
                    .changePercent(pct)
                    .build();
        }

        return CompanyAnalysisResponse.builder()
                .trendData(trendData)
                .scopeData(scopeData)
                .insight(insight)
                .anomaly(anomaly)
                .build();
    }

    private double sumByTypes(List<CompanyActivity> list, Set<String> types) {
        return list.stream()
                .filter(a -> types.contains(a.getType()) && a.getCo2eKg() != null)
                .mapToDouble(a -> a.getCo2eKg().doubleValue())
                .sum();
    }

    private ScopeData buildScope(String name, String desc, double curr, double prev, double total) {
        int pct = total > 0 ? (int) Math.round(curr / total * 100) : 0;
        String change = prev > 0
                ? (curr >= prev ? "+" : "") + round1((curr - prev) / prev * 100) + "%"
                : "데이터 없음";
        return ScopeData.builder()
                .name(name).description(desc).value(pct).change(change).build();
    }

    private double sumCo2e(List<CompanyActivity> activities) {
        return activities.stream()
                .filter(a -> a.getCo2eKg() != null)
                .mapToDouble(a -> a.getCo2eKg().doubleValue())
                .sum();
    }

    private double round1(double v) { return Math.round(v * 10.0) / 10.0; }
    private double round2(double v) { return Math.round(v * 100.0) / 100.0; }
}
