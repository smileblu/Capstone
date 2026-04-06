package com.coco.domain.dashboard.controller;

import com.coco.domain.dashboard.dto.DashboardResponse.CategoryRatio;
import com.coco.domain.dashboard.dto.DashboardResponse.MonthlyTrend;
import com.coco.domain.dashboard.dto.DashboardResponse.MonthlySummary;
import com.coco.domain.dashboard.service.DashboardService;
import com.coco.global.error.code.GeneralSuccessCode;
import com.coco.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/monthly-summary")
    public ApiResponse<MonthlySummary> getMonthlySummary() {
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, dashboardService.getMonthlySummary());
    }

    @GetMapping("/monthly-trend")
    public ApiResponse<List<MonthlyTrend>> getMonthlyTrend() {
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, dashboardService.getMonthlyTrend());
    }

    @GetMapping("/category-ratio")
    public ApiResponse<List<CategoryRatio>> getCategoryRatio() {
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, dashboardService.getCategoryRatio());
    }
}
