package com.coco.domain.dashboard.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

public class DashboardResponse {

    @Getter
    @Builder
    public static class MonthlySummary {
        private double totalEmission;   // 이번달 총 배출량 (kgCO₂)
        private long totalCost;         // 이번달 환산 금액 (원)
        private double goalEmission;    // 목표 배출량 (지난달 대비 10% 감소)
        private int progressPercent;    // 이번달 미션 완료율 (%)
    }

    @Getter
    @Builder
    public static class MonthlyTrend {
        private String month;       // "YYYY-MM"
        private double emission;    // 해당 월 총 배출량
    }

    @Getter
    @Builder
    public static class CategoryRatio {
        private String category;    // "TRANSPORT" | "ELECTRICITY" | "CONSUMPTION"
        private double emission;
    }
}
