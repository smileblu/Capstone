package com.coco.domain.company.service;

import com.coco.domain.company.dto.CompanyMyInfoResponse;
import com.coco.domain.company.dto.PasswordChangeRequest;
import com.coco.domain.company.entity.Company;
import com.coco.domain.company.repository.CompanyRepository;
import com.coco.domain.user.entity.User;
import com.coco.domain.user.repository.UserRepository;
import com.coco.global.error.code.GeneralErrorCode;
import com.coco.global.error.exception.GeneralException;
import com.coco.global.security.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CompanyMyInfoService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public CompanyMyInfoResponse getMyInfo() {
        Long userId = SecurityUtil.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));
        Company company = companyRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        return CompanyMyInfoResponse.builder()
                .companyName(company.getCompanyName())
                .businessNumber(company.getBusinessNumber())
                .industry(company.getIndustry())
                .employeeRange(company.getEmployeeRange())
                .workplaceCount(company.getWorkplaceCount())
                .managerName(user.getName())
                .department(company.getDepartment())
                .email(user.getEmail())
                .managementPurpose(company.getManagementPurpose())
                .plan(company.getPlan() != null ? company.getPlan() : "FREE")
                .build();
    }

    @Transactional
    public void changePassword(PasswordChangeRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new GeneralException(GeneralErrorCode.NOT_FOUND));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new GeneralException(GeneralErrorCode.UNAUTHORIZED);
        }

        user.changePassword(passwordEncoder.encode(request.getNewPassword()));
    }
}
