package com.coco.domain.activity.dto;

import lombok.Getter;

import java.time.LocalDate;

@Getter
public class ElectricityRequest {
    private Integer billAmount;
    private String usagePattern;
    private LocalDate periodStart;
    private LocalDate periodEnd;
}
