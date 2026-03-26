package com.coco.domain.ai.dto;

import com.coco.domain.analysis.dto.MonthSeriesPoint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class AiForecastResultResponse {
    private List<MonthSeriesPoint> transport;
    private List<MonthSeriesPoint> consumption;
    private List<MonthSeriesPoint> electricity;
    private String modelName;
    private String lastHistoryMonth;
}

