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

    /** 오늘 실제로 전기 사용을 입력했는지 여부 (월 평균/온보딩 기본값 추정과 구분) */
    private boolean electricityEnteredToday;

    /** 이번 달 가장 최근에 입력한 전기요금 (오늘 입력이 없을 때 폼에 미리 채워주기 위함, 입력 기록이 전혀 없으면 null) */
    private Double electricityLastBillAmount;

    @Getter
    @AllArgsConstructor
    @Builder
    public static class CategorySummary {
        private boolean hasData;
        private double emissionKg;
        private long moneyWon;
    }
}

