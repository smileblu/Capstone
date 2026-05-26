package com.coco.domain.company.repository;

import com.coco.domain.company.entity.ReportSnapshot;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReportSnapshotRepository extends JpaRepository<ReportSnapshot, Long> {

    List<ReportSnapshot> findByCompany_CompanyIdOrderByCreatedAtDesc(Long companyId, Pageable pageable);

    Optional<ReportSnapshot> findByIdAndCompany_CompanyId(Long id, Long companyId);
}
