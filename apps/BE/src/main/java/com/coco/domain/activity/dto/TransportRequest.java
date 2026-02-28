package com.coco.domain.activity.dto;

import lombok.Getter;

@Getter
public class TransportRequest {
    private Long userId;
    private String transportMode;
    private Double distanceKm;
    private String routeId;
}
