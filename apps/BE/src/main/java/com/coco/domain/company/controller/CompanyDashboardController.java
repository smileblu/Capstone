package com.coco.domain.company.controller;

import com.coco.domain.company.dto.CompanyAnalysisResponse;
import com.coco.domain.company.dto.CompanyDashboardResponse;
import com.coco.domain.company.service.CompanyDashboardService;
import com.coco.global.error.code.GeneralSuccessCode;
import com.coco.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/company/dashboard")
public class CompanyDashboardController {

    private final CompanyDashboardService dashboardService;

    @GetMapping("/summary")
    public ApiResponse<CompanyDashboardResponse> getSummary() {
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, dashboardService.getDashboard());
    }

    @GetMapping("/analysis")
    public ApiResponse<CompanyAnalysisResponse> getAnalysis() {
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, dashboardService.getAnalysis());
    }
}
