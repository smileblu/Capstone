package com.coco.domain.reward.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class PointLogResponse {
    private Long id;
    private String title;
    private String date;
    private String points; // "+ 20 P" format
    private boolean isBonus;
}

