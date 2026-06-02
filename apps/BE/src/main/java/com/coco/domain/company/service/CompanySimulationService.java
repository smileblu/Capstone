package com.coco.domain.company.service;

import com.coco.domain.company.dto.SimulationResponse;
import com.coco.domain.company.dto.SimulationResponse.ActionInfo;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompanySimulationService {

    private final CompanyRepository companyRepository;
    private final CompanyActivityRepository activityRepository;
    private final AiPredictClient aiPredictClient;

    @Value("${carbon.kets-won-per-ton:23500}")
    private long ketsPricePerTon;

    // Ramp-up 적용 월별 감축률 계수 (1~6개월차)
    private static final double[] RAMP_UP = {0.3, 0.6, 0.85, 1.0, 1.0, 1.0};

    // fallback 감축률 (AI 실패 시)
    private static final double FALLBACK_RATE_A = 0.08;
    private static final double FALLBACK_RATE_B = 0.12;
    private static final double FALLBACK_RATE_C = 0.17;

    private static final List<String> SCOPE1_STATIONARY = List.of("BUSINESS_STATIONARY_COMBUSTION", "BUSINESS_PROCESS_GAS");
    private static final List<String> SCOPE1_MOBILE     = List.of("BUSINESS_MOBILE_COMBUSTION");
    private static final List<String> SCOPE2_TYPES      = List.of("BUSINESS_ELECTRICITY");
    private static final List<String> SCOPE3_WASTE      = List.of("BUSINESS_WASTE");
    private static final List<String> SCOPE3_WATER      = List.of("BUSINESS_WATER");

    @Transactional(readOnly = true)
    public SimulationResponse getSimulation() {
        Long userId = SecurityUtil.getCurrentUserId();
        Company company = companyRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));
        Long companyId = company.getCompanyId();
        YearMonth current = YearMonth.now();

        // ── 1. 최대 12개월 과거 데이터 집계 ──────────────────────────────────
        YearMonth historyFrom = current.minusMonths(11);
        List<CompanyActivity> allActs = activityRepository.findByCompanyIdSince(
                companyId, historyFrom.toString());

        // 월별 tCO₂e 집계
        Map<String, Double> monthlyTotals = new LinkedHashMap<>();
        Map<String, Double> categoryKgMap = new LinkedHashMap<>(); // category → kg 누계

        for (CompanyActivity a : allActs) {
            double kg = a.getCo2eKg() == null ? 0 : a.getCo2eKg().doubleValue();
            String month = a.getBillingMonth();
            monthlyTotals.merge(month, kg / 1000.0, Double::sum); // kg → tCO₂e

            // 카테고리별 kg 집계 (AI 요청용)
            String cat = toCategoryKey(a.getType());
            categoryKgMap.merge(cat, kg, Double::sum);
        }

        // 최근 3개월 실제 데이터
        List<String> past3 = List.of(
                current.minusMonths(2).toString(),
                current.minusMonths(1).toString(),
                current.toString());

        double baseline = monthlyTotals.getOrDefault(current.toString(), 0.0);
        if (baseline == 0.0) baseline = 100.0;

        List<Double> actuals3 = past3.stream()
                .map(m -> monthlyTotals.getOrDefault(m, 0.0))
                .collect(Collectors.toList());
        double trend = computeTrend(actuals3);

        // ── 2. ARIMA Baseline 예측 (AI 서버 호출) ────────────────────────────
        // 오래된 달부터 정렬된 시계열 구성
        List<Double> historySeries = buildSortedSeries(historyFrom, current, monthlyTotals);
        int dataMonths = historySeries.size();

        AiPredictClient.CompanyBaselineResponse baselineResp = null;
        if (dataMonths >= 3) {
            AiPredictClient.CompanyBaselineRequest baselineReq =
                    new AiPredictClient.CompanyBaselineRequest(
                            historySeries, dataMonths, company.getIndustry());
            baselineResp = aiPredictClient.companyBaseline(baselineReq);
        }

        List<Double> baselineForecast6; // 미래 6개월 tCO₂e
        String modelUsed;

        if (baselineResp != null && baselineResp.getForecast() != null
                && baselineResp.getForecast().size() == 6) {
            baselineForecast6 = baselineResp.getForecast();
            modelUsed = baselineResp.getModelUsed();
        } else {
            // fallback: 선형 외삽
            baselineForecast6 = linearForecast(baseline, trend, 6);
            modelUsed = "linear_fallback";
        }

        // ── 3. 카테고리 가중치 계산 ───────────────────────────────────────────
        Map<String, Double> categoryWeights = computeCategoryWeights(categoryKgMap);
        double recent3moAvgKg = actuals3.stream().mapToDouble(v -> v * 1000).average().orElse(baseline * 1000);
        double yoyChangePct = computeYoyChangePct(historyFrom, current, monthlyTotals);
        long monthlyCarbonCostKrw = Math.round(baseline * ketsPricePerTon);

        // ── 4. LLM 감축 시나리오 요청 ────────────────────────────────────────
        AiPredictClient.CompanyScenarioFullRequest scenarioReq = buildScenarioRequest(
                company, recent3moAvgKg, yoyChangePct, categoryWeights,
                baselineForecast6, monthlyCarbonCostKrw);

        AiPredictClient.CompanyScenarioFullResponse scenarioResp =
                aiPredictClient.companyScenarioFull(scenarioReq);

        List<ScenarioInfo> scenarios;
        if (scenarioResp != null && scenarioResp.getScenarios() != null
                && scenarioResp.getScenarios().size() >= 3) {
            scenarios = buildScenariosFromLlm(
                    scenarioResp.getScenarios(), categoryWeights, baselineForecast6);
        } else {
            scenarios = buildFallbackScenarios(baseline, categoryWeights, baselineForecast6);
        }

        // ── 5. EmissionPoint 목록 구성 ────────────────────────────────────────
        List<Double> sAForecast = scenarios.get(0).getScenarioForecast();
        List<Double> sBForecast = scenarios.get(1).getScenarioForecast();
        List<Double> sCForecast = scenarios.get(2).getScenarioForecast();

        List<EmissionPoint> points = new ArrayList<>();

        // 과거 2개월 (actual만)
        for (int i = 0; i < 2; i++) {
            String month = past3.get(i);
            points.add(EmissionPoint.builder()
                    .month(month)
                    .actual(round2(monthlyTotals.getOrDefault(month, 0.0)))
                    .current(null).scenarioA(null).scenarioB(null).scenarioC(null)
                    .build());
        }

        // 현재 달 (actual + 모든 시나리오 시작점)
        points.add(EmissionPoint.builder()
                .month(current.toString())
                .actual(round2(baseline))
                .current(round2(baseline))
                .scenarioA(round2(baseline))
                .scenarioB(round2(baseline))
                .scenarioC(round2(baseline))
                .build());

        // 미래 6개월
        for (int i = 0; i < 6; i++) {
            String month = current.plusMonths(i + 1).toString();
            points.add(EmissionPoint.builder()
                    .month(month)
                    .actual(null)
                    .current(round2(baselineForecast6.get(i)))
                    .scenarioA(round2(sAForecast.get(i)))
                    .scenarioB(round2(sBForecast.get(i)))
                    .scenarioC(round2(sCForecast.get(i)))
                    .build());
        }

        return SimulationResponse.builder()
                .modelUsed(modelUsed)
                .points(points)
                .scenarios(scenarios)
                .build();
    }

    // ── LLM 응답 → ScenarioInfo 변환 ─────────────────────────────────────────

    private List<ScenarioInfo> buildScenariosFromLlm(
            List<AiPredictClient.CompanyScenarioItemFull> items,
            Map<String, Double> categoryWeights,
            List<Double> baselineForecast) {

        String[] ids = {"A", "B", "C"};

        // ── 1단계: 3개 시나리오 지표를 모두 미리 계산 ────────────────────────
        double[]        paybacks    = new double[3];
        long[]          investments = new long[3];
        double[]        co2Savings  = new double[3];
        long[]          costSavings = new long[3];
        Double[]        roi5yrs     = new Double[3];
        List<Double>[]  forecasts   = new List[3];
        List<List<ActionInfo>> actionInfosList = new ArrayList<>();

        for (int i = 0; i < 3; i++) {
            AiPredictClient.CompanyScenarioItemFull item = items.get(i);
            List<AiPredictClient.ActionItemDto> actions = item.getActions() != null
                    ? item.getActions() : List.of();

            double totalRate    = computeTotalReductionRate(actions, categoryWeights);
            forecasts[i]        = applyRampUp(baselineForecast, totalRate);
            co2Savings[i]       = computeCo2Saving(baselineForecast, forecasts[i]);
            costSavings[i]      = Math.round(co2Savings[i] * ketsPricePerTon);
            investments[i]      = actions.stream().mapToLong(AiPredictClient.ActionItemDto::getInvestmentCostKrw).sum();
            long annualSaving   = costSavings[i] * 2L;
            paybacks[i]         = annualSaving > 0 ? (double) investments[i] / (annualSaving / 12.0) : 9999.0;
            roi5yrs[i]          = investments[i] > 0
                    ? (annualSaving * 5.0 - investments[i]) / investments[i] * 100.0 : null;

            List<ActionInfo> actionInfos = actions.stream()
                    .map(a -> ActionInfo.builder()
                            .targetCategory(a.getTargetCategory())
                            .actionDesc(a.getActionDesc())
                            .reductionRate(a.getReductionRate())
                            .investmentCostKrw(a.getInvestmentCostKrw())
                            .paybackMonths(a.getPaybackMonths())
                            .build())
                    .collect(Collectors.toList());
            actionInfosList.add(actionInfos);
        }

        // ── 2단계: BE 계산 기준으로 recommended 결정 ─────────────────────────
        // 중소기업 우선순위: ① 투자금 20M 이하 중 payback 최단, ② 없으면 전체 중 payback 최단
        int bestIdx = pickRecommendedIdx(paybacks, investments);

        // ── 3단계: ScenarioInfo 빌드 ─────────────────────────────────────────
        List<ScenarioInfo> result = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            AiPredictClient.CompanyScenarioItemFull item = items.get(i);
            result.add(ScenarioInfo.builder()
                    .id(ids[i])
                    .name(item.getName())
                    .label(item.getLabel() != null ? item.getLabel() : "")
                    .description(item.getDescription())
                    .difficulty(item.getDifficulty() != null ? item.getDifficulty() : "medium")
                    .recommended(i == bestIdx)        // Claude 판단 무시, BE 계산값 사용
                    .feasibility(item.getFeasibility())
                    .actions(actionInfosList.get(i))
                    .co2ReductionKg(round2(co2Savings[i] * 1000))
                    .co2ReductionTon(round2(co2Savings[i]))
                    .costSavingKrw(costSavings[i])
                    .investmentCostKrw(investments[i])
                    .paybackMonths(round2(paybacks[i]))
                    .fiveYearRoiPct(roi5yrs[i] != null ? round2(roi5yrs[i]) : null)
                    .scenarioForecast(forecasts[i])
                    .build());
        }
        return result;
    }

    /** 중소기업 기준 추천 인덱스 결정.
     *  ① 투자금 20,000,000원 이하 시나리오 중 payback 최단
     *  ② 없으면 전체 중 payback 최단
     *  ③ 그래도 없으면 A(0) */
    private int pickRecommendedIdx(double[] paybacks, long[] investments) {
        final long AFFORDABLE = 20_000_000L;
        int best = -1;
        double bestPb = 9999.0;
        // 우선: 투자금 20M 이하
        for (int i = 0; i < paybacks.length; i++) {
            if (investments[i] <= AFFORDABLE && paybacks[i] < bestPb) {
                best = i; bestPb = paybacks[i];
            }
        }
        // fallback: 전체
        if (best == -1) {
            for (int i = 0; i < paybacks.length; i++) {
                if (paybacks[i] < bestPb) { best = i; bestPb = paybacks[i]; }
            }
        }
        return best == -1 ? 0 : best;
    }

    // ── fallback 시나리오 (AI 실패 시) ────────────────────────────────────────

    private List<ScenarioInfo> buildFallbackScenarios(
            double baseline,
            Map<String, Double> categoryWeights,
            List<Double> baselineForecast) {

        record FallbackDef(String id, String name, String label, String desc,
                           String difficulty, double rate, boolean recommended,
                           String category, long investment) {}

        List<FallbackDef> defs = List.of(
                new FallbackDef("A", "에너지 효율화 설비 도입", "Moderate Reduction",
                        "LED 조명·고효율 설비 교체로 전력 소비를 단계적으로 절감합니다.",
                        "low", FALLBACK_RATE_A, true, "electricity", 5_000_000L),
                new FallbackDef("B", "청정 연료 전환", "Strong Reduction",
                        "고정 연소 연료를 저탄소 연료로 단계적으로 전환합니다.",
                        "medium", FALLBACK_RATE_B, false, "stationary_fuel", 15_000_000L),
                new FallbackDef("C", "재생에너지 전환", "Maximum Reduction",
                        "태양광 패널 설치로 전력 및 간접 배출량을 대폭 감축합니다.",
                        "high", FALLBACK_RATE_C, false, "electricity", 30_000_000L)
        );

        // payback/investment 먼저 계산해서 recommended 결정
        double[] fbPaybacks = new double[defs.size()];
        long[]   fbInvests  = new long[defs.size()];
        for (int i = 0; i < defs.size(); i++) {
            FallbackDef d = defs.get(i);
            double catWeight   = categoryWeights.getOrDefault(d.category(), 0.6);
            double totalRate   = d.rate() * catWeight;
            List<Double> fc    = applyRampUp(baselineForecast, totalRate);
            double co2Sav      = computeCo2Saving(baselineForecast, fc);
            long costSav       = Math.round(co2Sav * ketsPricePerTon);
            long annSav        = costSav * 2L;
            fbPaybacks[i]      = annSav > 0 ? d.investment() / (annSav / 12.0) : 9999.0;
            fbInvests[i]       = d.investment();
        }
        int fbBestIdx = pickRecommendedIdx(fbPaybacks, fbInvests);

        List<ScenarioInfo> result = new ArrayList<>();
        for (int idx = 0; idx < defs.size(); idx++) {
            FallbackDef d = defs.get(idx);
            double catWeight = categoryWeights.getOrDefault(d.category(), 0.6);
            double totalRate = d.rate() * catWeight;
            List<Double> forecast = applyRampUp(baselineForecast, totalRate);
            double co2SavingTon = computeCo2Saving(baselineForecast, forecast);
            long costSaving = Math.round(co2SavingTon * ketsPricePerTon);
            long annualSaving = costSaving * 2L;
            double payback = annualSaving > 0 ? d.investment() / (annualSaving / 12.0) : 9999.0;
            Double roi5yr = d.investment() > 0
                    ? (annualSaving * 5.0 - d.investment()) / d.investment() * 100.0 : null;

            result.add(ScenarioInfo.builder()
                    .id(d.id()).name(d.name()).label(d.label()).description(d.desc())
                    .difficulty(d.difficulty()).recommended(idx == fbBestIdx).feasibility(0.8)
                    .actions(List.of(ActionInfo.builder()
                            .targetCategory(d.category())
                            .actionDesc(d.desc())
                            .reductionRate(d.rate())
                            .investmentCostKrw(d.investment())
                            .paybackMonths((int) Math.round(payback))
                            .build()))
                    .co2ReductionKg(round2(co2SavingTon * 1000))
                    .co2ReductionTon(round2(co2SavingTon))
                    .costSavingKrw(costSaving)
                    .investmentCostKrw(d.investment())
                    .paybackMonths(round2(payback))
                    .fiveYearRoiPct(roi5yr != null ? round2(roi5yr) : null)
                    .scenarioForecast(forecast)
                    .build());
        }
        return result;
    }

    // ── 계산 헬퍼 ─────────────────────────────────────────────────────────────

    /** 총 감축률 = Σ(카테고리 가중치 × action 감축률) */
    private double computeTotalReductionRate(
            List<AiPredictClient.ActionItemDto> actions,
            Map<String, Double> categoryWeights) {
        double total = 0.0;
        for (AiPredictClient.ActionItemDto a : actions) {
            double w = categoryWeights.getOrDefault(a.getTargetCategory(), 0.1);
            total += w * a.getReductionRate();
        }
        return Math.min(total, 0.99); // 최대 99% 감축
    }

    /** Ramp-up 적용 월별 배출량 (baseline × (1 - ramp * rate)) */
    private List<Double> applyRampUp(List<Double> baselineForecast, double totalRate) {
        List<Double> result = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            double ramp = RAMP_UP[i] * totalRate;
            result.add(round2(Math.max(0.0, baselineForecast.get(i) * (1.0 - ramp))));
        }
        return result;
    }

    /** 6개월 누적 절감량 (tCO₂e) */
    private double computeCo2Saving(List<Double> baseline, List<Double> scenario) {
        double saving = 0.0;
        for (int i = 0; i < Math.min(baseline.size(), scenario.size()); i++) {
            saving += baseline.get(i) - scenario.get(i);
        }
        return Math.max(0.0, saving);
    }

    /** 오래된 달부터 정렬된 tCO₂e 시계열 */
    private List<Double> buildSortedSeries(YearMonth from, YearMonth to,
                                            Map<String, Double> monthlyTotals) {
        List<Double> series = new ArrayList<>();
        YearMonth m = from;
        while (!m.isAfter(to)) {
            series.add(monthlyTotals.getOrDefault(m.toString(), 0.0));
            m = m.plusMonths(1);
        }
        return series;
    }

    /** 카테고리 가중치 맵 (합계 1.0) */
    private Map<String, Double> computeCategoryWeights(Map<String, Double> categoryKgMap) {
        double total = categoryKgMap.values().stream().mapToDouble(Double::doubleValue).sum();
        if (total <= 0) return Map.of("electricity", 0.6, "stationary_fuel", 0.3,
                "mobile_combustion", 0.07, "waste", 0.02, "water", 0.01);
        Map<String, Double> weights = new LinkedHashMap<>();
        for (Map.Entry<String, Double> e : categoryKgMap.entrySet()) {
            weights.put(e.getKey(), e.getValue() / total);
        }
        return weights;
    }

    /** activity type → category key 변환 */
    private String toCategoryKey(String type) {
        if (type == null) return "other";
        if (SCOPE2_TYPES.contains(type))      return "electricity";
        if (SCOPE1_STATIONARY.contains(type)) return "stationary_fuel";
        if (SCOPE1_MOBILE.contains(type))     return "mobile_combustion";
        if (SCOPE3_WASTE.contains(type))      return "waste";
        if (SCOPE3_WATER.contains(type))      return "water";
        return "other";
    }

    /** 전년 대비 변화율(%) */
    private double computeYoyChangePct(YearMonth historyFrom, YearMonth current,
                                        Map<String, Double> monthlyTotals) {
        String yearAgo = current.minusMonths(12).toString();
        double prev = monthlyTotals.getOrDefault(yearAgo, 0.0);
        double curr = monthlyTotals.getOrDefault(current.toString(), 0.0);
        if (prev <= 0) return 0.0;
        return (curr - prev) / prev * 100.0;
    }

    /** LLM 요청 빌드 */
    private AiPredictClient.CompanyScenarioFullRequest buildScenarioRequest(
            Company company, double recent3moAvgKg, double yoyChangePct,
            Map<String, Double> categoryWeights, List<Double> baselineForecast6,
            long monthlyCarbonCostKrw) {

        String siteType = deriveSiteType(company.getIndustry());
        int employeeCount = deriveEmployeeCount(company.getEmployeeRange());
        String purpose = company.getManagementPurpose() != null
                ? company.getManagementPurpose().toLowerCase() : "internal";

        AiPredictClient.CompanyContextDto ctx = new AiPredictClient.CompanyContextDto(
                company.getIndustry() != null ? company.getIndustry() : "기타",
                siteType, employeeCount, purpose);

        AiPredictClient.EmissionSummaryDto ems = new AiPredictClient.EmissionSummaryDto(
                recent3moAvgKg, yoyChangePct, categoryWeights);

        AiPredictClient.CostContextDto cost = new AiPredictClient.CostContextDto(
                monthlyCarbonCostKrw, (int) ketsPricePerTon);

        return new AiPredictClient.CompanyScenarioFullRequest(
                ctx, ems, baselineForecast6, cost, List.of());
    }

    private String deriveSiteType(String industry) {
        if (industry == null) return "일반";
        return switch (industry.toUpperCase()) {
            case "MANUFACTURING", "CONSTRUCTION" -> "공장";
            case "IT", "SERVICE", "FINANCE" -> "사무실";
            default -> "일반";
        };
    }

    private int deriveEmployeeCount(String range) {
        if (range == null) return 50;
        return switch (range) {
            case "lt10"    -> 5;
            case "10to50"  -> 30;
            case "50to100" -> 75;
            case "100to300"-> 200;
            case "gt300"   -> 500;
            default        -> 50;
        };
    }

    /** 선형 추세 (평균 기울기) */
    private double computeTrend(List<Double> values) {
        if (values.size() < 2) return 0.0;
        double slope = 0.0;
        for (int i = 1; i < values.size(); i++) slope += values.get(i) - values.get(i - 1);
        return slope / (values.size() - 1);
    }

    /** 선형 외삽 */
    private List<Double> linearForecast(double baseline, double trend, int steps) {
        List<Double> result = new ArrayList<>();
        for (int i = 1; i <= steps; i++) {
            result.add(round2(Math.max(0, baseline + trend * i)));
        }
        return result;
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
