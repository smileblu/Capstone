package com.coco.domain.analysis.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AnalysisResponse {

    /** 지난주 대비 이번주 배출량 변화율 (%, 음수 = 개선) */
    private double improvementRate;

    /** 최근 4주 중 평균의 1.5배 초과한 주 수 */
    private int warningCount;

    /** 주별 추세 (실제 배출량 + 목표) */
    private List<WeeklyTrendPoint> weeklyTrend;

    /** 카테고리별 지난주 vs 이번주 비교 */
    private List<CategoryComparison> categoryComparison;

    @Getter
    @Builder
    public static class WeeklyTrendPoint {
        private String week;
        private Double actual;   // null 허용 (미래 주)
        private Double target;   // null 허용 (과거 주)
    }

    @Getter
    @Builder
    public static class CategoryComparison {
        private String name;
        private double prevWeek;
        private double currWeek;
    }
}
