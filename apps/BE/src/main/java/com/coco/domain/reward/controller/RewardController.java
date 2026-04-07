package com.coco.domain.reward.controller;

import com.coco.domain.reward.dto.*;
import com.coco.domain.reward.entity.MissionStatus;
import com.coco.domain.reward.service.RewardMissionService;
import com.coco.global.error.code.GeneralSuccessCode;
import com.coco.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/rewards")
public class RewardController {

    private final RewardMissionService missionService;

    /**
     * 추천 시나리오 선택 기반 주간 미션 생성
     * POST /rewards/missions/create-from-recommendations
     */
    @PostMapping("/missions/create-from-recommendations")
    public ApiResponse<MissionCreateResponse> createMissions(@RequestBody MissionCreateRequest request) {
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, missionService.createMissions(request));
    }

    /**
     * 미션 목록 조회 (리워드/포인트 미션 엔티티)
     * GET /rewards/missions?userId=1&status=pending
     */
    @GetMapping("/missions")
    public ApiResponse<MissionsResponse> getMissions(
            @RequestParam Long userId,
            @RequestParam(required = false) MissionStatus status
    ) {
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, missionService.getMissions(userId, status));
    }

    /**
     * 미션 평가( pending -> done )
     * POST /rewards/missions/{missionId}/evaluate
     */
    @PostMapping("/missions/{missionId}/evaluate")
    public ApiResponse<MissionResponse> evaluateMission(
            @PathVariable Long missionId,
            @RequestBody MissionEvaluateRequest request
    ) {
        var mission = missionService.evaluateMission(missionId, request.getUserId());
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, toMissionResponse(mission));
    }

    /**
     * 포인트 지급( done -> paid )
     * POST /rewards/missions/{missionId}/pay
     */
    @PostMapping("/missions/{missionId}/pay")
    public ApiResponse<MissionResponse> payMission(
            @PathVariable Long missionId,
            @RequestBody MissionPayRequest request
    ) {
        var mission = missionService.payMission(missionId, request.getUserId());
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, toMissionResponse(mission));
    }

    /**
     * 포인트 잔액
     * GET /rewards/points/balance?userId=1
     */
    @GetMapping("/points/balance")
    public ApiResponse<PointBalanceResponse> balance(@RequestParam Long userId) {
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, missionService.getBalance(userId));
    }

    /**
     * 포인트 로그
     * GET /rewards/points/logs?userId=1&limit=20
     */
    @GetMapping("/points/logs")
    public ApiResponse<PointLogsResponse> logs(
            @RequestParam Long userId,
            @RequestParam(required = false, defaultValue = "20") int limit
    ) {
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, missionService.getPointLogs(userId, limit));
    }

    private MissionResponse toMissionResponse(com.coco.domain.reward.entity.Mission m) {
        // MissionService 내부 변환 로직을 재사용하기 위해 같은 형태로 구성
        // (여기서는 간단히 호출 직전 상태만 필요한 FE에 맞춤)
        String points = m.getPoints() != null ? String.valueOf(m.getPoints()) : "0";
        double kg = m.getExpectedReductionKg() != null ? m.getExpectedReductionKg() : 0.0;
        String reduction = String.format("-%skgCO₂", String.format(java.util.Locale.US, "%.1f", kg));
        String status = m.getStatus() != null ? m.getStatus().name().toLowerCase() : "pending";

        return MissionResponse.builder()
                .id(m.getId())
                .title(m.getTitle())
                .description(m.getDescription())
                .points(points)
                .reduction(reduction)
                .difficulty(m.getDifficulty())
                .status(status)
                .isDaily(null)
                .build();
    }
}

