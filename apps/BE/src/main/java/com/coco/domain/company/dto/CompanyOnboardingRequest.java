package com.coco.domain.company.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class CompanyOnboardingRequest {
    private String companyName;
    private String businessNumber;
    private String industry;
    private String employeeRange;
    private Integer workplaceCount;
    private String department;
    private List<String> emissionCategories;
    private String managementPurpose;
}
