package com.coco.domain.activity.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 이동 입력 요청. 지도 기반 경로 선택 시 좌표·소요 시간을 함께 전달할 수 있다.
 */
@Getter
@Setter
public class TransportRequest {
    private String transportMode;
    private Double distanceKm;
    private String routeId;

    /** 출발지 위도 */
    private Double startLat;
    /** 출발지 경도 */
    private Double startLng;
    /** 도착지 위도 */
    private Double endLat;
    /** 도착지 경도 */
    private Double endLng;
    /** 예상 소요 시간(분) — 선택한 이동 수단 기준으로 프론트에서 산출 */
    private Integer durationMin;
}
