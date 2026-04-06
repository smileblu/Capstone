package com.coco.domain.mypage.service;

import com.coco.domain.mypage.dto.AddRouteRequest;
import com.coco.domain.mypage.dto.MyPageResponse;
import com.coco.domain.mypage.dto.MyPageResponse.RouteItem;
import com.coco.domain.onboarding.entity.Route;
import com.coco.domain.onboarding.entity.UserProfilePersonal;
import com.coco.domain.onboarding.repository.RouteRepository;
import com.coco.domain.onboarding.repository.UserProfileRepository;
import com.coco.domain.user.entity.User;
import com.coco.domain.user.repository.UserRepository;
import com.coco.global.error.code.GeneralErrorCode;
import com.coco.global.error.exception.GeneralException;
import com.coco.global.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MyPageService {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final RouteRepository routeRepository;

    @Transactional(readOnly = true)
    public MyPageResponse getMyPage() {
        Long userId = SecurityUtil.getCurrentUserId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        UserProfilePersonal profile = profileRepository.findById(userId).orElse(null);

        List<RouteItem> routes = routeRepository.findByUser_UserId(userId).stream()
                .map(r -> RouteItem.builder()
                        .routeId(r.getRouteId())
                        .routeName(r.getRouteName())
                        .defaultMode(r.getDefaultMode())
                        .build())
                .toList();

        return MyPageResponse.builder()
                .name(user.getName())
                .email(user.getEmail())
                .routes(routes)
                .mainTransport(profile != null ? profile.getMainTransport() : null)
                .dailyTravelTimeBand(profile != null ? profile.getDailyTravelTimeBand() : null)
                .electricityBill(profile != null ? profile.getElectricityBill() : null)
                .build();
    }

    @Transactional
    public void addRoute(AddRouteRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        Route route = new Route(
                user,
                request.getRouteName(),
                null, null,
                null, null, null, null,
                request.getDefaultMode()
        );
        routeRepository.save(route);
    }

    @Transactional
    public void deleteRoute(Long routeId) {
        Long userId = SecurityUtil.getCurrentUserId();
        Route route = routeRepository.findByRouteIdAndUser_UserId(routeId, userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));
        routeRepository.delete(route);
    }
}
