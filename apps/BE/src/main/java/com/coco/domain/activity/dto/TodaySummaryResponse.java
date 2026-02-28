package com.coco.domain.activity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
public class TodaySummaryResponse {

    private CategorySummary transport;
    private CategorySummary consumption;
    private CategorySummary electricity;

    /** 전기값이 실제 입력이 아니라 온보딩 기본값으로 계산된 경우 true */
    private boolean electricityFromOnboardingDefault;

    @Getter
    @AllArgsConstructor
    @Builder
    public static class CategorySummary {
        private double emissionKg;
        private long moneyWon;
    }
}

