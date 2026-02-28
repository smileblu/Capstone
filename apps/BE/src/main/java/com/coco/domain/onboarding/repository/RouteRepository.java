package com.coco.domain.onboarding.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.coco.domain.onboarding.entity.Route;

public interface RouteRepository extends JpaRepository<Route, Long>  {
    List<Route> findByUser_UserId(Long userId);

    /** routeId로 조회하며, 해당 유저 소유인지 확인 (signup/login user와 연결). */
    Optional<Route> findByRouteIdAndUser_UserId(Long routeId, Long userId);
}