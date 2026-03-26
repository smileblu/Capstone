package com.coco.domain.analysis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class MonthlyTrendResponse {
    private List<MonthSeriesPoint> transport;
    private List<MonthSeriesPoint> consumption;
    private List<MonthSeriesPoint> electricity;
}

