package com.coco.domain.mission.dto;

import com.coco.domain.mission.entity.Mission;
import lombok.Builder;
import lombok.Getter;

import java.time.format.DateTimeFormatter;

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
    private String status;      // "pending" | "done" | "paid"
    private String updatedAt;   // "YYYY.MM.DD HH:mm" — 포인트 수령 시각 표시용

    private static final DateTimeFormatter DISPLAY_FMT =
            DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm");

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
                .updatedAt(m.getUpdatedAt() != null ? m.getUpdatedAt().format(DISPLAY_FMT) : null)
                .build();
    }
}
