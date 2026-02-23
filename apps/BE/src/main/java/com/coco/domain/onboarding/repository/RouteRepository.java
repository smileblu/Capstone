package com.coco.domain.onboarding.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.coco.domain.onboarding.entity.Route;

public interface RouteRepository extends JpaRepository<Route, Long>  {
    List<Route> findByUser_UserId(Long userId);
}