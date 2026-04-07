package com.coco.domain.reward.dto;

import com.coco.domain.reward.entity.MissionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class MissionsResponse {
    private List<MissionResponse> missions;
    private MissionStatus status;
}

