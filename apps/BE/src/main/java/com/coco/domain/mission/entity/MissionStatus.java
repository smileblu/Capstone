package com.coco.domain.mission.entity;

public enum MissionStatus {
    PENDING,  // 진행 중
    DONE,     // 완료 (포인트 미수령)
    PAID,     // 포인트 수령 완료
    EXPIRED   // 새 시나리오 추천으로 대체됨
}
