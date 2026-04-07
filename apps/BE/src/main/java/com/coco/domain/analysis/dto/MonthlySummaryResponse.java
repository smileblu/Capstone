package com.coco.domain.analysis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class MonthlySummaryResponse {
    private CategoryEmissionResponse transport;
    private CategoryEmissionResponse consumption;
    private CategoryEmissionResponse electricity;
    private TotalEmissionResponse total;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class TotalEmissionResponse {
        private double emissionKg;
        private long moneyWon;
    }
}

