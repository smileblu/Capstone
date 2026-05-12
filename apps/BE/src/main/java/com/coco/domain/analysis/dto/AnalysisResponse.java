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

    /** 이상치 탐지 결과 (월별 grand_total Z-score 기반) */
    private OutlierDetection outlierDetection;

    /**
     * 월별 Baseline 3개월 예측 (auto_arima + 드리프트 보정 + SCC 금전 환산)
     * 프론트 연결 필요
     */
    private MonthlyBaseline monthlyBaseline;

    @Getter
    @Builder
    public static class OutlierDetection {
        private int count;
        private List<String> months;
    }

    @Getter
    @Builder
    public static class MonthlyBaseline {
        private List<Double> forecastKg;
        private List<Long> moneyWon;
    }

    @Getter
    @Builder
    public static class WeeklyTrendPoint {
        private String week;
        private Double actual;    // null 허용 (미래 주)
        private Double forecast;  // null 허용 (과거 주) — 현재 추세 유지 시 예측값
        private Double target;    // null 허용 (과거 주)
    }

    @Getter
    @Builder
    public static class CategoryComparison {
        private String name;
        private double prevWeek;
        private double currWeek;
    }
}
