package com.coco.domain.onboarding.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coco.domain.onboarding.dto.OnboardingRequest;
import com.coco.domain.onboarding.entity.Route;
import com.coco.domain.onboarding.entity.UserProfilePersonal;
import com.coco.domain.onboarding.repository.RouteRepository;
import com.coco.domain.onboarding.repository.UserProfileRepository;
import com.coco.domain.user.entity.User;
import com.coco.domain.user.repository.UserRepository;
import com.coco.global.error.code.GeneralErrorCode;
import com.coco.global.error.exception.GeneralException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor

public class OnboardingService {
    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final RouteRepository routeRepository;

    @Transactional
    public void savePersonal(Long userId, OnboardingRequest request) {

        log.info("[Onboarding] userId={} 시작", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));
        log.info("[Onboarding] 유저 조회 완료");

        UserProfilePersonal profile = profileRepository.findById(userId)
                .orElse(null);
        log.info("[Onboarding] 프로필 조회 완료, 신규={}", profile == null);

        if (profile == null) {
            profile = new UserProfilePersonal(
                    user,
                    request.getHasFrequentRoute(),
                    request.getMainTransport(),
                    request.getDailyTravelTimeBand(),
                    request.getElectricityBill()
            );
        } else {
            profile.update(
                    request.getHasFrequentRoute(),
                    request.getMainTransport(),
                    request.getDailyTravelTimeBand(),
                    request.getElectricityBill()
            );
        }
        profileRepository.save(profile);
        log.info("[Onboarding] 프로필 저장 완료");

        // 기존 Route 삭제 후 새로 저장 (재저장 시 중복 방지)
        routeRepository.deleteAll(routeRepository.findByUser_UserId(userId));
        log.info("[Onboarding] 기존 경로 삭제 완료");

        if (Boolean.TRUE.equals(request.getHasFrequentRoute())
                && request.getRoutes() != null) {

            for (OnboardingRequest.RouteRequest r : request.getRoutes()) {
                log.info("[Onboarding] 경로 저장 시도: {}", r.getRouteName());
                Route route = new Route(
                        user,
                        r.getRouteName(),
                        r.getOriginLabel(),
                        r.getDestLabel(),
                        r.getOriginLat(),
                        r.getOriginLng(),
                        r.getDestLat(),
                        r.getDestLng(),
                        r.getDefaultMode()
                );
                routeRepository.save(route);
                log.info("[Onboarding] 경로 저장 완료: {}", r.getRouteName());
            }
        }
        log.info("[Onboarding] 전체 완료");
    }
}