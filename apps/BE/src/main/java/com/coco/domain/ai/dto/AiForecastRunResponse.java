package com.coco.domain.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AiForecastRunResponse {
    private Long forecastId;
    private String status;
}

