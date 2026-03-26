package com.coco.domain.ai.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_forecast_runs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class AiForecastRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** userId from signup/login */
    private Long userId;

    private String modelName;

    private LocalDate lastHistoryMonth; // YYYY-MM-01

    private int horizonMonths;

    @Lob
    /**
     * {
     *   "transport":[{"month":"YYYY-MM","emissionKg":...,"moneyWon":...}, ...],
     *   "consumption":[...],
     *   "electricity":[...]
     * }
     */
    private String forecastJson;

    @Enumerated(EnumType.STRING)
    private Status status;

    private LocalDateTime createdAt;

    public enum Status {
        CREATED,
        DONE,
        FAILED
    }
}

