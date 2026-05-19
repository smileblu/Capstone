package com.coco.domain.company.entity;

import com.coco.domain.user.entity.User;
import com.coco.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Company extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long companyId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    private String companyName;
    private String businessNumber;

    private String industry;       // MANUFACTURING, IT, DISTRIBUTION, CONSTRUCTION, SERVICE, FINANCE, OTHER
    private String employeeRange;  // lt10, 10to50, 50to100, 100to300, gt300
    private Integer workplaceCount;

    private String department;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "company_emission_categories", joinColumns = @JoinColumn(name = "company_id"))
    @Column(name = "category")
    @Builder.Default
    private List<String> emissionCategories = new ArrayList<>();

    private String managementPurpose;  // INTERNAL, CLIENT_SUBMISSION, ESG_COMPLIANCE

    public void update(String companyName, String businessNumber, String industry,
                       String employeeRange, Integer workplaceCount) {
        this.companyName = companyName;
        this.businessNumber = businessNumber;
        this.industry = industry;
        this.employeeRange = employeeRange;
        this.workplaceCount = workplaceCount;
    }

    public void updatePurpose(String managementPurpose, List<String> emissionCategories) {
        this.managementPurpose = managementPurpose;
        this.emissionCategories.clear();
        this.emissionCategories.addAll(emissionCategories);
    }
}
