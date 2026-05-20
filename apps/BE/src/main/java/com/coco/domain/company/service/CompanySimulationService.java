package com.coco.domain.company.service;

import com.coco.domain.company.dto.SimulationResponse;
import com.coco.domain.company.dto.SimulationResponse.EmissionPoint;
import com.coco.domain.company.dto.SimulationResponse.ScenarioInfo;
import com.coco.domain.company.entity.Company;
import com.coco.domain.company.entity.CompanyActivity;
import com.coco.domain.company.repository.CompanyActivityRepository;
import com.coco.domain.company.repository.CompanyRepository;
import com.coco.global.client.AiPredictClient;
import com.coco.global.error.code.GeneralErrorCode;
import com.coco.global.error.exception.GeneralException;
import com.coco.global.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CompanySimulationService {

    private final CompanyRepository companyRepository;
    private final CompanyActivityRepository activityRepository;
    private final AiPredictClient aiPredictClient;

    // K-ETS 탄소가격 (원/kgCO₂e)
    private static final double CARBON_PRICE_PER_KG = 12.0;

    // fallback 감축률 (AI 실패 시)
    private static final double RATE_A = 0.08;
    private static final double RATE_B = 0.12;
    private static final double RATE_C = 0.17;

    private static final List<String> SCOPE1_TYPES = List.of(
            "BUSINESS_STATIONARY_COMBUSTION", "BUSINESS_MOBILE_COMBUSTION", "BUSINESS_PROCESS_GAS");
    private static final List<String> SCOPE2_TYPES = List.of("BUSINESS_ELECTRICITY");
    private static final List<String> SCOPE3_TYPES = List.of("BUSINESS_WASTE", "BUSINESS_WATER");

    @Transactional(readOnly = true)
    public SimulationResponse getSimulation() {
        Long userId = SecurityUtil.getCurrentUserId();
        Company company = companyRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));
        Long companyId = company.getCompanyId();

        // 최근 3개월 + 미래 6개월 = 총 9개월
        YearMonth current = YearMonth.now(); // 현재 달 기준
        List<String> pastMonths = List.of(
                current.minusMonths(2).toString(),
                current.minusMonths(1).toString(),
                current.toString()
        );

        // 과거 3개월 실제 데이터 집계 (월별 tCO₂e) + scope별 집계
        Map<String, Double> actualMap = new LinkedHashMap<>();
        double scope1TotalKg = 0, scope2TotalKg = 0, scope3TotalKg = 0;
        Map<String, Double> typeKgMap = new LinkedHashMap<>();

        for (String month : pastMonths) {
            List<CompanyActivity> acts = activityRepository
                    .findByCompany_CompanyIdAndBillingMonth(companyId, month);
            double totalKg = 0;
            for (CompanyActivity a : acts) {
                double kg = a.getCo2eKg() == null ? 0 : a.getCo2eKg().doubleValue();
                totalKg += kg;
                String type = a.getType();
                typeKgMap.merge(type, kg, Double::sum);
                if (SCOPE1_TYPES.contains(type)) scope1TotalKg += kg;
                else if (SCOPE2_TYPES.contains(type)) scope2TotalKg += kg;
                else if (SCOPE3_TYPES.contains(type)) scope3TotalKg += kg;
            }
            actualMap.put(month, round2(totalKg / 1000.0)); // kg → tCO₂e
        }

        // 현재 달 기준값 및 추세 계산
        List<Double> actuals = new ArrayList<>(actualMap.values());
        double baseline = actuals.get(2); // 현재 달 배출량
        double trend = computeTrend(actuals); // 월간 추세 (tCO₂e)

        // 데이터가 없으면 기본값 사용
        if (baseline == 0.0) baseline = 100.0;

        // scope 비율 계산
        double totalKg3m = scope1TotalKg + scope2TotalKg + scope3TotalKg;
        double scope1Ratio = totalKg3m > 0 ? scope1TotalKg / totalKg3m : 0.33;
        double scope2Ratio = totalKg3m > 0 ? scope2TotalKg / totalKg3m : 0.33;
        double scope3Ratio = totalKg3m > 0 ? scope3TotalKg / totalKg3m : 0.34;
        double avg3mKg = totalKg3m > 0 ? totalKg3m / 3.0 : 100_000.0;

        // 3개월 평균 전월 대비 변화율
        double momChangeRate = 0.0;
        if (actuals.get(1) > 0) {
            momChangeRate = (actuals.get(2) - actuals.get(1)) / actuals.get(1);
        }

        // 최다 배출 타입
        String topEmissionType = typeKgMap.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("BUSINESS_ELECTRICITY");

        // AI 시나리오 요청
        double rateA = RATE_A, rateB = RATE_B, rateC = RATE_C;
        String titleA = "에너지 효율화 설비 도입", descA = "LED 조명·고효율 설비 교체로 전력 소비 절감";
        String titleB = "청정 연료 전환",       descB = "고정 연소 연료를 저탄소 연료로 단계적 전환";
        String titleC = "재생에너지 전환",       descC = "태양광 패널 설치로 전력 및 간접 배출량 대폭 감축";

        AiPredictClient.CompanyProfile profile = new AiPredictClient.CompanyProfile(
                company.getIndustry(),
                company.getManagementPurpose(),
                topEmissionType,
                avg3mKg,
                momChangeRate,
                scope1Ratio,
                scope2Ratio,
                scope3Ratio
        );
        AiPredictClient.CompanyScenarioResponse aiResp = aiPredictClient.companyScenario(profile);

        if (aiResp != null && aiResp.getScenarios() != null && aiResp.getScenarios().size() >= 3) {
            AiPredictClient.CompanyScenarioItem s0 = aiResp.getScenarios().get(0);
            AiPredictClient.CompanyScenarioItem s1 = aiResp.getScenarios().get(1);
            AiPredictClient.CompanyScenarioItem s2 = aiResp.getScenarios().get(2);
            rateA = s0.getReductionRate(); titleA = s0.getTitle(); descA = s0.getDescription();
            rateB = s1.getReductionRate(); titleB = s1.getTitle(); descB = s1.getDescription();
            rateC = s2.getReductionRate(); titleC = s2.getTitle(); descC = s2.getDescription();
        }

        // EmissionPoint 목록 구성
        List<EmissionPoint> points = new ArrayList<>();

        // 과거 2개월 (actual만)
        for (int i = 0; i < 2; i++) {
            String month = pastMonths.get(i);
            points.add(EmissionPoint.builder()
                    .month(month)
                    .actual(actualMap.get(month))
                    .current(null).scenarioA(null).scenarioB(null).scenarioC(null)
                    .build());
        }

        // 현재 달 (actual + 모든 시나리오 시작점)
        points.add(EmissionPoint.builder()
                .month(current.toString())
                .actual(baseline)
                .current(baseline)
                .scenarioA(baseline)
                .scenarioB(baseline)
                .scenarioC(baseline)
                .build());

        // 미래 6개월 예측
        final double fRateA = rateA, fRateB = rateB, fRateC = rateC;
        for (int i = 1; i <= 6; i++) {
            String month = current.plusMonths(i).toString();
            double cur = round2(Math.max(0, baseline + trend * i));
            double sA  = round2(Math.max(0, baseline * Math.pow(1 - fRateA, i) + trend * i));
            double sB  = round2(Math.max(0, baseline * Math.pow(1 - fRateB, i) + trend * i));
            double sC  = round2(Math.max(0, baseline * Math.pow(1 - fRateC, i) + trend * i));
            points.add(EmissionPoint.builder()
                    .month(month)
                    .actual(null)
                    .current(cur)
                    .scenarioA(sA)
                    .scenarioB(sB)
                    .scenarioC(sC)
                    .build());
        }

        // 시나리오 정보 (6개월 누적 효과)
        double saving6A = cumulativeSaving(baseline, trend, rateA, 6);
        double saving6B = cumulativeSaving(baseline, trend, rateB, 6);
        double saving6C = cumulativeSaving(baseline, trend, rateC, 6);

        List<ScenarioInfo> scenarios = List.of(
                ScenarioInfo.builder()
                        .id("A").title(titleA).description(descA)
                        .co2ReductionTon(round2(saving6A))
                        .costSaving(Math.round(saving6A * 1000 * CARBON_PRICE_PER_KG))
                        .recommended(true)
                        .build(),
                ScenarioInfo.builder()
                        .id("B").title(titleB).description(descB)
                        .co2ReductionTon(round2(saving6B))
                        .costSaving(Math.round(saving6B * 1000 * CARBON_PRICE_PER_KG))
                        .recommended(false)
                        .build(),
                ScenarioInfo.builder()
                        .id("C").title(titleC).description(descC)
                        .co2ReductionTon(round2(saving6C))
                        .costSaving(Math.round(saving6C * 1000 * CARBON_PRICE_PER_KG))
                        .recommended(false)
                        .build()
        );

        return SimulationResponse.builder()
                .points(points)
                .scenarios(scenarios)
                .build();
    }

    /** 최근 3개월 데이터로 선형 추세 계산 (월간 변화량, tCO₂e) */
    private double computeTrend(List<Double> values) {
        if (values.size() < 2) return 0.0;
        // 단순 평균 기울기
        double slope = 0.0;
        for (int i = 1; i < values.size(); i++) {
            slope += values.get(i) - values.get(i - 1);
        }
        return slope / (values.size() - 1);
    }

    /** 시나리오 적용 시 현재 대비 n개월 누적 감축량 (tCO₂e) */
    private double cumulativeSaving(double baseline, double trend, double rate, int months) {
        double saving = 0.0;
        for (int i = 1; i <= months; i++) {
            double cur = Math.max(0, baseline + trend * i);
            double sc  = Math.max(0, baseline * Math.pow(1 - rate, i) + trend * i);
            saving += cur - sc;
        }
        return saving;
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
