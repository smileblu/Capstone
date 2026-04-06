package com.coco.domain.onboarding.controller;

import com.coco.global.error.code.GeneralSuccessCode;
import com.coco.global.security.SecurityUtil;
import org.springframework.web.bind.annotation.*;

import com.coco.global.response.ApiResponse;
import com.coco.domain.onboarding.dto.OnboardingRequest;
import com.coco.domain.onboarding.service.OnboardingService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/onboarding")
@RequiredArgsConstructor
public class OnboardingController {

    private final OnboardingService onboardingService;

    @PostMapping("/personal")
    public ApiResponse<Void> savePersonal(@RequestBody OnboardingRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        onboardingService.savePersonal(userId, request);
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, null);
    }
}
