package com.coco.ai.forecast.service;
//현재 패턴 유지 시 다음달 배출량 

import com.coco.ai.forecast.client.ForecastPythonClient;
import com.coco.ai.forecast.dto.EmissionTimeSeriesDTO;
import com.coco.emission.service.EmissionQueryService;

public class EmissionForecastService {
    private final EmissionQueryService emissionQueryService;
    private final ForecastPythonClient forecastPythonClient;

    public Double forecastNextMonth(Long userId) {

        List<EmissionTimeSeriesDTO> history =
                emissionQueryService.getUserEmissionSeries(userId);

        if (history.size() < 3) {
            throw new IllegalStateException("예측을 위한 데이터 부족");
        }

        return forecastPythonClient
                .forecastNextMonthEmission(history);
    }
    
}
