package com.coco.domain.analysis.controller;

import com.coco.domain.analysis.dto.AnalysisResponse;
import com.coco.domain.analysis.dto.ScenarioResponse;
import com.coco.domain.analysis.service.AnalysisService;
import com.coco.global.error.code.GeneralSuccessCode;
import com.coco.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/analysis")
public class AnalysisController {

    private final AnalysisService analysisService;

    /** 탄소 배출량 추세/요약/카테고리 비교 */
    @GetMapping
    public ApiResponse<AnalysisResponse> getAnalysis() {
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, analysisService.getAnalysis());
    }

    /** 개인 맞춤 탄소 절감 시나리오 */
    @GetMapping("/scenarios")
    public ApiResponse<List<ScenarioResponse>> getScenarios() {
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, analysisService.getScenarios());
    }
}
