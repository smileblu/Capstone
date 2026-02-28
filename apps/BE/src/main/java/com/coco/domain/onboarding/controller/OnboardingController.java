package com.coco.domain.onboarding.controller;

import com.coco.global.error.code.GeneralSuccessCode;
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
    public ApiResponse<Void> savePersonal(
            @RequestParam Long userId,
            @RequestBody OnboardingRequest request) {

        onboardingService.savePersonal(userId, request);
        return ApiResponse.onSuccess(GeneralSuccessCode.OK,null);
    }
}