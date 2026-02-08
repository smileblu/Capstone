package com.coco.ai.forecast.dto;

import java.time.LocalDate;

public class EmissionTimeSeriesDTO {
    private LocalDate date;
    private Double emissionKg;

    public EmissionTimeSeriesDTO(LocalDate date, Double emissionKg) {
        this.date = date;
        this.emissionKg = emissionKg;
    }
}
