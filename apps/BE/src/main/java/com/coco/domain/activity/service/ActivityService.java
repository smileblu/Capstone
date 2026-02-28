package com.coco.domain.activity.service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coco.domain.activity.dto.ConsumptionRequest;
import com.coco.domain.activity.dto.ElectricityRequest;
import com.coco.domain.activity.dto.TransportRequest;
import com.coco.domain.activity.dto.TodaySummaryResponse;
import com.coco.domain.activity.entity.Activity;
import com.coco.domain.activity.entity.ActivityCategory;
import com.coco.domain.activity.entity.consumption.ConsumptionActivity;
import com.coco.domain.activity.entity.electricity.ElectricityActivity;
import com.coco.domain.activity.entity.emission.EmissionResult;

import com.coco.domain.activity.entity.transport.TransportActivity;
import com.coco.domain.activity.repository.ActivityRepository;
import com.coco.domain.activity.repository.ConsumptionActivityRepository;
import com.coco.domain.activity.repository.ElectricityActivityRepository;
import com.coco.domain.activity.repository.EmissionRepository;
import com.coco.domain.activity.repository.TransportActivityRepository;
import com.coco.domain.onboarding.entity.Route;
import com.coco.domain.onboarding.entity.UserProfilePersonal;
import com.coco.domain.onboarding.repository.RouteRepository;
import com.coco.domain.onboarding.repository.UserProfileRepository;
import com.coco.domain.user.entity.User;
import com.coco.domain.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * Activity 입력 서비스.
 * - User(1):(N)Activity, Activity(1):(1) Transport/Electricity/Consumption(선택), Activity(1):(1) EmissionResult.
 * - userId는 signup/login으로 생성된 User의 userId와 동일하게 사용 (동일 유저 연결).
 */
@Service
@RequiredArgsConstructor
public class ActivityService {

    private static final double EMISSION_KG_PER_KM_CAR = 0.2;
    private static final double EMISSION_KG_PER_KM_BUS = 0.1;
    private static final double EMISSION_KG_PER_KM_SUBWAY = 0.05;
    private static final double EMISSION_KG_PER_KM_TRAIN = 0.05;
    private static final double EMISSION_KG_PER_KM_PLANE = 0.25;

    private static final double WON_PER_KWH = 100.0;
    private static final double KG_CO2_PER_KWH = 0.42;

    private static final double DEFAULT_EMISSION_KG_PER_CONSUMPTION_ITEM = 1.0;

    private static final double EARTH_RADIUS_KM = 6371.0;

    private static final long WON_PER_KG_CO2 = 80L;

    private final ActivityRepository activityRepository;
    private final TransportActivityRepository transportActivityRepository;
    private final ElectricityActivityRepository electricityActivityRepository;
    private final ConsumptionActivityRepository consumptionActivityRepository;
    private final EmissionRepository emissionRepository;
    private final UserRepository userRepository;
    private final RouteRepository routeRepository;
    private final UserProfileRepository userProfileRepository;

    /**
     * Consumption: 하루 기준으로 같은 분야(category)면 기존 건에 count 합산, 없으면 새로 생성.
     */
    @Transactional
    public void createConsumptionActivity(ConsumptionRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDate today = LocalDate.now();
        var existing = activityRepository.findFirstByUser_UserIdAndActivityDateAndCategoryAndConsumptionActivity_Category(
                user.getUserId(), today, ActivityCategory.CONSUMPTION, request.getCategory());

        if (existing.isPresent()) {
            Activity activity = existing.get();
            ConsumptionActivity consumption = activity.getConsumptionActivity();
            consumption.addCount(request.getCount() != null ? request.getCount() : 0);
            double emission = calculateConsumptionEmission(consumption);
            activity.getEmissionResult().setTotalEmission(emission);
            activity.getEmissionResult().setMoneyWon(toMoneyWon(emission));
            return;
        }

        Activity activity = Activity.builder()
                .user(user)
                .activityDate(today)
                .category(ActivityCategory.CONSUMPTION)
                .inputMethod("MANUAL")
                .build();
        activityRepository.save(activity);

        ConsumptionActivity consumption = ConsumptionActivity.builder()
                .activity(activity)
                .category(request.getCategory())
                .count(request.getCount() != null ? request.getCount() : 0)
                .isOcr(request.getIsOcr())
                .receiptImageUrl(request.getReceiptImageUrl())
                .build();
        consumptionActivityRepository.save(consumption);

        double emission = calculateConsumptionEmission(consumption);
        EmissionResult emissionResult = EmissionResult.builder()
                .activity(activity)
                .totalEmission(emission)
                .moneyWon(toMoneyWon(emission))
                .build();
        emissionRepository.save(emissionResult);
    }

