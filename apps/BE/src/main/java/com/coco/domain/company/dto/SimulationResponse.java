package com.coco.domain.company.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class SimulationResponse {

    private List<EmissionPoint> points;
    private List<ScenarioInfo> scenarios;

    @Getter
    @Builder
    public static class EmissionPoint {
        private String month;        // "2025-05"
        private Double actual;       // 실제 배출량 (tCO₂e), 미래는 null
        private Double current;      // 현재 유지 예측, 과거는 null
        private Double scenarioA;    // 시나리오A 예측, 과거는 null
        private Double scenarioB;
        private Double scenarioC;
    }

    @Getter
    @Builder
    public static class ScenarioInfo {
        private String id;           // "A", "B", "C"
        private String title;
        private String description;
        private double co2ReductionTon;  // 6개월 후 누적 감축량 (tCO₂e)
        private long costSaving;         // 6개월 누적 비용 절감 (원)
        private boolean recommended;
    }
}
