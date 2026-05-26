package com.coco.domain.company.entity;

import com.coco.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "report_snapshot")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class ReportSnapshot extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false, length = 30)
    private String reportPeriod;        // "2026-02 ~ 2026-04"

    @Column(nullable = false)
    private int kEtsPricePerTon;

    @Column(nullable = false)
    private double scope1TotalKg;

    @Column(nullable = false)
    private double scope2TotalKg;

    @Column(nullable = false)
    private double scope3TotalKg;

    @Column(nullable = false)
    private double grandTotalKg;

    @Column(nullable = false)
    private long costTotalKrw;

    @Column(columnDefinition = "JSON")
    private String baselineForecast;

    @Column(columnDefinition = "JSON")
    private String scenarioAJson;

    @Column(columnDefinition = "JSON")
    private String scenarioBJson;

    @Column(columnDefinition = "JSON")
    private String scenarioCJson;

    @Column(length = 500)
    private String filePath;

    private Long fileSizeBytes;
}
