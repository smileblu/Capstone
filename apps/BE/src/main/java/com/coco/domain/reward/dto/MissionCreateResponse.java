package com.coco.domain.reward.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class MissionCreateResponse {
    private int createdCount;
    private List<Long> missionIds;
}

