package com.coco.domain.mission.service;

import com.coco.domain.mission.dto.MissionRequest;
import com.coco.domain.mission.dto.MissionResponse;
import com.coco.domain.mission.entity.Mission;
import com.coco.domain.mission.entity.MissionStatus;
import com.coco.domain.mission.repository.MissionRepository;
import com.coco.domain.user.entity.User;
import com.coco.domain.user.repository.UserRepository;
import com.coco.global.error.code.GeneralErrorCode;
import com.coco.global.error.exception.GeneralException;
import com.coco.global.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MissionService {

    private final MissionRepository missionRepository;
    private final UserRepository userRepository;

    /** 선택한 시나리오들을 미션으로 생성 (이미 진행중/완료인 시나리오는 스킵) */
    @Transactional
    public void createMissions(MissionRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        for (MissionRequest.ScenarioItem s : request.getScenarios()) {
            boolean alreadyExists = missionRepository.existsByUser_UserIdAndScenarioIdAndStatusIn(
                    userId, s.getId(), List.of(MissionStatus.PENDING, MissionStatus.DONE));
            if (alreadyExists) continue;

            Mission mission = Mission.builder()
                    .user(user)
                    .scenarioId(s.getId())
                    .title(s.getTitle())
                    .subtitle(s.getSubtitle())
                    .impactKg(s.getImpactKg())
                    .impactWon(s.getImpactWon())
                    .difficulty(s.getDifficulty())
                    .points(calcPoints(s.getDifficulty()))
                    .status(MissionStatus.PENDING)
                    .build();

            missionRepository.save(mission);
        }
    }

    /** 내 미션 목록 조회 */
    @Transactional(readOnly = true)
    public List<MissionResponse> getMyMissions() {
        Long userId = SecurityUtil.getCurrentUserId();
        return missionRepository.findByUser_UserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(MissionResponse::from)
                .toList();
    }

    /** 미션 완료 처리 (PENDING → DONE) */
    @Transactional
    public void completeMission(Long missionId) {
        Long userId = SecurityUtil.getCurrentUserId();
        Mission mission = missionRepository.findByIdAndUser_UserId(missionId, userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        if (mission.getStatus() != MissionStatus.PENDING) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST);
        }
        mission.complete();
    }

    /** 포인트 수령 (DONE → PAID) */
    @Transactional
    public void claimMission(Long missionId) {
        Long userId = SecurityUtil.getCurrentUserId();
        Mission mission = missionRepository.findByIdAndUser_UserId(missionId, userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        if (mission.getStatus() != MissionStatus.DONE) {
            throw new GeneralException(GeneralErrorCode.BAD_REQUEST);
        }
        mission.claim();
    }

    private int calcPoints(String difficulty) {
        return switch (difficulty) {
            case "중" -> 20;
            case "상" -> 30;
            default -> 10;  // "하"
        };
    }
}
