package com.coco.domain.mission.controller;

import com.coco.domain.mission.dto.MissionRequest;
import com.coco.domain.mission.dto.MissionResponse;
import com.coco.domain.mission.service.MissionService;
import com.coco.global.error.code.GeneralSuccessCode;
import com.coco.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/missions")
public class MissionController {

    private final MissionService missionService;

    /** 시나리오 선택 → 미션 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<Void>> createMissions(@RequestBody MissionRequest request) {
        missionService.createMissions(request);
        return ApiResponse.toResponseEntity(GeneralSuccessCode.CREATED);
    }

    /** 내 미션 목록 */
    @GetMapping
    public ApiResponse<List<MissionResponse>> getMyMissions() {
        return ApiResponse.onSuccess(GeneralSuccessCode.OK, missionService.getMyMissions());
    }

    /** 미션 완료 (PENDING → DONE) */
    @PatchMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<Void>> completeMission(@PathVariable Long id) {
        missionService.completeMission(id);
        return ApiResponse.toResponseEntity(GeneralSuccessCode.OK);
    }

    /** 포인트 수령 (DONE → PAID) */
    @PatchMapping("/{id}/claim")
    public ResponseEntity<ApiResponse<Void>> claimMission(@PathVariable Long id) {
        missionService.claimMission(id);
        return ApiResponse.toResponseEntity(GeneralSuccessCode.OK);
    }
}
