package com.coco.domain.company.service;

import com.coco.domain.company.controller.CompanyReportController.ReportGenerateRequest;
import com.coco.domain.company.controller.CompanyReportController.ScenarioPayload;
import com.coco.domain.company.dto.SimulationResponse;
import com.coco.domain.company.entity.Company;
import com.coco.domain.company.entity.CompanyActivity;
import com.coco.domain.company.entity.ReportSnapshot;
import com.coco.domain.company.repository.CompanyActivityRepository;
import com.coco.domain.company.repository.CompanyRepository;
import com.coco.domain.company.repository.ReportSnapshotRepository;
import com.coco.global.client.AiPredictClient;
import com.coco.global.error.code.GeneralErrorCode;
import com.coco.global.error.exception.GeneralException;
import com.coco.global.security.SecurityUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompanyReportService {

    private final CompanyRepository              companyRepository;
    private final CompanyActivityRepository      activityRepository;
    private final ReportSnapshotRepository       reportSnapshotRepository;
    private final CompanySimulationService       simulationService;
    private final AiPredictClient                aiPredictClient;
    private final ObjectMapper                   objectMapper;

    @Value("${carbon.kets-won-per-ton:23500}")
    private long ketsPricePerTon;

    private static final List<String> SCOPE1_STAT   = List.of("BUSINESS_STATIONARY_COMBUSTION", "BUSINESS_PROCESS_GAS");
    private static final List<String> SCOPE1_MOB    = List.of("BUSINESS_MOBILE_COMBUSTION");
    private static final List<String> SCOPE2         = List.of("BUSINESS_ELECTRICITY");
    private static final List<String> SCOPE3_WASTE   = List.of("BUSINESS_WASTE");
    private static final List<String> SCOPE3_WATER   = List.of("BUSINESS_WATER");

    // ── POST /company/report ──────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> generateReport(ReportGenerateRequest request) {
        Long userId    = SecurityUtil.getCurrentUserId();
        Company company = companyRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));
        Long companyId = company.getCompanyId();

        // 1. 최근 3개월 배출량 집계
        YearMonth current = YearMonth.now();
        List<String> past3 = List.of(
                current.minusMonths(2).toString(),
                current.minusMonths(1).toString(),
                current.toString()
        );
        String reportPeriod = past3.get(0) + " ~ " + past3.get(2);

        List<CompanyActivity> acts = activityRepository
                .findByCompany_CompanyIdAndBillingMonthIn(companyId, past3);

        double scope1Kg = 0, scope2Kg = 0, scope3Kg = 0;
        Map<String, Double> catKg = new LinkedHashMap<>();

        for (CompanyActivity a : acts) {
            double kg = a.getCo2eKg() == null ? 0 : a.getCo2eKg().doubleValue();
            String t  = a.getType();
            if (SCOPE1_STAT.contains(t) || SCOPE1_MOB.contains(t)) scope1Kg += kg;
            else if (SCOPE2.contains(t))       scope2Kg += kg;
            else if (SCOPE3_WASTE.contains(t) || SCOPE3_WATER.contains(t)) scope3Kg += kg;
            catKg.merge(toCatKey(t), kg, Double::sum);
        }

        double grandTotal  = scope1Kg + scope2Kg + scope3Kg;
        long   costTotal   = Math.round(grandTotal / 1000.0 * ketsPricePerTon);

        // --- K-ETS 파생 수치 계산 (Claude 재계산 방지용) ---
        double  grandTotalTon        = grandTotal / 1000.0;
        long    costAnnualEstimate   = costTotal * 4L;
        double  annualTonEstimate    = grandTotalTon * 4;
        boolean ketsExemptionLikely  = annualTonEstimate < 25_000;

        // 전월 대비 변화율 (전월 데이터 없으면 null → AI 프롬프트에서 "전월 데이터 없음" 처리)
        double cur3  = kgOfMonth(acts, past3.get(2));
        double prev3 = kgOfMonth(acts, past3.get(1));
        Double momPct = prev3 > 0 ? (cur3 - prev3) / prev3 * 100.0 : null;

        // 주요 배출원
        String topSrc = "전기"; double topPct = 62.0;
        if (grandTotal > 0) {
            Optional<Map.Entry<String, Double>> max = catKg.entrySet().stream()
                    .max(Map.Entry.comparingByValue());
            if (max.isPresent()) {
                topSrc = toKorean(max.get().getKey());
                topPct = max.get().getValue() / grandTotal * 100.0;
            }
        }

        // 2. 시뮬레이션 데이터 확보
        //    FE에서 캐시된 시뮬레이션 데이터를 보내면 그걸 사용 (재호출 없음)
        //    없으면 ARIMA + LLM 시뮬레이션 재실행
        List<Double> baseline;
        List<SimulationResponse.ScenarioInfo> scenarioInfoList;

        boolean hasFrontendSim = request != null
                && request.getSimulation() != null
                && request.getSimulation().getScenarios() != null
                && !request.getSimulation().getScenarios().isEmpty();

        if (hasFrontendSim) {
            var sim = request.getSimulation();
            baseline = sim.getBaselineForecast() != null ? sim.getBaselineForecast() : List.of();
            scenarioInfoList = sim.getScenarios().stream()
                    .map(this::toScenarioInfo)
                    .collect(Collectors.toList());
        } else {
            SimulationResponse sim;
            try {
                sim = simulationService.getSimulation();
            } catch (Exception e) {
                throw new RuntimeException("시뮬레이션 데이터 조회 실패: " + e.getMessage(), e);
            }
            baseline = sim.getPoints().stream()
                    .filter(p -> p.getCurrent() != null)
                    .map(SimulationResponse.EmissionPoint::getCurrent)
                    .collect(Collectors.toList());
            scenarioInfoList = sim.getScenarios();
        }

        // 추세 판단
        String trend = "stable";
        if (baseline.size() >= 2) {
            double f = baseline.get(0), l = baseline.get(baseline.size() - 1);
            double r = f > 0 ? (l - f) / f : 0;
            if (r > 0.1) trend = "increase";
            else if (r > 0.02) trend = "slight_increase";
            else if (r < -0.1) trend = "decrease";
            else if (r < -0.02) trend = "slight_decrease";
        }

        // 3. Python 보고서 요청 빌드
        double predicted6mKg   = baseline.stream().mapToDouble(Double::doubleValue).sum() * 1000.0;
        long   predicted6mCost = Math.round(predicted6mKg / 1000.0 * ketsPricePerTon);

        Map<String, Object> req = buildReportRequest(
                company, reportPeriod, scope1Kg, scope2Kg, scope3Kg,
                grandTotal, costTotal, grandTotalTon, costAnnualEstimate,
                annualTonEstimate, ketsExemptionLikely,
                momPct, topSrc, topPct,
                trend, catKg, baseline, scenarioInfoList
        );
        req.put("predicted_6m_kg",       Math.round(predicted6mKg * 10.0) / 10.0);
        req.put("predicted_6m_cost_krw", predicted6mCost);
        String contactName = (company.getUser() != null && company.getUser().getName() != null
                && !company.getUser().getName().isBlank())
                ? company.getUser().getName()
                : (company.getDepartment() != null ? company.getDepartment() : "담당자");
        req.put("contact_name", contactName);

        // 4. Python /company-report 호출
        Map<String, Object> aiResp = aiPredictClient.generateReport(req);

        if (aiResp == null || !"ok".equals(aiResp.get("status"))) {
            throw new RuntimeException("보고서 생성에 실패했습니다.");
        }

        String filePath  = (String) aiResp.get("file_path");
        Long   fileSize  = aiResp.get("file_size_bytes") instanceof Number
                ? ((Number) aiResp.get("file_size_bytes")).longValue() : null;

        // 5. 스냅샷 저장
        try {
            String scA = scenarioJson(scenarioInfoList, "A");
            String scB = scenarioJson(scenarioInfoList, "B");
            String scC = scenarioJson(scenarioInfoList, "C");

            ReportSnapshot snapshot = ReportSnapshot.builder()
                    .company(company)
                    .reportPeriod(reportPeriod)
                    .kEtsPricePerTon((int) ketsPricePerTon)
                    .scope1TotalKg(scope1Kg)
                    .scope2TotalKg(scope2Kg)
                    .scope3TotalKg(scope3Kg)
                    .grandTotalKg(grandTotal)
                    .costTotalKrw(costTotal)
                    .baselineForecast(objectMapper.writeValueAsString(baseline))
                    .scenarioAJson(scA).scenarioBJson(scB).scenarioCJson(scC)
                    .filePath(filePath)
                    .fileSizeBytes(fileSize)
                    .build();
            snapshot = reportSnapshotRepository.save(snapshot);
            return Map.of("reportId", snapshot.getId());
        } catch (Exception e) {
            throw new RuntimeException("스냅샷 저장 실패: " + e.getMessage(), e);
        }
    }

    // ── GET /company/report/{reportId} ────────────────────────────────────────

    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> downloadReport(Long reportId) throws Exception {
        Long userId = SecurityUtil.getCurrentUserId();
        Company company = companyRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        ReportSnapshot snapshot = reportSnapshotRepository
                .findByIdAndCompany_CompanyId(reportId, company.getCompanyId())
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        Path path = Paths.get(snapshot.getFilePath());
        if (!Files.exists(path)) {
            throw new GeneralException(GeneralErrorCode.NOT_FOUND);
        }

        byte[] bytes   = Files.readAllBytes(path);
        String cName   = company.getCompanyName() != null ? company.getCompanyName() : "기업";
        String person  = (company.getUser() != null && company.getUser().getName() != null
                && !company.getUser().getName().isBlank())
                ? company.getUser().getName()
                : (company.getDepartment() != null ? company.getDepartment() : "담당자");
        LocalDateTime createdAt = snapshot.getCreatedAt() != null
                ? snapshot.getCreatedAt() : LocalDateTime.now();
        String dateStr = createdAt.format(DateTimeFormatter.ofPattern("MMdd"));
        String rawName = cName + "_" + person + "_COCO ESG 리포트_" + dateStr + ".pdf";
        String encodedName = URLEncoder.encode(rawName, StandardCharsets.UTF_8)
                .replace("+", "%20");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename*=UTF-8''" + encodedName)
                .contentType(MediaType.APPLICATION_PDF)
                .body(bytes);
    }

    // ── GET /company/report/list ──────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listReports() {
        Long userId = SecurityUtil.getCurrentUserId();
        Company company = companyRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        return reportSnapshotRepository
                .findByCompany_CompanyIdOrderByCreatedAtDesc(
                        company.getCompanyId(), PageRequest.of(0, 10))
                .stream()
                .map(s -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id",            s.getId());
                    m.put("createdAt",     s.getCreatedAt() != null
                            ? s.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : "");
                    m.put("reportPeriod",  s.getReportPeriod());
                    m.put("fileSizeBytes", s.getFileSizeBytes());
                    return m;
                })
                .collect(Collectors.toList());
    }

    // ── 헬퍼 ─────────────────────────────────────────────────────────────────

    /** FE ScenarioPayload → SimulationResponse.ScenarioInfo 변환 */
    private SimulationResponse.ScenarioInfo toScenarioInfo(ScenarioPayload p) {
        return SimulationResponse.ScenarioInfo.builder()
                .id(p.getId())
                .name(p.getName())
                .difficulty(p.getDifficulty() != null ? p.getDifficulty() : "medium")
                .recommended(p.isRecommended())
                .co2ReductionKg(p.getCo2ReductionKg())
                .co2ReductionTon(p.getCo2ReductionTon())
                .costSavingKrw(p.getCostSavingKrw())
                .investmentCostKrw(p.getInvestmentCostKrw())
                .paybackMonths(p.getPaybackMonths())
                .fiveYearRoiPct(p.getFiveYearRoiPct())
                .feasibility(0.8)
                .build();
    }

    private double kgOfMonth(List<CompanyActivity> acts, String month) {
        return acts.stream()
                .filter(a -> month.equals(a.getBillingMonth()))
                .mapToDouble(a -> a.getCo2eKg() == null ? 0 : a.getCo2eKg().doubleValue())
                .sum();
    }

    private String toCatKey(String type) {
        if (SCOPE2.contains(type))      return "electricity";
        if (SCOPE1_STAT.contains(type)) return "stationary_fuel";
        if (SCOPE1_MOB.contains(type))  return "mobile_combustion";
        if (SCOPE3_WASTE.contains(type)) return "waste";
        if (SCOPE3_WATER.contains(type)) return "water";
        return "other";
    }

    private String toKorean(String cat) {
        return switch (cat) {
            case "electricity"       -> "전기";
            case "stationary_fuel"   -> "고정연소";
            case "mobile_combustion" -> "이동연소";
            case "waste"             -> "폐기물";
            case "water"             -> "용수";
            default                  -> cat;
        };
    }

    private String siteType(String industry) {
        if (industry == null) return "일반";
        return switch (industry.toUpperCase()) {
            case "MANUFACTURING", "CONSTRUCTION" -> "공장";
            case "IT", "SERVICE", "FINANCE"      -> "사무실";
            default                              -> "일반";
        };
    }

    private String scenarioJson(List<SimulationResponse.ScenarioInfo> scenarios, String id) {
        try {
            return scenarios.stream()
                    .filter(s -> id.equals(s.getId()))
                    .findFirst()
                    .map(s -> {
                        try { return objectMapper.writeValueAsString(s); }
                        catch (Exception e) { return "{}"; }
                    })
                    .orElse("{}");
        } catch (Exception e) {
            return "{}";
        }
    }

    private Map<String, Object> buildReportRequest(
            Company company, String reportPeriod,
            double scope1Kg, double scope2Kg, double scope3Kg,
            double grandTotal, long costTotal,
            double grandTotalTon, long costAnnualEstimate,
            double annualTonEstimate, boolean ketsExemptionLikely,
            Double momPct, String topSrc, double topPct,
            String trend, Map<String, Double> catKg,
            List<Double> baseline,
            List<SimulationResponse.ScenarioInfo> scenarios) {

        String industry = company.getIndustry() != null ? company.getIndustry() : "기타";
        String purpose  = company.getManagementPurpose() != null
                ? company.getManagementPurpose().toLowerCase() : "internal";

        // company_context
        Map<String, Object> ctx = new LinkedHashMap<>();
        ctx.put("industry",           industry);
        ctx.put("site_type",          siteType(industry));
        ctx.put("onboarding_purpose", purpose);

        // emission_data
        Map<String, Object> ed = new LinkedHashMap<>();
        ed.put("scope1_total_kg",      scope1Kg);
        ed.put("scope2_total_kg",      scope2Kg);
        ed.put("scope3_total_kg",      scope3Kg);
        ed.put("grand_total_kg",       grandTotal);
        ed.put("cost_total_krw",        costTotal);
        ed.put("k_ets_price_per_ton",   (int) ketsPricePerTon);
        ed.put("grand_total_ton",       Math.round(grandTotalTon * 100.0) / 100.0);
        ed.put("cost_annual_estimate",  costAnnualEstimate);
        ed.put("annual_ton_estimate",   Math.round(annualTonEstimate * 10.0) / 10.0);
        ed.put("kets_exemption_likely", ketsExemptionLikely);
        ed.put("kets_price_base_date",  "2026-06-01");
        ed.put("kets_price_source",     "KRX KAU25 종가");
        ed.put("mom_change_pct",        momPct != null ? Math.round(momPct * 10.0) / 10.0 : null);
        ed.put("top_emission_source",  topSrc);
        ed.put("top_emission_pct",     Math.round(topPct));
        ed.put("baseline_trend",       trend);
        ed.put("category_breakdown",   catKg);

        // scenarios
        List<Map<String, Object>> scList = scenarios.stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",                 s.getId());
            m.put("name",               s.getName());
            m.put("difficulty",         s.getDifficulty() != null ? s.getDifficulty() : "medium");
            m.put("recommended",        s.isRecommended());
            m.put("co2_reduction_kg",   s.getCo2ReductionKg());
            m.put("cost_saving_krw",    s.getCostSavingKrw());
            m.put("investment_cost_krw",s.getInvestmentCostKrw());
            m.put("payback_months",     s.getPaybackMonths());
            m.put("five_year_roi_pct",  s.getFiveYearRoiPct());
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> req = new LinkedHashMap<>();
        req.put("company_id",       company.getCompanyId());
        req.put("company_name",     company.getCompanyName() != null ? company.getCompanyName() : "기업");
        req.put("company_context",  ctx);
        req.put("report_period",    reportPeriod);
        req.put("emission_data",    ed);
        req.put("baseline_forecast", baseline);
        req.put("scenarios",        scList);
        return req;
    }
}
