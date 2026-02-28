package com.coco.domain.activity.dto;
import lombok.Getter;

@Getter
public class ConsumptionRequest {
    private Long userId; 
    private String category;
    private Integer count;
    private Boolean isOcr;
    private String receiptImageUrl;
    
}
