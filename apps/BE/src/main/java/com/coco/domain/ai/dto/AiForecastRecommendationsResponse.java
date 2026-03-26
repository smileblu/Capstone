package com.coco.domain.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class AiForecastRecommendationsResponse {
    private List<AiScenarioRecommendationResponse> recommendations;
}

