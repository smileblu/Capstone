package com.coco.domain.company.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class CompanyActivityResponse {
    private Long id;
    private String type;
    private String billingMonth;
    private BigDecimal co2eKg;
    private BigDecimal costKrw;
}
