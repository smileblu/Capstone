package com.coco.domain.reward.service;

import com.coco.domain.activity.entity.Activity;
import com.coco.domain.activity.entity.ActivityCategory;
import com.coco.domain.activity.entity.consumption.ConsumptionActivity;
import com.coco.domain.activity.entity.electricity.ElectricityActivity;
import com.coco.domain.activity.entity.transport.TransportActivity;
import com.coco.domain.activity.repository.ActivityRepository;
import com.coco.domain.onboarding.entity.UserProfilePersonal;
import com.coco.domain.onboarding.repository.UserProfileRepository;
import com.coco.domain.reward.entity.Mission;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class MissionEvaluationService {

    private final ActivityRepository activityRepository;
    private final UserProfileRepository userProfileRepository;

    public MissionEvaluationService(ActivityRepository activityRepository, UserProfileRepository userProfileRepository) {
        this.activityRepository = activityRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional(readOnly = true)
    public boolean isMissionAchieved(Mission mission, Long userId) {
        LocalDate start = mission.getWeekStart();
        LocalDate end = mission.getWeekEnd();

        if (start == null || end == null) return false;

        // scenarioId 기반 간단 규칙(추후 LLM/정교한 룰엔진으로 교체 가능)
        return switch (mission.getScenarioId()) {
            case "s1" -> achievedTransportPublicTransit(userId, start, end);
            case "s2" -> achievedEcoTransport(userId, start, end);
            case "s3" -> achievedElectricitySaving(userId, start, end);
            case "s4" -> achievedNoDeliveryConsumption(userId, start, end);
            default -> false;
        };
    }

    // 대중교통 이용 확대: 주간 transport entry 중 BUS/SUBWAY/METRO/훈련된 mode 존재
    private boolean achievedTransportPublicTransit(Long userId, LocalDate start, LocalDate end) {
        List<Activity> acts = activityRepository.findByUser_UserIdAndCategoryAndActivityDateBetween(
                userId, ActivityCategory.TRANSPORT, start, end
        );
        int count = 0;
        for (Activity a : acts) {
            TransportActivity t = a.getTransportActivity();
            if (t == null) continue;
            String mode = normalizeTransportMode(t.getTransportMode());
            if (isPublicTransit(mode)) {
                if (t.getDistanceKm() != null && t.getDistanceKm() > 0) count++;
            }
        }
        return count >= 3;
    }

    // 친환경 이동수단 전환: BIKE/WALK 거리/횟수
    private boolean achievedEcoTransport(Long userId, LocalDate start, LocalDate end) {
        List<Activity> acts = activityRepository.findByUser_UserIdAndCategoryAndActivityDateBetween(
                userId, ActivityCategory.TRANSPORT, start, end
        );
        int count = 0;
        for (Activity a : acts) {
            TransportActivity t = a.getTransportActivity();
            if (t == null) continue;
            String mode = normalizeTransportMode(t.getTransportMode());
            if (isEco(mode)) {
                if (t.getDistanceKm() != null && t.getDistanceKm() > 0) count++;
            }
        }
        return count >= 3;
    }

    private boolean achievedElectricitySaving(Long userId, LocalDate start, LocalDate end) {
        // 전기 입력은 월 1회이므로, "해당 주간에 전기 활동이 존재" + "온보딩 기본값 대비 감소"로 판단
        List<Activity> electricityActs = activityRepository.findByUser_UserIdAndCategoryAndActivityDateBetween(
                userId, ActivityCategory.ELECTRICITY, start, end
        );
        if (electricityActs.isEmpty()) return false;

        UserProfilePersonal profile = userProfileRepository.findById(userId).orElse(null);
        if (profile == null || profile.getElectricityBill() == null) {
            // 기본값 없으면 활동 존재만으로 처리(데이터 부족 fallback)
            return true;
        }
        int defaultBill = profile.getElectricityBill();
        for (Activity a : electricityActs) {
            ElectricityActivity e = a.getElectricityActivity();
            if (e == null || e.getBillAmount() == null) continue;
            // 5% 절감 기준 (임시)
            if (e.getBillAmount() <= defaultBill * 0.95) {
                return true;
            }
        }
        return false;
    }

    private boolean achievedNoDeliveryConsumption(Long userId, LocalDate start, LocalDate end) {
        List<Activity> consumptionActs = activityRepository.findByUser_UserIdAndCategoryAndActivityDateBetween(
                userId, ActivityCategory.CONSUMPTION, start, end
        );
        if (consumptionActs.isEmpty()) return false;

        int deliveryCount = 0;
        int nonDeliveryCount = 0;
        for (Activity a : consumptionActs) {
            ConsumptionActivity c = a.getConsumptionActivity();
            if (c == null) continue;
            String category = c.getCategory();
            if (category == null) continue;
            if (looksLikeDelivery(category)) {
                if (c.getCount() != null && c.getCount() > 0) deliveryCount++;
            } else {
                if (c.getCount() != null && c.getCount() > 0) nonDeliveryCount++;
            }
        }
        // 배달이 전혀 없고(0개), 다른 소비는 최소 1개 있는 경우
        return deliveryCount == 0 && nonDeliveryCount >= 1;
    }

    private boolean looksLikeDelivery(String category) {
        String c = category.toLowerCase();
        return c.contains("배달") || c.contains("delivery") || c.contains("택배");
    }

    private String normalizeTransportMode(String mode) {
        if (mode == null) return "";
        String m = mode.trim().toUpperCase();
        // FE에서 한글 mode가 들어올 가능성 대비(선택적)
        if (m.contains("차") || m.contains("CAR")) return "CAR";
        if (m.contains("버스") || m.contains("BUS")) return "BUS";
        if (m.contains("지하철") || m.contains("SUBWAY") || m.contains("METRO")) return "SUBWAY";
        if (m.contains("자전거") || m.contains("BIKE") || m.contains("BICYCLE")) return "BIKE";
        if (m.contains("걷") || m.contains("WALK")) return "WALK";
        return m;
    }

    private boolean isPublicTransit(String normalizedMode) {
        return "BUS".equals(normalizedMode) || "SUBWAY".equals(normalizedMode) || "TRAIN".equals(normalizedMode);
    }

    private boolean isEco(String normalizedMode) {
        return "BIKE".equals(normalizedMode) || "WALK".equals(normalizedMode);
    }
}

