package com.coco.domain.analysis.controller;

import com.coco.domain.analysis.dto.*;
import com.coco.domain.analysis.service.AnalysisService;
import com.coco.global.error.code.GeneralSuccessCode;
import com.coco.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;

    /**
     * 월 요약
     * GET /analysis/summary/monthly?userId=1&year=2026&month=3
     */
    @GetMapping("/analysis/summary/monthly")
    public ApiResponse<MonthlySummaryResponse> monthlySummary(
            @RequestParam Long userId,
            @RequestParam int year,
            @RequestParam int month
    ) {
        return ApiResponse.onSuccess(
                GeneralSuccessCode.OK,
                analysisService.getMonthlySummary(userId, year, month)
        );
    }

    /**
     * 월별 추이
     * GET /analysis/trend/monthly?userId=1&rangeMonths=12
     */
    @GetMapping("/analysis/trend/monthly")
    public ApiResponse<MonthlyTrendResponse> monthlyTrend(
            @RequestParam Long userId,
            @RequestParam(required = false, defaultValue = "12") int rangeMonths
    ) {
        return ApiResponse.onSuccess(
                GeneralSuccessCode.OK,
                analysisService.getMonthlyTrend(userId, rangeMonths)
        );
    }

    /**
     * 카테고리 비율
     * GET /analysis/ratio/category?userId=1&year=2026&month=3
     */
    @GetMapping("/analysis/ratio/category")
    public ApiResponse<CategoryRatioResponse> categoryRatio(
            @RequestParam Long userId,
            @RequestParam int year,
            @RequestParam int month
    ) {
        return ApiResponse.onSuccess(
                GeneralSuccessCode.OK,
                analysisService.getCategoryRatio(userId, year, month)
        );
    }

    /**
     * 이상치 탐지 (z-score)
     * GET /analysis/anomaly/outliers?userId=1&rangeMonths=10&windowSize=7
     */
    @GetMapping("/analysis/anomaly/outliers")
    public ApiResponse<AnomalyOutliersResponse> anomalyOutliers(
            @RequestParam Long userId,
            @RequestParam(required = false, defaultValue = "10") int rangeMonths,
            @RequestParam(required = false, defaultValue = "7") int windowSize
    ) {
        return ApiResponse.onSuccess(
                GeneralSuccessCode.OK,
                analysisService.getAnomalyOutliers(userId, rangeMonths, windowSize)
        );
    }
}

