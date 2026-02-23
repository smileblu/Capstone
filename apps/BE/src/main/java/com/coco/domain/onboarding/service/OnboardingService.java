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

        UserProfilePersonal profile = profileRepository.findById(userId)
                .orElse(null);

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