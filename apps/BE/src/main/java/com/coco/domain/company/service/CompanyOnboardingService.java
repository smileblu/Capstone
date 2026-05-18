package com.coco.domain.company.service;

import com.coco.domain.company.dto.CompanyOnboardingRequest;
import com.coco.domain.company.entity.Company;
import com.coco.domain.company.repository.CompanyRepository;
import com.coco.domain.user.entity.User;
import com.coco.domain.user.repository.UserRepository;
import com.coco.global.error.code.GeneralErrorCode;
import com.coco.global.error.exception.GeneralException;
import com.coco.global.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyOnboardingService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    @Transactional
    public void saveOnboarding(CompanyOnboardingRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        List<String> categories = request.getEmissionCategories() != null
                ? request.getEmissionCategories() : List.of();

        if (companyRepository.existsByUser_UserId(userId)) {
            // 기존 온보딩 정보 수정
            Company company = companyRepository.findByUser_UserId(userId).get();
            company.update(
                    request.getCompanyName(),
                    request.getBusinessNumber(),
                    request.getIndustry(),
                    request.getEmployeeRange(),
                    request.getWorkplaceCount()
            );
            company.updatePurpose(request.getManagementPurpose(), categories);
            return;
        }

        Company company = Company.builder()
                .user(user)
                .companyName(request.getCompanyName())
                .businessNumber(request.getBusinessNumber())
                .industry(request.getIndustry())
                .employeeRange(request.getEmployeeRange())
                .workplaceCount(request.getWorkplaceCount())
                .department(request.getDepartment())
                .emissionCategories(categories)
                .managementPurpose(request.getManagementPurpose())
                .build();

        companyRepository.save(company);
    }
}
