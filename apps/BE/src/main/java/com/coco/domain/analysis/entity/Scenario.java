package com.coco.domain.analysis.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Scenario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String scenarioId;   // "t1", "e1", "c1", "m1" 등 고유 키

    private String title;
    private String subtitle;
    private double impactKg;
    private long impactWon;
    private String difficulty;   // "하", "중", "상"
    private String category;     // "TRANSPORT", "ELECTRICITY", "CONSUMPTION", "COMMON"
}
