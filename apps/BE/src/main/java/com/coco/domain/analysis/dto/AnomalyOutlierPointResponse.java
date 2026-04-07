package com.coco.domain.analysis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AnomalyOutlierPointResponse {
    private String category; // transport/consumption/electricity
    private String month; // YYYY-MM
    private String state; // outlier/warning/normal/...
    private Double zScore;
    private Double mean;
    private Double std;
    private Integer windowSize;
    private String reason;
}

