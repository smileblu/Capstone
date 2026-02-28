package com.coco.domain.activity.entity;
import com.coco.domain.activity.entity.consumption.ConsumptionActivity;
import com.coco.domain.activity.entity.transport.TransportActivity;
import com.coco.domain.activity.entity.electricity.ElectricityActivity;
import com.coco.domain.activity.entity.emission.EmissionResult;

import com.coco.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** User(1) : (N) Activity. user_id는 signup/login으로 생성된 User의 userId와 연결. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private LocalDate activityDate;

    @Enumerated(EnumType.STRING)
    private ActivityCategory category;

    private String inputMethod;

    /** Activity(1) : (1) 세부 엔티티 중 하나만 존재. (선택적) */
    @OneToOne(mappedBy = "activity", cascade = CascadeType.ALL)
    private ConsumptionActivity consumptionActivity;

    @OneToOne(mappedBy = "activity", cascade = CascadeType.ALL)
    private TransportActivity transportActivity;

    @OneToOne(mappedBy = "activity", cascade = CascadeType.ALL)
    private ElectricityActivity electricityActivity;

    /** Activity(1) : (1) EmissionResult (배출량 결과) */
    @OneToOne(mappedBy = "activity", cascade = CascadeType.ALL)
    private EmissionResult emissionResult;
}