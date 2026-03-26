package com.coco.domain.ai.dto;

import lombok.Getter;

@Getter
public class AiForecastRunRequest {
    private Long userId;
    private Integer historyMonths;
    private Integer horizonMonths;
    private String model;
    private Boolean useAnomalyAdjusted;
}

