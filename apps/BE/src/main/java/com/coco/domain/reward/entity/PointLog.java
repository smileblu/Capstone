package com.coco.domain.reward.entity;

import com.coco.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "point_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class PointLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private Long deltaPoints;

    @Enumerated(EnumType.STRING)
    private PointLogType type;

    private String description;

    @Column(nullable = true)
    private Long missionId;

    private LocalDateTime createdAt;

    private Long balanceAfter;
}

