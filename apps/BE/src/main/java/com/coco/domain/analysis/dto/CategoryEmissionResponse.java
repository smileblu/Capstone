package com.coco.domain.analysis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class CategoryEmissionResponse {
    private double emissionKg;
    private long moneyWon;
}

