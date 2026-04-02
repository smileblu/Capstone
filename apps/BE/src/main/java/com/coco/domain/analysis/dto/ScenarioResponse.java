package com.coco.domain.analysis.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ScenarioResponse {
    private String id;
    private String title;
    private String subtitle;
    private double impactKg;
    private long impactWon;
    private String difficulty;   // "하" | "중" | "상"
}
