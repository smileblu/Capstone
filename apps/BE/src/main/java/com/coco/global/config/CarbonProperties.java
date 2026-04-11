package com.coco.global.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 탄소 배출 관련 설정값.
 * application.yml의 carbon.* 값을 읽어오며, 관리자가 시장 가격 변동에 따라 업데이트할 수 있다.
 *
 * 기준: 한국 탄소배출권 거래소(K-ETS) 시장가
 * 참고: https://ets.krx.co.kr
 */
@Component
@ConfigurationProperties(prefix = "carbon")
public class CarbonProperties {

    /**
     * CO2 1kg당 원화 환산 단가 (단위: 원/kg).
     * K-ETS 시장가 기준으로 설정. 시장 변동 시 application.yml에서 업데이트.
     * 예) 시장가 10,000원/톤 → 10원/kg
     */
    private long wonPerKgCo2 = 10L;

    public long getWonPerKgCo2() {
        return wonPerKgCo2;
    }

    public void setWonPerKgCo2(long wonPerKgCo2) {
        this.wonPerKgCo2 = wonPerKgCo2;
    }
}
