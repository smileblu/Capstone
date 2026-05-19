package com.coco.domain.company.repository;

import com.coco.domain.company.entity.ExcelUploadHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExcelUploadHistoryRepository extends JpaRepository<ExcelUploadHistory, Long> {
    List<ExcelUploadHistory> findTop5ByCompany_CompanyIdAndCategoryOrderByCreatedAtDesc(Long companyId, String category);
}
