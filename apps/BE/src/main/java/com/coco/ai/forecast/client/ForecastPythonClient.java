package com.coco.ai.forecast.client;

import org.springframework.stereotype.Component;

import com.coco.ai.forecast.dto.EmissionTimeSeriesDTO;
// 파이썬 AI 모듈 호출 (지금은 구조만 있는 상태)
// 현재 패턴 유지 시 OO 배출할 것이다 = 평균값으로 계산 

@Component
public class ForecastPythonClient {
    public Double forecastNextMonthEmission(
            List<EmissionTimeSeriesDTO> series
    ) {
        /*
         * TODO:
         * 1. series → JSON
         * 2. Python API 호출 (REST or subprocess)
         * 3. 예측 결과(Double) 반환
         */

        // 지금은 임시
        return series.stream()
                .mapToDouble(EmissionTimeSeriesDTO::getEmissionKg)
                .average()
                .orElse(0.0);
    }
}
