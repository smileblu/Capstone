package com.coco.domain.reward.entity;

import com.coco.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "missions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Mission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /** analysis recommendation에서 온 시나리오 id (예: s1/s2/s3/s4) */
    private String scenarioId;

    @Enumerated(EnumType.STRING)
    private MissionStatus status;

    private String title;
    private String description;

    /** 프론트에 표시되는 난이도: 하/중/상 */
    private String difficulty;

    /** points: points = reductionMoneyWon (1:1) */
    private Long points;

    /** 예상 절감 탄소량(kgCO2) */
    private Double expectedReductionKg;

    /** 예상 절감 금액(원) */
    private Long expectedReductionMoneyWon;

    private LocalDate weekStart;
    private LocalDate weekEnd;

    private LocalDateTime createdAt;
    private LocalDateTime doneAt;
    private LocalDateTime paidAt;

    public boolean isInWeek(LocalDate date) {
        if (date == null) return false;
        return (weekStart == null || !date.isBefore(weekStart)) && (weekEnd == null || !date.isAfter(weekEnd));
    }
}

