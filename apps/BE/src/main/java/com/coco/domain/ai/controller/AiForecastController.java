package com.coco.domain.ai.controller;

import com.coco.domain.ai.dto.AiForecastRecommendationsResponse;
import com.coco.domain.ai.dto.AiForecastRunRequest;
import com.coco.domain.ai.dto.AiForecastRunResponse;
import com.coco.domain.ai.dto.AiForecastResultResponse;
import com.coco.domain.ai.service.AiForecastService;
import com.coco.global.error.code.GeneralSuccessCode;
import com.coco.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class AiForecastController {

    private final AiForecastService aiForecastService;

    /**
     * 예측 실행 (ARIMA) - 백엔드에서 Python AI 실행 후 결과 저장.
     *
     * Postman) POST /ai/forecast/run
     * Body 예시:
     * {
     *   "userId": 1,
     *   "historyMonths": 12,
     *   "horizonMonths": 3,
     *   "model": "arima",
     *   "useAnomalyAdjusted": true
     * }
     */
    @PostMapping("/ai/forecast/run")
    public ApiResponse<AiForecastRunResponse> run(@RequestBody AiForecastRunRequest request) {
        return ApiResponse.onSuccess(
                GeneralSuccessCode.OK,
                aiForecastService.runForecast(request)
        );
    }

    /**
     * 예측 결과 조회
     * Postman) GET /ai/forecast/result?forecastId=1
     */
    @GetMapping("/ai/forecast/result")
    public ApiResponse<AiForecastResultResponse> result(@RequestParam Long forecastId) {
        return ApiResponse.onSuccess(
                GeneralSuccessCode.OK,
                aiForecastService.getForecastResult(forecastId)
        );
    }

    /**
     * 추천 시나리오 조회
     * Postman) GET /ai/recommendations?forecastId=1
     */
    @GetMapping("/ai/recommendations")
    public ApiResponse<AiForecastRecommendationsResponse> recommendations(@RequestParam Long forecastId) {
        return ApiResponse.onSuccess(
                GeneralSuccessCode.OK,
                aiForecastService.getRecommendations(forecastId)
        );
    }
}

