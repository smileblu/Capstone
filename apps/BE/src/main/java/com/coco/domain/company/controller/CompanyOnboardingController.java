package com.coco.domain.company.controller;

import com.coco.domain.company.dto.CompanyOnboardingRequest;
import com.coco.domain.company.service.CompanyOnboardingService;
import com.coco.global.error.code.GeneralSuccessCode;
import com.coco.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/onboarding")
public class CompanyOnboardingController {

    private final CompanyOnboardingService onboardingService;

    @PostMapping("/company")
    public ResponseEntity<ApiResponse<Void>> saveOnboarding(
            @RequestBody CompanyOnboardingRequest request) {
        onboardingService.saveOnboarding(request);
        return ApiResponse.toResponseEntity(GeneralSuccessCode.CREATED);
    }
}
