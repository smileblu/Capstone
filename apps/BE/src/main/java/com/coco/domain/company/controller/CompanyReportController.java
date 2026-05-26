package com.coco.domain.company.controller;

import com.coco.domain.company.service.CompanyReportService;
import com.coco.global.error.code.GeneralSuccessCode;
import com.coco.global.response.ApiResponse;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/company/report")
@RequiredArgsConstructor
public class CompanyReportController {

    private final CompanyReportService reportService;

    // ── Request DTO (FE에서 캐시된 시뮬레이션 데이터 전달용) ─────────────────

    @Getter @NoArgsConstructor
    public static class ReportGenerateRequest {
        private SimulationPayload simulation;
    }

    @Getter @NoArgsConstructor
    public static class SimulationPayload {
        private String modelUsed;
        private List<Double> baselineForecast;
        private List<ScenarioPayload> scenarios;
    }

    @Getter @NoArgsConstructor
    public static class ScenarioPayload {
        private String id;
        private String name;
        private String difficulty;
        private boolean recommended;
        @JsonProperty("co2ReductionKg")  private double co2ReductionKg;
        @JsonProperty("co2ReductionTon") private double co2ReductionTon;
        @JsonProperty("costSavingKrw")   private long   costSavingKrw;
        @JsonProperty("investmentCostKrw") private long investmentCostKrw;
        @JsonProperty("paybackMonths")   private double paybackMonths;
        @JsonProperty("fiveYearRoiPct")  private Double fiveYearRoiPct;
    }

    // ── Endpoints ─────────────────────────────────────────────────────────────

    /**
     * POST /company/report
     * body.simulation 있으면 해당 데이터 사용, 없으면 getSimulation() 재호출
     */
    @PostMapping
    public ApiResponse<Map<String, Object>> generateReport(
            @RequestBody(required = false) ReportGenerateRequest request) {
        return ApiResponse.onSuccess(GeneralSuccessCode.OK,
                reportService.generateReport(request));
    }

    /** GET /company/report/list — 보고서 목록 (최신순 10개) */
    @GetMapping("/list")
    public ApiResponse<List<Map<String, Object>>> listReports() {
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, reportService.listReports());
    }

    /** GET /company/report/{reportId} — PDF 스트리밍 다운로드 */
    @GetMapping("/{reportId}")
    public ResponseEntity<byte[]> downloadReport(@PathVariable Long reportId) throws Exception {
        return reportService.downloadReport(reportId);
    }
}
