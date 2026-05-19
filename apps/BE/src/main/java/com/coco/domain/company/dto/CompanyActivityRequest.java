package com.coco.domain.company.dto;

import lombok.Getter;

import java.math.BigDecimal;

/** 모든 입력 타입을 단일 DTO로 수신. type 필드로 구분. */
@Getter
public class CompanyActivityRequest {

    /** BUSINESS_ELECTRICITY / BUSINESS_STATIONARY_COMBUSTION /
     *  BUSINESS_MOBILE_COMBUSTION / BUSINESS_PROCESS_GAS /
     *  BUSINESS_WASTE / BUSINESS_WATER */
    private String type;

    /** manual | upload */
    private String mode;

    /** YYYY-MM. null 이면 BE에서 이전 달로 자동 세팅 */
    private String billingMonth;

    // ── 전기 ─────────────────────────
    /** kWh / MWh / GWh */
    private BigDecimal usage;

    // ── 고정 연소 ─────────────────────
    private String  fuelType;       // LNG, 경유, LPG
    private BigDecimal amount;
    private String  unit;           // Nm3, L, kg, ton, m3
    private String  usagePurpose;   // 난방, 생산, 기타

    // ── 이동 연소 ─────────────────────
    private String  mobileType;     // 차량 기준, 물류 기준
    private String  vehicleType;    // 승합차, 화물차, 승용차
    private BigDecimal distanceKm;
    private BigDecimal fuelUsed;    // optional

    // ── 공정 가스 ─────────────────────
    private String  gasType;        // CO2, CH4, N2O, HFCs, PFCs, SF6
    private String  processType;    // 생산, 냉매, 화학 공정, 기타

    // ── 폐기물 ───────────────────────
    private String  wasteType;      // 일반, 플라스틱, 폐유, 금속, 종이, 기타
    private String  disposalMethod; // 소각, 재활용, 매립, 위탁 처리

    // ── 용수 ─────────────────────────
    private BigDecimal waterUsage;
    private String  purpose;        // 생산, 세척, 냉각, 생활용수, 기타

    private String memo;
    private String fileName;        // upload mode
}
