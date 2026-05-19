package com.coco.domain.company.entity;

import com.coco.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class CompanyActivity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    /** BUSINESS_ELECTRICITY / BUSINESS_STATIONARY_COMBUSTION / BUSINESS_MOBILE_COMBUSTION
     *  BUSINESS_PROCESS_GAS / BUSINESS_WASTE / BUSINESS_WATER */
    @Column(nullable = false)
    private String type;

    private String billingMonth;  // YYYY-MM

    // 공통 수량 필드
    private BigDecimal amount;
    private String unit;

    // 타입별 부가 필드
    private String fuelType;        // 연료 종류 (고정/이동 연소)
    private String usagePurpose;    // 사용 목적 (고정 연소)
    private String vehicleType;     // 차량 종류 (이동 연소)
    private String mobileType;      // 차량 기준 / 물류 기준 (이동 연소)
    private BigDecimal distanceKm;  // 이동 거리 (이동 연소)
    private BigDecimal fuelUsed;    // 연료 사용량 (이동 연소, optional)
    private String gasType;         // 가스 종류 (공정 가스)
    private String processType;     // 사용 공정 (공정 가스)
    private String wasteType;       // 폐기물 종류
    private String disposalMethod;  // 처리 방식 (폐기물)
    private String purpose;         // 사용 목적 (용수)

    private String memo;
    private String source;          // manual / excel_upload

    // 계산 결과
    @Column(precision = 18, scale = 4)
    private BigDecimal co2eKg;

    @Column(precision = 18, scale = 2)
    private BigDecimal costKrw;
}
