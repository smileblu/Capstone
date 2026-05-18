package com.coco.domain.company.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CompanyAnalysisResponse {

    /** 최근 6개월 월별 총 배출량 (tCO₂e) */
    private List<MonthlyPoint> trendData;

    /** Scope 1/2/3 비중 및 전월 대비 변화 */
    private List<ScopeData> scopeData;

    /** AI 인사이트 메시지 */
    private String insight;

    /** 이상치 탐지 결과 (없으면 null) */
    private AnomalyAlert anomaly;

    @Getter
    @Builder
    public static class MonthlyPoint {
        private String month;    // "YYYY-MM"
        private double emission; // tCO₂e
    }

    @Getter
    @Builder
    public static class ScopeData {
        private String name;         // "Scope 1" / "Scope 2" / "Scope 3"
        private String description;  // 설명
        private int value;           // 비중 (%)
        private String change;       // 전월 대비 (예: "+8%", "-5%")
    }

    @Getter
    @Builder
    public static class AnomalyAlert {
        private String message;
        private double changePercent;
    }
}
