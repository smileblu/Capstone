package com.coco.domain.mypage.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class MyPageResponse {
    private String name;
    private String email;
    private List<RouteItem> routes;
    private String mainTransport;
    private String dailyTravelTimeBand;
    private Integer electricityBill;

    @Getter
    @Builder
    public static class RouteItem {
        private Long routeId;
        private String routeName;
        private String defaultMode;
    }
}
