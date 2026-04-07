package com.coco.domain.reward.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class MissionResponse {
    private Long id;
    private String title;
    private String description;
    private String points; // FE expects string
    private String reduction; // e.g. "-4.5kgCO₂"
    private String difficulty; // 하/중/상
    private String status; // pending/done/paid
    private Boolean isDaily;
}

