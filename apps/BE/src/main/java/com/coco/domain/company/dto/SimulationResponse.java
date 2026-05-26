package com.coco.domain.company.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class SimulationResponse {

    private String modelUsed;          // "ARIMA" | "SARIMA" | "linear_fallback"
    private List<EmissionPoint> points;
    private List<ScenarioInfo> scenarios;

    @Getter
    @Builder
    public static class EmissionPoint {
        private String month;           // "2025-05"
        private Double actual;          // 실제 배출량 (tCO₂e), 미래는 null
        private Double current;         // 현재 유지 예측, 과거는 null
        private Double scenarioA;       // 시나리오A 예측, 과거는 null
        private Double scenarioB;
        private Double scenarioC;
    }

    @Getter
    @Builder
    public static class ScenarioInfo {
        private String id;              // "A", "B", "C"
        private String name;            // LLM 생성 시나리오 제목
        private String label;           // "Moderate Reduction" 등
        private String description;
        private String difficulty;      // "low" | "medium" | "high"
        private boolean recommended;
        private double feasibility;
        private List<ActionInfo> actions;

        // 계산된 지표
        private double co2ReductionKg;      // 6개월 누적 절감 (kgCO₂e)
        private double co2ReductionTon;     // 6개월 누적 절감 (tCO₂e)
        private long   costSavingKrw;       // 6개월 누적 비용 절감 (원)
        private long   investmentCostKrw;   // 초기 투자 비용 (원)
        private double paybackMonths;       // 회수기간 (개월)
        private Double fiveYearRoiPct;      // 5년 ROI (%), 투자 0이면 null
        private List<Double> scenarioForecast; // 6개월 월별 배출량 예측 (tCO₂e)
    }

    @Getter
    @Builder
    public static class ActionInfo {
        private String targetCategory;      // "electricity" | "stationary_fuel" 등
        private String actionDesc;
        private double reductionRate;
        private long   investmentCostKrw;
        private int    paybackMonths;
    }
}
