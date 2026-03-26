package com.coco.domain.analysis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class MonthSeriesPoint {
    private String month; // YYYY-MM
    private double emissionKg;
    private long moneyWon;
}