    /**
     * Transport: routeId 있으면 온보딩 Route에서 이동수단·거리 가져와 사용, 없으면 직접 입력값으로 계산.
     */
    @Transactional
    public void createTransportActivity(TransportRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String transportMode;
        Double distanceKm;
        String routeIdStr = null;

        if (request.getRouteId() != null && !request.getRouteId().isBlank()) {
            Long routeId = Long.parseLong(request.getRouteId().trim());
            Route route = routeRepository.findByRouteIdAndUser_UserId(routeId, user.getUserId())
                    .orElseThrow(() -> new RuntimeException("Route not found or not owned by user"));
            transportMode = route.getDefaultMode();
            distanceKm = route.getDistanceKm() != null ? route.getDistanceKm() : computeDistanceKm(route);
            routeIdStr = String.valueOf(route.getRouteId());
        } else {
            transportMode = request.getTransportMode();
            distanceKm = request.getDistanceKm();
        }

        Activity activity = Activity.builder()
                .user(user)
                .activityDate(LocalDate.now())
                .category(ActivityCategory.TRANSPORT)
                .inputMethod(routeIdStr != null ? "ROUTE" : "MANUAL")
                .build();
        activityRepository.save(activity);

        TransportActivity transport = TransportActivity.builder()
                .activity(activity)
                .transportMode(transportMode)
                .distanceKm(distanceKm)
                .routeId(routeIdStr)
                .build();
        transportActivityRepository.save(transport);

        double emission = calculateTransportEmission(transport);
        EmissionResult emissionResult = EmissionResult.builder()
                .activity(activity)
                .totalEmission(emission)
                .moneyWon(toMoneyWon(emission))
                .build();
        emissionRepository.save(emissionResult);
    }

    @Transactional
    public void createElectricityActivity(ElectricityRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDate today = LocalDate.now();
        YearMonth ym = YearMonth.from(today);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        var existing = activityRepository.findFirstByUser_UserIdAndCategoryAndActivityDateBetween(
                user.getUserId(), ActivityCategory.ELECTRICITY, start, end);

        if (existing.isPresent()) {
            Activity activity = existing.get();
            ElectricityActivity electricity = activity.getElectricityActivity();
            double emission = calculateElectricityEmission(electricity);
            activity.getEmissionResult().setTotalEmission(emission);
            activity.getEmissionResult().setMoneyWon(toMoneyWon(emission));
            return;
        }

        Activity activity = Activity.builder()
                .user(user)
                .activityDate(today) // timestamp(날짜) 기준으로 같은 달 1회만 입력 허용
                .category(ActivityCategory.ELECTRICITY)
                .inputMethod("MANUAL")
                .build();
        activityRepository.save(activity);

        ElectricityActivity electricity = ElectricityActivity.builder()
                .activity(activity)
                .billAmount(request.getBillAmount())
                .usagePattern(request.getUsagePattern())
                .periodStart(request.getPeriodStart()) // 저장은 하되, 중복 판단은 activityDate 기준
                .periodEnd(request.getPeriodEnd())
                .build();
        electricityActivityRepository.save(electricity);

        double emission = calculateElectricityEmission(electricity);
        EmissionResult emissionResult = EmissionResult.builder()
                .activity(activity)
                .totalEmission(emission)
                .moneyWon(toMoneyWon(emission))
                .build();
        emissionRepository.save(emissionResult);
    }

    /**
     * 오늘 기록 요약 (교통/소비/전기).
     * - 교통/소비: activityDate = 오늘인 Activity들의 배출량 합
     * - 전기: 이번 달에 입력이 있으면 그 값, 없으면 온보딩(UserProfilePersonal.electricityBill) 기본값으로 계산
     */
    @Transactional(readOnly = true)
    public TodaySummaryResponse getTodaySummary(Long userId) {
        userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        LocalDate today = LocalDate.now();

        double transportKg = sumEmissionKg(activityRepository.findByUser_UserIdAndCategoryAndActivityDate(
                userId, ActivityCategory.TRANSPORT, today));
        double consumptionKg = sumEmissionKg(activityRepository.findByUser_UserIdAndCategoryAndActivityDate(
                userId, ActivityCategory.CONSUMPTION, today));

        YearMonth ym = YearMonth.from(today);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        var electricityActivityOpt = activityRepository.findFirstByUser_UserIdAndCategoryAndActivityDateBetween(
                userId, ActivityCategory.ELECTRICITY, start, end);

        boolean electricityFromDefault = false;
        double electricityKg;
        if (electricityActivityOpt.isPresent()) {
            Activity a = electricityActivityOpt.get();
            electricityKg = a.getEmissionResult() != null && a.getEmissionResult().getTotalEmission() != null
                    ? a.getEmissionResult().getTotalEmission()
                    : 0.0;
        } else {
            electricityFromDefault = true;
            electricityKg = calculateElectricityEmissionFromOnboardingDefault(userId);
        }

        return TodaySummaryResponse.builder()
                .transport(TodaySummaryResponse.CategorySummary.builder()
                        .emissionKg(transportKg)
                        .moneyWon(toMoneyWon(transportKg))
                        .build())
                .consumption(TodaySummaryResponse.CategorySummary.builder()
                        .emissionKg(consumptionKg)
                        .moneyWon(toMoneyWon(consumptionKg))
                        .build())
                .electricity(TodaySummaryResponse.CategorySummary.builder()
                        .emissionKg(electricityKg)
                        .moneyWon(toMoneyWon(electricityKg))
                        .build())
                .electricityFromOnboardingDefault(electricityFromDefault)
                .build();
    }

