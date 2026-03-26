package com.coco.domain.reward.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class MissionCreateRequest {
    private Long userId;
    private Long forecastId;
    private List<String> selectedScenarioIds; // ["s1","s3",...]
}

