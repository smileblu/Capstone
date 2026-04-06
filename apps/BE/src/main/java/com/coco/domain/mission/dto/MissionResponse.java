package com.coco.domain.mission.dto;

import com.coco.domain.mission.entity.Mission;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MissionResponse {

    private Long id;
    private String scenarioId;
    private String title;
    private String subtitle;
    private double impactKg;
    private long impactWon;
    private String difficulty;
    private int points;
    private String status;   // "pending" | "done" | "paid"

    public static MissionResponse from(Mission m) {
        return MissionResponse.builder()
                .id(m.getId())
                .scenarioId(m.getScenarioId())
                .title(m.getTitle())
                .subtitle(m.getSubtitle())
                .impactKg(m.getImpactKg())
                .impactWon(m.getImpactWon())
                .difficulty(m.getDifficulty())
                .points(m.getPoints())
                .status(m.getStatus().name().toLowerCase())
                .build();
    }
}
