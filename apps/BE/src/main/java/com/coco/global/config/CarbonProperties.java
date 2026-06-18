package com.coco.global.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 탄소 배출 관련 설정값.
 * application.yml의 carbon.* 값을 읽어오며, 관리자가 시장 가격 변동에 따라 업데이트할 수 있다.
 * 이 클래스가 K-ETS 단가의 단일 진실 공급원(single source of truth)이다 —
 * 기업(중소기업) 활동 데이터 저장, 시뮬레이션, ESG 보고서 등 모든 단가 계산은
 * 반드시 이 클래스를 통해서만 값을 읽어야 한다. (하드코딩 금지)
 *
 * 기준: 한국 탄소배출권 거래소(K-ETS) 시장가
 * 참고: https://ets.krx.co.kr
 */
@Component
@ConfigurationProperties(prefix = "carbon")
public class CarbonProperties {

    /**
     * CO2 1kg당 원화 환산 단가 (단위: 원/kg). 개인 사용자 탄소비용 환산에 사용.
     * K-ETS 시장가 기준으로 설정. 시장 변동 시 application.yml에서 업데이트.
     * 예) 시장가 10,000원/톤 → 10원/kg
     */
    private long wonPerKgCo2 = 10L;

    /**
     * K-ETS 탄소배출권 단가 (단위: 원/tCO₂e). 기업(중소기업) 전 영역 공통 단가.
     * 활동 데이터 저장(costKrw), 시뮬레이션 비용-편익 분석, ESG 보고서가
     * 모두 이 값을 참조한다. 시장 변동 시 application.yml의 carbon.kets-won-per-ton 만 수정하면
     * 전체 서비스에 동일하게 반영된다.
     */
    private long ketsWonPerTon = 23500L;

    /** K-ETS 단가의 기준일 (보고서에 출처로 표기됨). */
    private String ketsPriceBaseDate = "2026-06-01";

    /** K-ETS 단가의 출처 (보고서에 표기됨). */
    private String ketsPriceSource = "KRX KAU25 종가";

    public long getWonPerKgCo2() {
        return wonPerKgCo2;
    }

    public void setWonPerKgCo2(long wonPerKgCo2) {
        this.wonPerKgCo2 = wonPerKgCo2;
    }

    public long getKetsWonPerTon() {
        return ketsWonPerTon;
    }

    public void setKetsWonPerTon(long ketsWonPerTon) {
        this.ketsWonPerTon = ketsWonPerTon;
    }

    /** K-ETS 단가를 원/kg 단위로 환산 (활동 데이터의 costKrw 계산용). */
    public double getKetsWonPerKg() {
        return ketsWonPerTon / 1000.0;
    }

    public String getKetsPriceBaseDate() {
        return ketsPriceBaseDate;
    }

    public void setKetsPriceBaseDate(String ketsPriceBaseDate) {
        this.ketsPriceBaseDate = ketsPriceBaseDate;
    }

    public String getKetsPriceSource() {
        return ketsPriceSource;
    }

    public void setKetsPriceSource(String ketsPriceSource) {
        this.ketsPriceSource = ketsPriceSource;
    }
}
