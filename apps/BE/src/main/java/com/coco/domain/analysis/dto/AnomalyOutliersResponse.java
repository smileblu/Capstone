package com.coco.domain.analysis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class AnomalyOutliersResponse {
    private List<AnomalyOutlierPointResponse> outliers;
    private int outlierCount;
    private int warningCount;
}

