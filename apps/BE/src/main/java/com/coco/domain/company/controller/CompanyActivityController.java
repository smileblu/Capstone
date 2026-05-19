package com.coco.domain.company.controller;

import com.coco.domain.company.dto.ActivityPrefillResponse;
import com.coco.domain.company.dto.CompanyActivityRequest;
import com.coco.domain.company.dto.CompanyActivityResponse;
import com.coco.domain.company.service.CompanyActivityService;
import com.coco.global.error.code.GeneralSuccessCode;
import com.coco.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/company/activities")
public class CompanyActivityController {

    private final CompanyActivityService activityService;

    /** 단일 엔드포인트로 모든 탄소 데이터 입력 수신 (type 필드로 구분) */
    @PostMapping
    public ResponseEntity<ApiResponse<CompanyActivityResponse>> saveActivity(
            @RequestBody CompanyActivityRequest request) {
        CompanyActivityResponse response = activityService.saveActivity(request);
        return ApiResponse.toResponseEntity(GeneralSuccessCode.CREATED, response);
    }

    /**
     * 직접 입력 화면 진입 시 이전 입력값 조회 (pre-fill).
     * GET /company/activities/{type}?billingMonth=2026-04
     * type 예: BUSINESS_ELECTRICITY, BUSINESS_STATIONARY_COMBUSTION 등
     */
    @GetMapping("/{type}")
    public ApiResponse<ActivityPrefillResponse> getPrefill(
            @PathVariable String type,
            @RequestParam(required = false) String billingMonth) {
        return ApiResponse.onSuccess(GeneralSuccessCode.OK,
                activityService.getPrefill(type, billingMonth));
    }
}
