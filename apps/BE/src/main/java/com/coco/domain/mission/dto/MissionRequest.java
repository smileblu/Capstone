package com.coco.domain.mission.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class MissionRequest {

    private List<ScenarioItem> scenarios;

    @Getter
    public static class ScenarioItem {
        private String id;
        private String title;
        private String subtitle;
        private double impactKg;
        private long impactWon;
        private String difficulty;
    }
}
