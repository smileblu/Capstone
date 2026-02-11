package com.coco.onboarding.controller;

import org.springframework.web.bind.annotation.*;

import com.coco.global.response.ApiResponse;
import com.coco.onboarding.dto.OnboardingRequest;
import com.coco.onboarding.service.OnboardingService;

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
        return ApiResponse.success(null);
    }
}
