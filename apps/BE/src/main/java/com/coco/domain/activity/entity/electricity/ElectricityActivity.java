package com.coco.domain.activity.entity.electricity;
import java.time.LocalDate;

import com.coco.domain.activity.entity.Activity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder

public class ElectricityActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "activity_id", unique = true)
    private Activity activity;

    private Integer billAmount;

    private String usagePattern;

    private LocalDate periodStart;

    private LocalDate periodEnd;
}
