package com.coco.domain.mission.repository;

import com.coco.domain.mission.entity.Mission;
import com.coco.domain.mission.entity.MissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MissionRepository extends JpaRepository<Mission, Long> {

    List<Mission> findByUser_UserIdAndStatusInOrderByCreatedAtDesc(Long userId, List<MissionStatus> statuses);

    /** 같은 시나리오를 PENDING/DONE 상태로 이미 갖고 있는지 확인 (중복 방지) */
    boolean existsByUser_UserIdAndScenarioIdAndStatusIn(
            Long userId, String scenarioId, List<MissionStatus> statuses);

    Optional<Mission> findByIdAndUser_UserId(Long id, Long userId);

    /** 유저의 PENDING 미션 중 특정 scenarioId 목록에 없는 것을 EXPIRED로 일괄 변경 */
    @Modifying
    @Query("UPDATE Mission m SET m.status = :expired WHERE m.user.userId = :userId AND m.status = :pending AND m.scenarioId NOT IN :scenarioIds")
    void expireOldPendingMissions(@Param("userId") Long userId,
                                   @Param("scenarioIds") List<String> scenarioIds,
                                   @Param("pending") MissionStatus pending,
                                   @Param("expired") MissionStatus expired);
}
