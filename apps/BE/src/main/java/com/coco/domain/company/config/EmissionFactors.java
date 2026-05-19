package com.coco.domain.company.config;

import java.util.Map;

/** 탄소 배출계수 상수 모음. 향후 DB 테이블로 이전 가능하도록 분리. */
public final class EmissionFactors {

    private EmissionFactors() {}

    // ── 전기 (Scope 2) ──────────────────────────────────────────────────────
    /** 국가 전력 배출계수 2023 소비단 (kgCO₂e/kWh) */
    public static final double ELECTRICITY_KG_PER_KWH = 0.4173;

    // ── 고정 연소 (Scope 1) ─────────────────────────────────────────────────
    /** 연료별 kgCO₂e/Nm3 (기체 연료) */
    public static final double LNG_KG_PER_NM3 = 2.176;       // 천연가스

    /** 연료별 kgCO₂e/L (액체 연료) */
    public static final double DIESEL_KG_PER_L = 2.581;       // 경유
    public static final double LPG_KG_PER_L    = 1.712;       // LPG

    // ── 이동 연소 (Scope 1) ─────────────────────────────────────────────────
    /** 연료별 kgCO₂e/L */
    public static final double GASOLINE_KG_PER_L = 2.315;     // 휘발유
    public static final double KEROSENE_KG_PER_L = 2.537;     // 등유

    /** 연비 추정 (km/L) — fuelUsed 미입력 시 거리 기반 계산 */
    public static final Map<String, Double> DEFAULT_FUEL_EFFICIENCY = Map.of(
            "승용차", 12.0,
            "승합차", 8.0,
            "화물차", 5.0
    );

    // ── 공정 가스 GWP (지구온난화지수, AR6 기준) ───────────────────────────
    public static final Map<String, Double> GWP = Map.of(
            "CO2",  1.0,
            "CH4",  27.9,
            "N2O",  273.0,
            "HFCs", 1430.0,  // R-134a 대표값
            "PFCs", 7390.0,  // CF4 대표값
            "SF6",  24300.0
    );

    // ── 폐기물 (Scope 3) ────────────────────────────────────────────────────
    /** [wasteType][disposalMethod] = kgCO₂e/kg */
    public static final Map<String, Map<String, Double>> WASTE_FACTORS = Map.of(
            "일반",    Map.of("소각", 0.44, "매립", 0.03, "재활용", 0.0, "위탁 처리", 0.03),
            "플라스틱", Map.of("소각", 2.53, "매립", 0.03, "재활용", 0.0, "위탁 처리", 0.03),
            "폐유",    Map.of("소각", 2.80, "매립", 0.05, "재활용", 0.0, "위탁 처리", 0.05),
            "금속",    Map.of("소각", 0.0,  "매립", 0.01, "재활용", 0.0, "위탁 처리", 0.01),
            "종이",    Map.of("소각", 1.38, "매립", 0.02, "재활용", 0.0, "위탁 처리", 0.02)
    );
    public static final double WASTE_DEFAULT_FACTOR = 0.30;  // 기타

    // ── 용수 (Scope 3) ──────────────────────────────────────────────────────
    /** kgCO₂e/ton (상수도 취수·처리·배급 합산) */
    public static final double WATER_KG_PER_TON = 0.288;

    // ── K-ETS 탄소가격 ───────────────────────────────────────────────────────
    /** 원/kgCO₂e (12,000원/톤) */
    public static final double COMPANY_KRW_PER_KG = 12.0;
}
