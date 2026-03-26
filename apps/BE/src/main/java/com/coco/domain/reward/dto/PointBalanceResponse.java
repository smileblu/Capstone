package com.coco.domain.reward.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class PointBalanceResponse {
    private Long userId;
    private Long balancePoints;
}

