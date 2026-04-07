package com.coco.domain.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AiScenarioRecommendationResponse {
    private String id;
    private String title;
    private String subtitle;
    private String impactText;
    private String difficulty; // 하/중/상
    private double expectedReductionKg;
    private long expectedReductionMoneyWon;
}

