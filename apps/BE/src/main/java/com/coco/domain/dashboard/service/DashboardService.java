package com.coco.domain.dashboard.service;

import com.coco.domain.activity.entity.Activity;
import com.coco.domain.activity.entity.ActivityCategory;
import com.coco.domain.activity.repository.ActivityRepository;
import com.coco.domain.dashboard.dto.DashboardResponse.CategoryRatio;
import com.coco.domain.dashboard.dto.DashboardResponse.MonthlyTrend;
import com.coco.domain.dashboard.dto.DashboardResponse.MonthlySummary;
import com.coco.domain.mission.entity.MissionStatus;
import com.coco.domain.mission.repository.MissionRepository;
import com.coco.global.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ActivityRepository activityRepository;
    private final MissionRepository missionRepository;

    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

    @Transactional(readOnly = true)
    public MonthlySummary getMonthlySummary() {
        Long userId = SecurityUtil.getCurrentUserId();
        YearMonth current = YearMonth.now();
        YearMonth prev = current.minusMonths(1);

        List<Activity> thisMonth = activityRepository.findByUser_UserIdAndActivityDateBetween(
                userId, current.atDay(1), current.atEndOfMonth());

        double totalEmission = thisMonth.stream().mapToDouble(this::emissionOf).sum();
        long totalCost = thisMonth.stream().mapToLong(this::costOf).sum();

        // 목표: 지난달 배출량의 90%
        double lastMonthEmission = activityRepository
                .findByUser_UserIdAndActivityDateBetween(userId, prev.atDay(1), prev.atEndOfMonth())
                .stream().mapToDouble(this::emissionOf).sum();
        double goalEmission = Math.round(lastMonthEmission * 0.9 * 10.0) / 10.0;

        // 미션 완료율
        var missions = missionRepository.findByUser_UserIdOrderByCreatedAtDesc(userId);
        int total = missions.size();
        long completed = missions.stream()
                .filter(m -> m.getStatus() == MissionStatus.DONE || m.getStatus() == MissionStatus.PAID)
                .count();
        int progressPercent = total > 0 ? (int) Math.round((double) completed / total * 100) : 0;

        return MonthlySummary.builder()
                .totalEmission(Math.round(totalEmission * 10.0) / 10.0)
                .totalCost(totalCost)
                .goalEmission(goalEmission)
                .progressPercent(progressPercent)
                .build();
    }

    @Transactional(readOnly = true)
    public List<MonthlyTrend> getMonthlyTrend() {
        Long userId = SecurityUtil.getCurrentUserId();
        YearMonth current = YearMonth.now();
        List<MonthlyTrend> result = new ArrayList<>();

        for (int i = 5; i >= 0; i--) {
            YearMonth ym = current.minusMonths(i);
            double emission = activityRepository
                    .findByUser_UserIdAndActivityDateBetween(userId, ym.atDay(1), ym.atEndOfMonth())
                    .stream().mapToDouble(this::emissionOf).sum();
            result.add(MonthlyTrend.builder()
                    .month(ym.format(MONTH_FMT))
                    .emission(Math.round(emission * 10.0) / 10.0)
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<CategoryRatio> getCategoryRatio() {
        Long userId = SecurityUtil.getCurrentUserId();
        YearMonth ym = YearMonth.now();

        List<Activity> activities = activityRepository.findByUser_UserIdAndActivityDateBetween(
                userId, ym.atDay(1), ym.atEndOfMonth());

        double transport = 0, electricity = 0, consumption = 0;
        for (Activity a : activities) {
            double kg = emissionOf(a);
            if (a.getCategory() == ActivityCategory.TRANSPORT) transport += kg;
            else if (a.getCategory() == ActivityCategory.ELECTRICITY) electricity += kg;
            else if (a.getCategory() == ActivityCategory.CONSUMPTION) consumption += kg;
        }

        return List.of(
                CategoryRatio.builder().category("TRANSPORT").emission(Math.round(transport * 10.0) / 10.0).build(),
                CategoryRatio.builder().category("ELECTRICITY").emission(Math.round(electricity * 10.0) / 10.0).build(),
                CategoryRatio.builder().category("CONSUMPTION").emission(Math.round(consumption * 10.0) / 10.0).build()
        );
    }

    private double emissionOf(Activity a) {
        if (a.getEmissionResult() == null || a.getEmissionResult().getTotalEmission() == null) return 0.0;
        return a.getEmissionResult().getTotalEmission();
    }

    private long costOf(Activity a) {
        if (a.getEmissionResult() == null || a.getEmissionResult().getMoneyWon() == null) return 0L;
        return a.getEmissionResult().getMoneyWon();
    }
}