    private double sumEmissionKg(List<Activity> activities) {
        double sum = 0.0;
        for (Activity a : activities) {
            if (a.getEmissionResult() == null || a.getEmissionResult().getTotalEmission() == null) continue;
            sum += a.getEmissionResult().getTotalEmission();
        }
        return sum;
    }

    private double calculateElectricityEmissionFromOnboardingDefault(Long userId) {
        UserProfilePersonal profile = userProfileRepository.findById(userId).orElse(null);
        if (profile == null || profile.getElectricityBill() == null || profile.getElectricityBill() <= 0) {
            return 0.0;
        }
        double estimatedKwh = profile.getElectricityBill() / WON_PER_KWH;
        return estimatedKwh * KG_CO2_PER_KWH;
    }

    private long toMoneyWon(double emissionKg) {
        if (emissionKg <= 0) return 0L;
        return Math.round(emissionKg * WON_PER_KG_CO2);
    }

    private double calculateTransportEmission(TransportActivity transport) {
        if (transport.getDistanceKm() == null || transport.getDistanceKm() <= 0) {
            return 0.0;
        }
        double factor = getTransportEmissionFactor(transport.getTransportMode());
        return transport.getDistanceKm() * factor;
    }

    private double getTransportEmissionFactor(String transportMode) {
        if (transportMode == null) {
            return EMISSION_KG_PER_KM_CAR;
        }
        return switch (transportMode.toUpperCase()) {
            case "BUS" -> EMISSION_KG_PER_KM_BUS;
            case "SUBWAY", "METRO" -> EMISSION_KG_PER_KM_SUBWAY;
            case "TRAIN" -> EMISSION_KG_PER_KM_TRAIN;
            case "PLANE", "AIR" -> EMISSION_KG_PER_KM_PLANE;
            case "WALK", "BIKE", "BICYCLE" -> 0.0;
            default -> EMISSION_KG_PER_KM_CAR;
        };
    }

    private double calculateElectricityEmission(ElectricityActivity electricity) {
        if (electricity.getBillAmount() == null || electricity.getBillAmount() <= 0) {
            return 0.0;
        }
        double estimatedKwh = electricity.getBillAmount() / WON_PER_KWH;
        return estimatedKwh * KG_CO2_PER_KWH;
    }

    private double calculateConsumptionEmission(ConsumptionActivity consumption) {
        if (consumption.getCount() == null || consumption.getCount() <= 0) {
            return 0.0;
        }
        double factor = getConsumptionEmissionFactor(consumption.getCategory());
        return consumption.getCount() * factor;
    }

    private double getConsumptionEmissionFactor(String category) {
        if (category == null) {
            return DEFAULT_EMISSION_KG_PER_CONSUMPTION_ITEM;
        }
        return getConsumptionFactorMap().getOrDefault(
                category.toUpperCase(),
                DEFAULT_EMISSION_KG_PER_CONSUMPTION_ITEM
        );
    }

    private static Map<String, Double> getConsumptionFactorMap() {
        return Map.of(
                "FOOD", 2.0,
                "CLOTHING", 1.5,
                "ELECTRONICS", 3.0
        );
    }

    /** Route에 distanceKm이 없을 때 위경도로 거리(km) 계산 (Haversine). */
    private double computeDistanceKm(Route route) {
        if (route.getOriginLat() == null || route.getOriginLng() == null
                || route.getDestLat() == null || route.getDestLng() == null) {
            return 0.0;
        }
        double lat1 = Math.toRadians(route.getOriginLat());
        double lat2 = Math.toRadians(route.getDestLat());
        double dLat = Math.toRadians(route.getDestLat() - route.getOriginLat());
        double dLon = Math.toRadians(route.getDestLng() - route.getOriginLng());
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }
}
