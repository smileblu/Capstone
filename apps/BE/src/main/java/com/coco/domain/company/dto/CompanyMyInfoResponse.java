package com.coco.domain.company.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CompanyMyInfoResponse {
    // 기업 정보
    private String companyName;
    private String businessNumber;
    private String industry;
    private String employeeRange;
    private Integer workplaceCount;
    // 담당자 정보
    private String managerName;
    private String department;
    private String email;
    // 온보딩 설정
    private String managementPurpose;
    // 플랜
    private String plan;  // FREE / STANDARD / ENTERPRISE
}
