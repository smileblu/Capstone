package com.coco.domain.mypage.dto;

import lombok.Getter;

@Getter
public class AddRouteRequest {
    private String routeName;
    private String defaultMode;  // "SUBWAY" | "BUS" | "CAR" | "WALK" | "BIKE"
}
