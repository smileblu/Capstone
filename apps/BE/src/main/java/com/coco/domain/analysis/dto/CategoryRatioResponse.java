package com.coco.domain.analysis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class CategoryRatioResponse {
    private double transportPercent;
    private double consumptionPercent;
    private double electricityPercent;
}

