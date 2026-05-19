package com.coco.domain.company.repository;

import com.coco.domain.company.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    Optional<Company> findByUser_UserId(Long userId);
    boolean existsByUser_UserId(Long userId);
}
