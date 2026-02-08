package com.coco.emission.service;

import com.coco.ai.forecast.dto.EmissionTimeSeriesDTO;
import com.coco.emission.repository.EmissionResultRepository;

public class EmissionQueryService {
    private final EmissionResultRepository emissionResultRepository;

    public List<EmissionTimeSeriesDTO> getUserEmissionSeries(Long userId) {
        return emissionResultRepository
                .findByUserIdOrderByDateAsc(userId)
                .stream()
                .map(e -> new EmissionTimeSeriesDTO(
                        e.getDate(),
                        e.getEmissionKgco2e()
                ))
                .toList();
    }
}
