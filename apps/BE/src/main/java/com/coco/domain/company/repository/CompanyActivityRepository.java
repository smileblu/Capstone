package com.coco.domain.company.repository;

import com.coco.domain.company.entity.CompanyActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CompanyActivityRepository extends JpaRepository<CompanyActivity, Long> {

    List<CompanyActivity> findByCompany_CompanyIdAndBillingMonth(Long companyId, String billingMonth);

    List<CompanyActivity> findByCompany_CompanyIdAndBillingMonthIn(Long companyId, List<String> months);

    @Query("SELECT a FROM CompanyActivity a WHERE a.company.companyId = :companyId " +
           "AND a.billingMonth >= :fromMonth ORDER BY a.billingMonth ASC")
    List<CompanyActivity> findByCompanyIdSince(@Param("companyId") Long companyId,
                                               @Param("fromMonth") String fromMonth);

    boolean existsByCompany_CompanyIdAndTypeAndBillingMonth(Long companyId, String type, String billingMonth);
}
