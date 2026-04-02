package com.coco.domain.mission.repository;

import com.coco.domain.mission.entity.Mission;
import com.coco.domain.mission.entity.MissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MissionRepository extends JpaRepository<Mission, Long> {

    List<Mission> findByUser_UserIdOrderByCreatedAtDesc(Long userId);

    /** 같은 시나리오를 PENDING/DONE 상태로 이미 갖고 있는지 확인 (중복 방지) */
    boolean existsByUser_UserIdAndScenarioIdAndStatusIn(
            Long userId, String scenarioId, List<MissionStatus> statuses);

    Optional<Mission> findByIdAndUser_UserId(Long id, Long userId);
}
