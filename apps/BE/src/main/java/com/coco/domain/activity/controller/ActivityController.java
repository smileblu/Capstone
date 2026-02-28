package com.coco.domain.activity.controller;

import com.coco.domain.activity.dto.ConsumptionRequest;
import com.coco.domain.activity.dto.ElectricityRequest;
import com.coco.domain.activity.dto.TodaySummaryResponse;
import com.coco.domain.activity.dto.TransportRequest;
import com.coco.domain.activity.service.ActivityService;
import com.coco.global.error.code.GeneralSuccessCode;
import com.coco.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/activities")
public class ActivityController {

    private final ActivityService activityService;

    /**
     * 소비 활동 입력. 같은 날짜·같은 category면 count가 합산됨.
     *
     * Postman) POST /activities/consumption
     * Body (raw JSON) 예시:
     * {
     *   "userId": 1,
     *   "category": "FOOD",
     *   "count": 2,
     *   "isOcr": false,
     *   "receiptImageUrl": null
     * }
     */
    @PostMapping("/consumption")
    public ResponseEntity<Void> createConsumption(@RequestBody ConsumptionRequest request) {
        activityService.createConsumptionActivity(request);
        return ResponseEntity.ok().build();
    }

    /**
     * 이동 활동 입력.
     * - 직접 입력: transportMode, distanceKm 필드 사용. routeId 없음 또는 빈 문자열.
     * - 경로 선택: 온보딩에서 저장한 routeId만 보내면 Route에서 이동수단·거리 가져와 계산.
     *
     * Postman) POST /activities/transport
     * Body (직접 입력) 예시:
     * {
     *   "userId": 1,
     *   "transportMode": "BUS",
     *   "distanceKm": 5.2,
     *   "routeId": null
     * }
     * Body (경로 선택) 예시:
     * {
     *   "userId": 1,
     *   "transportMode": null,
     *   "distanceKm": null,
     *   "routeId": "3"
     * }
     */
    @PostMapping("/transport")
    public ResponseEntity<Void> createTransport(@RequestBody TransportRequest request) {
        activityService.createTransportActivity(request);
        return ResponseEntity.ok().build();
    }

    /**
     * 전기 사용 활동 입력.
     *
     * Postman) POST /activities/electricity
     * Body (raw JSON) 예시:
     * {
     *   "userId": 1,
     *   "billAmount": 50000,
     *   "usagePattern": "HOME",
     *   "periodStart": "2025-01-01",
     *   "periodEnd": "2025-01-31"
     * }
     */
    @PostMapping("/electricity")
    public ResponseEntity<Void> createElectricity(@RequestBody ElectricityRequest request) {
        activityService.createElectricityActivity(request);
        return ResponseEntity.ok().build();
    }

    /**
     * 오늘의 기록 요약 (교통/소비/전기) - 배출량(kg) + 금액(원) 환산 포함.
     * 기준: 1kg CO2 = 80원
     *
     * Postman) GET /activities/summary/today?userId=1
     * 응답 예시:
     * {
     *   "isSuccess": true,
     *   "code": "SUCCESS200_1",
     *   "message": "요청이 성공적으로 처리되었습니다.",
     *   "result": {
     *     "transport": { "emissionKg": 1.04, "moneyWon": 83 },
     *     "consumption": { "emissionKg": 4.0, "moneyWon": 320 },
     *     "electricity": { "emissionKg": 210.0, "moneyWon": 16800 },
     *     "electricityFromOnboardingDefault": false
     *   },
     *   "errors": null
     * }
     */
    @GetMapping("/summary/today")
    public ApiResponse<TodaySummaryResponse> getTodaySummary(@RequestParam Long userId) {
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, activityService.getTodaySummary(userId));
    }
}