package com.coco.domain.activity.entity.transport;
import com.coco.domain.activity.entity.Activity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class TransportActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "activity_id", unique = true)
    private Activity activity;

    private String transportMode;

    private Double distanceKm;

    /** 온보딩에서 선택한 경로일 때 Route.routeId 문자열로 저장. 직접 입력이면 null. */
    private String routeId;
} 