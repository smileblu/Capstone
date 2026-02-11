package com.coco.onboarding.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.coco.onboarding.entity.Route;

public interface RouteRepository extends JpaRepository<Route, Long>  {
    List<Route> findByUser_UserId(Long userId);
}
