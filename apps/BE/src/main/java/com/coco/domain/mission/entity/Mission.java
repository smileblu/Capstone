package com.coco.domain.mission.entity;

import com.coco.domain.user.entity.User;
import com.coco.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Mission extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String scenarioId;   // "s1", "s2" 등 시나리오 식별자
    private String title;
    private String subtitle;
    private double impactKg;
    private long impactWon;
    private String difficulty;   // "하", "중", "상"
    private int points;

    @Enumerated(EnumType.STRING)
    private MissionStatus status;

    public void complete() {
        this.status = MissionStatus.DONE;
    }

    public void claim() {
        this.status = MissionStatus.PAID;
    }
}
