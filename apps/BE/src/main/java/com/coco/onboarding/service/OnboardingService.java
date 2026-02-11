package com.coco.onboarding.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coco.onboarding.dto.OnboardingRequest;
import com.coco.onboarding.entity.Route;
import com.coco.onboarding.entity.UserProfilePersonal;
import com.coco.onboarding.repository.RouteRepository;
import com.coco.onboarding.repository.UserProfileRepository;
import com.coco.user.entity.User;
import com.coco.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor

public class OnboardingService {
    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final RouteRepository routeRepository;

    @Transactional
    public void savePersonal(Long userId, OnboardingRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfilePersonal profile =
                new UserProfilePersonal(
                        user,
                        request.getHasFrequentRoute(),
                        request.getMainTransport(),
                        request.getDailyTravelTimeBand(),
                        request.getElectricityBill()
                );

        profileRepository.save(profile);

        if (Boolean.TRUE.equals(request.getHasFrequentRoute())
                && request.getRoutes() != null) {

            for (OnboardingRequest.RouteRequest r : request.getRoutes()) {
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
        }
    }
}
}
