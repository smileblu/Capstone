package com.coco.domain.onboarding.dto;

import java.util.List;
import lombok.Getter;

@Getter
public class OnboardingRequest {
    private Boolean hasFrequentRoute;
    private String mainTransport;
    private String dailyTravelTimeBand;
    private Integer electricityBill;

    private List<RouteRequest> routes;

    @Getter
    public static class RouteRequest {
        private String routeName;
        private String originLabel;
        private String destLabel;
        private Double originLat;
        private Double originLng;
        private Double destLat;
        private Double destLng;
        private String defaultMode;
    }
}
