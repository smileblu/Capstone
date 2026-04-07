package com.coco.domain.reward.repository;

import com.coco.domain.reward.entity.Mission;
import com.coco.domain.reward.entity.MissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface RewardMissionRepository extends JpaRepository<Mission, Long> {

    List<Mission> findByUser_UserIdAndStatus(Long userId, MissionStatus status);

    List<Mission> findByUser_UserId(Long userId);

    List<Mission> findByUser_UserIdAndWeekStartLessThanEqualAndWeekEndGreaterThanEqual(
            Long userId, LocalDate weekStart, LocalDate weekEnd);

    boolean existsByUser_UserIdAndScenarioIdAndWeekStart(Long userId, String scenarioId, LocalDate weekStart);
}
