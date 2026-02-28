package com.coco.domain.activity.repository;

import com.coco.domain.activity.entity.Activity;
import com.coco.domain.activity.entity.ActivityCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ActivityRepository extends JpaRepository<Activity, Long> {

    /**
     * 같은 유저, 같은 날짜, CONSUMPTION 카테고리, 같은 소비 분야(category)인 Activity 조회.
     * Consumption 하루 단위 합산 시 기존 건이 있는지 확인용.
     */
    Optional<Activity> findFirstByUser_UserIdAndActivityDateAndCategoryAndConsumptionActivity_Category(
            Long userId, LocalDate activityDate, ActivityCategory category, String consumptionCategory);

    /** 특정 날짜의 카테고리별 Activity 목록 (오늘 요약 등). */
    List<Activity> findByUser_UserIdAndCategoryAndActivityDate(Long userId, ActivityCategory category, LocalDate activityDate);

    /** 특정 기간(월) 내 카테고리 Activity 존재 여부 확인 (전기 월 1회 입력). */
    Optional<Activity> findFirstByUser_UserIdAndCategoryAndActivityDateBetween(
            Long userId, ActivityCategory category, LocalDate startDate, LocalDate endDate);
}