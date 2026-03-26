package com.coco.domain.reward.service;

import com.coco.domain.ai.dto.AiForecastRecommendationsResponse;
import com.coco.domain.ai.dto.AiScenarioRecommendationResponse;
import com.coco.domain.ai.service.AiForecastService;
import com.coco.domain.activity.entity.Activity;
import com.coco.domain.reward.dto.*;
import com.coco.domain.reward.entity.*;
import com.coco.domain.reward.repository.*;
import com.coco.domain.user.entity.User;
import com.coco.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class MissionService {

    private final UserRepository userRepository;
    private final MissionRepository missionRepository;
    private final PointAccountRepository pointAccountRepository;
    private final PointLogRepository pointLogRepository;
    private final MissionEvaluationService missionEvaluationService;
    private final AiForecastService aiForecastService;

    private static final DateTimeFormatter LOG_DT = DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm");

    @Transactional
    public MissionCreateResponse createMissions(MissionCreateRequest request) {
        Long userId = request.getUserId();
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        AiForecastRecommendationsResponse recommendations = aiForecastService.getRecommendations(request.getForecastId());
        Map<String, AiScenarioRecommendationResponse> byId = new HashMap<>();
        for (AiScenarioRecommendationResponse r : recommendations.getRecommendations()) {
            byId.put(r.getId(), r);
        }

        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(today.getDayOfWeek().getValue() - 1L);
        LocalDate weekEnd = weekStart.plusDays(6);

        int created = 0;
        List<Long> missionIds = new ArrayList<>();

        List<String> selectedIds = request.getSelectedScenarioIds() != null ? request.getSelectedScenarioIds() : List.of();
        for (String scenarioId : selectedIds) {
            if (scenarioId == null || scenarioId.isBlank()) continue;
            if (!byId.containsKey(scenarioId)) continue;

            if (missionRepository.existsByUser_UserIdAndScenarioIdAndWeekStart(userId, scenarioId, weekStart)) {
                continue;
            }

            AiScenarioRecommendationResponse rec = byId.get(scenarioId);

            Mission mission = Mission.builder()
                    .user(user)
                    .scenarioId(scenarioId)
                    .status(MissionStatus.PENDING)
                    .title(rec.getTitle())
                    .description(rec.getSubtitle())
                    .points(rec.getExpectedReductionMoneyWon()) // 1:1 points=moneyWon
                    .expectedReductionKg(rec.getExpectedReductionKg())
                    .expectedReductionMoneyWon(rec.getExpectedReductionMoneyWon())
                    .difficulty(rec.getDifficulty())
                    .weekStart(weekStart)
                    .weekEnd(weekEnd)
                    .createdAt(LocalDateTime.now())
                    .doneAt(null)
                    .paidAt(null)
                    .build();

            Mission saved = missionRepository.save(mission);
            missionIds.add(saved.getId());
            created++;
        }

        return MissionCreateResponse.builder()
                .createdCount(created)
                .missionIds(missionIds)
                .build();
    }

    @Transactional
    public Mission evaluateMission(Long missionId, Long userId) {
        Mission mission = missionRepository.findById(missionId).orElseThrow(() -> new RuntimeException("Mission not found"));
        if (!Objects.equals(mission.getUser().getUserId(), userId)) {
            throw new RuntimeException("Mission owner mismatch");
        }
        if (mission.getStatus() != MissionStatus.PENDING) {
            return mission;
        }

        LocalDate today = LocalDate.now();
        if (!mission.isInWeek(today)) {
            // 이번 주 미션이 아니면 평가 스킵
            return mission;
        }

        boolean achieved = missionEvaluationService.isMissionAchieved(mission, userId);
        if (achieved) {
            mission = copyToDone(mission);
            missionRepository.save(mission);
        }
        return mission;
    }

    private Mission copyToDone(Mission mission) {
        return Mission.builder()
                .id(mission.getId())
                .user(mission.getUser())
                .scenarioId(mission.getScenarioId())
                .status(MissionStatus.DONE)
                .title(mission.getTitle())
                .description(mission.getDescription())
                .points(mission.getPoints())
                .expectedReductionKg(mission.getExpectedReductionKg())
                .expectedReductionMoneyWon(mission.getExpectedReductionMoneyWon())
                .weekStart(mission.getWeekStart())
                .weekEnd(mission.getWeekEnd())
                .createdAt(mission.getCreatedAt())
                .doneAt(LocalDateTime.now())
                .paidAt(mission.getPaidAt())
                .difficulty(mission.getDifficulty())
                .build();
    }

    @Transactional
    public Mission payMission(Long missionId, Long userId) {
        Mission mission = missionRepository.findById(missionId).orElseThrow(() -> new RuntimeException("Mission not found"));
        if (!Objects.equals(mission.getUser().getUserId(), userId)) {
            throw new RuntimeException("Mission owner mismatch");
        }
        if (mission.getStatus() != MissionStatus.DONE) {
            return mission;
        }

        PointAccount account = pointAccountRepository.findById(userId).orElse(null);
        if (account == null) {
            account = PointAccount.builder().user(userRepository.getReferenceById(userId)).userId(userId).balancePoints(0L).build();
        }

        long deltaPoints = mission.getPoints() != null ? mission.getPoints() : 0L;
        account = PointAccount.builder()
                .userId(account.getUserId())
                .user(account.getUser())
                .balancePoints(account.getBalancePoints() + deltaPoints)
                .build();
        pointAccountRepository.save(account);

        PointLog log = PointLog.builder()
                .user(account.getUser())
                .deltaPoints(deltaPoints)
                .type(PointLogType.MISSION_COMPLETE)
                .description("Mission pay: " + mission.getTitle())
                .missionId(mission.getId())
                .createdAt(LocalDateTime.now())
                .balanceAfter(account.getBalancePoints())
                .build();
        pointLogRepository.save(log);

        Mission paid = Mission.builder()
                .id(mission.getId())
                .user(mission.getUser())
                .scenarioId(mission.getScenarioId())
                .status(MissionStatus.PAID)
                .title(mission.getTitle())
                .description(mission.getDescription())
                .points(mission.getPoints())
                .expectedReductionKg(mission.getExpectedReductionKg())
                .expectedReductionMoneyWon(mission.getExpectedReductionMoneyWon())
                .weekStart(mission.getWeekStart())
                .weekEnd(mission.getWeekEnd())
                .createdAt(mission.getCreatedAt())
                .doneAt(mission.getDoneAt())
                .paidAt(LocalDateTime.now())
                .difficulty(mission.getDifficulty())
                .build();
        return missionRepository.save(paid);
    }

    @Transactional(readOnly = true)
    public MissionsResponse getMissions(Long userId, MissionStatus status) {
        List<Mission> missions;
        if (status == null) {
            missions = missionRepository.findByUser_UserId(userId);
        } else {
            missions = missionRepository.findByUser_UserIdAndStatus(userId, status);
        }
        return MissionsResponse.builder()
                .missions(missions.stream().map(this::toMissionResponse).toList())
                .status(status)
                .build();
    }

    private MissionResponse toMissionResponse(Mission m) {
        String points = m.getPoints() != null ? String.valueOf(m.getPoints()) : "0";
        double kg = m.getExpectedReductionKg() != null ? m.getExpectedReductionKg() : 0.0;
        String reduction = String.format("-%skgCO₂", String.format(Locale.US, "%.1f", kg));
        String status = switch (m.getStatus()) {
            case PENDING -> "pending";
            case DONE -> "done";
            case PAID -> "paid";
        };

        Boolean isDaily = null;
        return MissionResponse.builder()
                .id(m.getId())
                .title(m.getTitle())
                .description(m.getDescription())
                .points(points)
                .reduction(reduction)
                .difficulty(m.getDifficulty())
                .status(status)
                .isDaily(isDaily)
                .build();
    }

    // -------- points --------
    @Transactional(readOnly = true)
    public PointBalanceResponse getBalance(Long userId) {
        PointAccount account = pointAccountRepository.findById(userId).orElse(null);
        if (account == null) {
            return PointBalanceResponse.builder().userId(userId).balancePoints(0L).build();
        }
        return PointBalanceResponse.builder().userId(userId).balancePoints(account.getBalancePoints()).build();
    }

    @Transactional(readOnly = true)
    public PointLogsResponse getPointLogs(Long userId, int limit) {
        List<PointLog> logs = pointLogRepository.findByUser_UserIdOrderByCreatedAtDesc(userId);
        int l = Math.max(1, Math.min(limit, logs.size()));
        List<PointLogResponse> out = logs.stream().limit(l).map(this::toPointLogResponse).toList();
        return PointLogsResponse.builder().logs(out).build();
    }

    private PointLogResponse toPointLogResponse(PointLog log) {
        String title = log.getType() == PointLogType.BONUS ? "보너스 포인트" : "미션 포인트";
        String date = log.getCreatedAt() != null ? log.getCreatedAt().format(LOG_DT) : "";
        String points = formatDeltaPoints(log.getDeltaPoints());
        boolean isBonus = log.getType() == PointLogType.BONUS;

        return PointLogResponse.builder()
                .id(log.getId())
                .title(title)
                .date(date)
                .points(points)
                .isBonus(isBonus)
                .build();
    }

    private String formatDeltaPoints(Long delta) {
        long d = delta != null ? delta : 0L;
        if (d >= 0) return "+ " + d + " P";
        return "- " + Math.abs(d) + " P";
    }
}

